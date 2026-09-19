import React, { useState } from 'react';
import {
  MessageSquare,
  Mic,
  Send,
  Volume2,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  RotateCcw,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { UserProfile } from '../types';
import { ApiService } from '../services/api';
import { speechService } from '../services/speech';
import { LoadingState } from '../components/LoadingState';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

interface TalkScreenProps {
  profile: UserProfile;
  onStruggleSignal?: () => void;
  isSpeaking: boolean;
}

export const TalkScreen: React.FC<TalkScreenProps> = ({
  profile,
  onStruggleSignal,
  isSpeaking: _isSpeaking,
}) => {
  const isNight = !!profile.nightMode;
  const [talkMode, setTalkMode] = useState<'chat' | 'showmehow'>('chat');
  const [inputText, setInputText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      role: 'model',
      text:
        profile.language === 'hi'
          ? `नमस्ते ${profile.name} जी! मैं Sandhya हूँ। आज आपका दिन कैसा बीत रहा है?`
          : `Namaste ${profile.name} ji! I am Sandhya. How has your day been so far?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // "Show me how" state
  const [howToTask, setHowToTask] = useState<string>('');
  const [howToData, setHowToData] = useState<{
    taskTitle: string;
    steps: Array<{ stepNumber: number; instruction: string; tip?: string }>;
  } | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [stuckGuidance, setStuckGuidance] = useState<string | null>(null);
  const [showStuckInput, setShowStuckInput] = useState<boolean>(false);
  const [stuckObservation, setStuckObservation] = useState<string>('');

  // Sample tasks for instant demo
  const sampleTasks = [
    profile.language === 'hi' ? 'फोन से बिजली बिल कैसे भरें?' : 'How to pay electricity bill on phone?',
    profile.language === 'hi' ? 'व्हाट्सएप पर फोटो कैसे भेजें?' : 'How to send a photo on WhatsApp?',
    profile.language === 'hi' ? 'बैंक बैलेंस कैसे चेक करें?' : 'How to check my bank balance?',
  ];

  // Start voice listening
  const handleToggleVoice = () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    speechService.startListening(
      profile.language,
      (transcript) => {
        setInputText(transcript);
      },
      () => {
        setIsListening(false);
        if (onStruggleSignal) onStruggleSignal();
      },
      () => {
        setIsListening(false);
      }
    );
  };

  // Send message in Chat mode
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    setInputText('');

    const newMsg: ChatMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    setLoading(true);

    try {
      const history = updated.map((m) => ({ role: m.role, text: m.text }));
      const reply = await ApiService.sendCompanionChat(userText, history, profile.language);

      const botMsg: ChatMessage = {
        id: 'bot_' + Date.now(),
        role: 'model',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);

      // Automatically speak the reply aloud
      speechService.playChime('neutral');
      speechService.speak(reply, profile.language, profile.speechRate);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Start "Show Me How" flow
  const handleStartHowTo = async (taskString?: string) => {
    const task = taskString || howToTask;
    if (!task.trim()) return;

    setLoading(true);
    setStuckGuidance(null);
    setShowStuckInput(false);
    try {
      const data = await ApiService.getHowTo(task, profile.language);
      setHowToData(data);
      setCurrentStepIndex(0);

      // Speak first step aloud politely
      if (data.steps && data.steps.length > 0) {
        speechService.playChime('neutral');
        const first = data.steps[0];
        speechService.speak(
          `Step 1: ${first.instruction}. ${first.tip || ''}`,
          profile.language,
          profile.speechRate
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Next step in "Show Me How"
  const handleNextStep = () => {
    if (!howToData) return;
    setStuckGuidance(null);
    setShowStuckInput(false);

    if (currentStepIndex + 1 < howToData.steps.length) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      const s = howToData.steps[nextIdx];
      speechService.speak(
        `Step ${s.stepNumber}: ${s.instruction}. ${s.tip || ''}`,
        profile.language,
        profile.speechRate
      );
    }
  };

  // Previous step
  const handlePrevStep = () => {
    if (!howToData || currentStepIndex === 0) return;
    setStuckGuidance(null);
    setShowStuckInput(false);
    const prevIdx = currentStepIndex - 1;
    setCurrentStepIndex(prevIdx);
    const s = howToData.steps[prevIdx];
    speechService.speak(
      `Step ${s.stepNumber}: ${s.instruction}. ${s.tip || ''}`,
      profile.language,
      profile.speechRate
    );
  };

  // "I'm stuck" handler
  const handleImStuck = async () => {
    if (onStruggleSignal) onStruggleSignal();

    if (!stuckObservation.trim()) {
      setShowStuckInput(true);
      const promptText =
        profile.language === 'hi'
          ? 'कोई बात नहीं! आप अपनी स्क्रीन पर अभी क्या देख रहे हैं? बोलकर या लिखकर बताएं।'
          : 'Do not worry at all! What do you currently see on your screen? Tell me or type it.';
      speechService.speak(promptText, profile.language, profile.speechRate);
      return;
    }

    if (!howToData) return;
    const curStep = howToData.steps[currentStepIndex];

    setLoading(true);
    try {
      const guidance = await ApiService.getHowToStuckHelp(
        howToData.taskTitle,
        curStep.instruction,
        stuckObservation,
        profile.language
      );
      setStuckGuidance(guidance);
      setShowStuckInput(false);
      setStuckObservation('');
      speechService.speak(guidance, profile.language, profile.speechRate);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      id="screen-talk"
      className="pb-28 pt-2 px-3 sm:px-6 max-w-3xl mx-auto space-y-6"
    >
      {/* Top Banner with Modes Switcher */}
      <div
        className="p-6 rounded-[24px] twilight-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
        style={{
          backgroundColor: profile.highContrast
            ? '#111111'
            : isNight
            ? '#23225A'
            : '#FFFFFF',
          borderColor: isNight ? '#333270' : '#E4E1F5',
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
            style={{ backgroundColor: '#3B3A9E', color: '#FFFFFF' }}
          >
            <MessageSquare className="w-8 h-8" />
          </div>
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold font-heading tracking-tight"
              style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
            >
              {talkMode === 'chat'
                ? profile.language === 'hi'
                  ? 'बातचीत (Companion)'
                  : 'Talk to Sandhya'
                : profile.language === 'hi'
                ? 'मुझे सिखाएं (Show Me How)'
                : 'Show Me How'}
            </h1>
            <p
              className="text-base sm:text-lg font-medium"
              style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}
            >
              {talkMode === 'chat'
                ? profile.language === 'hi'
                  ? 'धैर्य और आदर से भरी बातचीत'
                  : 'Warm, patient voice companion.'
                : profile.language === 'hi'
                ? 'फोन का कोई भी काम एक-एक कदम करके सीखें'
                : 'Step-by-step guidance for any phone task.'}
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div
          className="p-1 rounded-full border flex items-center gap-1 w-full sm:w-auto"
          style={{
            backgroundColor: isNight ? '#1C1B45' : '#F4F2FF',
            borderColor: isNight ? '#333270' : '#E4E1F5',
          }}
        >
          <button
            onClick={() => setTalkMode('chat')}
            className="flex-1 sm:flex-initial px-5 py-2 rounded-full font-semibold text-base transition-all cursor-pointer"
            style={{
              backgroundColor: talkMode === 'chat' ? '#3B3A9E' : 'transparent',
              color: talkMode === 'chat' ? '#FFFFFF' : isNight ? '#B0B0D8' : '#3F3F66',
            }}
          >
            {profile.language === 'hi' ? 'बातचीत' : 'Friendly Chat'}
          </button>
          <button
            onClick={() => setTalkMode('showmehow')}
            className="flex-1 sm:flex-initial px-5 py-2 rounded-full font-semibold text-base transition-all cursor-pointer"
            style={{
              backgroundColor: talkMode === 'showmehow' ? '#3B3A9E' : 'transparent',
              color: talkMode === 'showmehow' ? '#FFFFFF' : isNight ? '#B0B0D8' : '#3F3F66',
            }}
          >
            {profile.language === 'hi' ? 'सिखाएं (Show me)' : 'Show me how'}
          </button>
        </div>
      </div>

      {loading && <LoadingState profile={profile} />}

      {/* MODE 1: FRIENDLY COMPANION CHAT (WhatsApp-style Friendly Bubbles: Sandhya in soft lavender/teal, Senior in deep indigo) */}
      {talkMode === 'chat' && (
        <section id="chat-messages-container" className="space-y-4">
          {/* Chat transcript list */}
          <div
            className="p-5 sm:p-7 rounded-[24px] twilight-card space-y-4 max-h-[480px] overflow-y-auto"
            style={{
              backgroundColor: profile.highContrast
                ? '#111111'
                : isNight
                ? '#23225A'
                : '#FFFFFF',
              borderColor: isNight ? '#333270' : '#E4E1F5',
            }}
          >
            {messages.map((m) => {
              const isUser = m.role === 'user';

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] p-4 sm:p-5 rounded-2xl text-xl sm:text-2xl font-medium leading-relaxed shadow-xs ${
                      isUser
                        ? 'rounded-tr-xs text-white'
                        : 'rounded-tl-xs border'
                    }`}
                    style={{
                      backgroundColor: isUser
                        ? '#3B3A9E'
                        : isNight
                        ? '#1C1B45'
                        : '#F4F2FF',
                      borderColor: isUser
                        ? 'transparent'
                        : isNight
                        ? '#333270'
                        : '#E4E1F5',
                      color: isUser
                        ? '#FFFFFF'
                        : isNight
                        ? '#F2F1FF'
                        : '#16163A',
                    }}
                  >
                    {m.text}
                  </div>

                  <div className="flex items-center gap-2 mt-1 px-2">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}
                    >
                      {m.timestamp}
                    </span>
                    {!isUser && (
                      <button
                        onClick={() => speechService.speak(m.text, profile.language, profile.speechRate)}
                        className="cursor-pointer transition-colors"
                        style={{ color: '#0F8B8D' }}
                        title="Read aloud"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Voice & Text Input Bar with Pulsing Ring on Active Microphone */}
          <div
            className="p-3 sm:p-4 rounded-[24px] twilight-card flex items-center gap-3 shadow-md"
            style={{
              backgroundColor: profile.highContrast
                ? '#111111'
                : isNight
                ? '#23225A'
                : '#FFFFFF',
              borderColor: isNight ? '#333270' : '#E4E1F5',
            }}
          >
            {/* Tap to Speak Microphone with Gentle Pulsing Ring */}
            <div className="relative shrink-0">
              {isListening && (
                <span
                  className="absolute -inset-1.5 rounded-2xl animate-ping opacity-75"
                  style={{ backgroundColor: '#0F8B8D' }}
                />
              )}
              <button
                id="btn-chat-mic"
                onClick={handleToggleVoice}
                className={`relative w-14 sm:w-16 h-14 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                  isListening
                    ? 'text-white shadow-lg ring-4 ring-[#0F8B8D]/40'
                    : 'text-white shadow-xs hover:scale-105'
                }`}
                style={{
                  backgroundColor: isListening ? '#0F8B8D' : '#3B3A9E',
                }}
                title={isListening ? 'Listening...' : 'Tap to speak'}
                aria-label="Tap to speak with Sandhya"
              >
                <Mic className="w-8 h-8" />
              </button>
            </div>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={
                isListening
                  ? profile.language === 'hi'
                    ? 'सुन रही हूँ... बोलें'
                    : 'Listening to you... speak comfortably'
                  : profile.language === 'hi'
                  ? 'बोलें या लिखें...'
                  : 'Speak or type to chat...'
              }
              className="flex-1 min-h-[56px] px-5 rounded-full border text-xl font-medium transition-colors"
              style={{
                backgroundColor: profile.highContrast
                  ? '#222222'
                  : isNight
                  ? '#1C1B45'
                  : '#FFFFFF',
                borderColor: isNight ? '#333270' : '#E4E1F5',
                color: isNight ? '#F2F1FF' : '#16163A',
              }}
            />

            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-transform active:scale-95 cursor-pointer shadow-sm"
              style={{ backgroundColor: '#0F8B8D' }}
              title="Send"
              aria-label="Send"
            >
              <Send className="w-7 h-7" />
            </button>
          </div>
        </section>
      )}

      {/* MODE 2: "SHOW ME HOW" STEP-BY-STEP */}
      {talkMode === 'showmehow' && (
        <section id="show-me-how-container" className="space-y-6">
          {!howToData ? (
            <div
              className="p-6 sm:p-8 rounded-[24px] twilight-card space-y-5"
              style={{
                backgroundColor: profile.highContrast
                  ? '#111111'
                  : isNight
                  ? '#23225A'
                  : '#FFFFFF',
                borderColor: isNight ? '#333270' : '#E4E1F5',
              }}
            >
              <h2
                className="text-xl sm:text-2xl font-bold font-heading"
                style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
              >
                {profile.language === 'hi' ? 'आप क्या सीखना चाहते हैं?' : 'What task do you want to learn?'}
              </h2>

              {/* Sample quick task chips */}
              <div className="space-y-2">
                <span
                  className="text-sm font-bold block"
                  style={{ color: '#0F8B8D' }}
                >
                  {profile.language === 'hi' ? 'लोकप्रिय उदाहरण:' : 'Quick examples:'}
                </span>
                <div className="flex flex-col gap-2">
                  {sampleTasks.map((st, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setHowToTask(st);
                        handleStartHowTo(st);
                      }}
                      className="p-4 rounded-2xl border text-left text-lg font-bold flex items-center justify-between transition-colors cursor-pointer hover:border-[#3B3A9E]"
                      style={{
                        backgroundColor: isNight ? '#1C1B45' : '#F9F8FE',
                        borderColor: isNight ? '#333270' : '#E4E1F5',
                        color: isNight ? '#F2F1FF' : '#16163A',
                      }}
                    >
                      <span>{st}</span>
                      <ArrowRight className="w-5 h-5" style={{ color: '#0F8B8D' }} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Input field */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={howToTask}
                  onChange={(e) => setHowToTask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStartHowTo()}
                  placeholder={
                    profile.language === 'hi'
                      ? 'उदा. ट्रेन टिकट कैसे बुक करें...'
                      : 'e.g. How to video call grandson...'
                  }
                  className="flex-1 min-h-[58px] px-5 rounded-full border text-xl font-bold transition-colors"
                  style={{
                    backgroundColor: profile.highContrast
                      ? '#222222'
                      : isNight
                      ? '#1C1B45'
                      : '#FFFFFF',
                    borderColor: isNight ? '#333270' : '#E4E1F5',
                    color: isNight ? '#F2F1FF' : '#16163A',
                  }}
                />
                <button
                  onClick={() => handleStartHowTo()}
                  disabled={!howToTask.trim()}
                  className="min-h-[58px] px-8 rounded-full font-semibold text-xl text-white disabled:opacity-40 shadow-sm cursor-pointer"
                  style={{ backgroundColor: '#3B3A9E' }}
                >
                  Start
                </button>
              </div>
            </div>
          ) : (
            /* ACTIVE STEP-BY-STEP DISPLAY */
            <div
              className="p-6 sm:p-8 rounded-[24px] twilight-card space-y-6"
              style={{
                backgroundColor: profile.highContrast
                  ? '#111111'
                  : isNight
                  ? '#23225A'
                  : '#FFFFFF',
                borderColor: isNight ? '#333270' : '#E4E1F5',
              }}
            >
              {/* Task Title & Step Count */}
              <div
                className="flex items-center justify-between border-b pb-4"
                style={{ borderColor: isNight ? '#333270' : '#E4E1F5' }}
              >
                <span
                  className="text-xl sm:text-2xl font-bold font-heading"
                  style={{ color: '#0F8B8D' }}
                >
                  Step {currentStepIndex + 1} of {howToData.steps.length}
                </span>

                <button
                  onClick={() => {
                    speechService.stopSpeaking();
                    setHowToData(null);
                  }}
                  className="text-base font-semibold flex items-center gap-1.5 cursor-pointer"
                  style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Choose other task</span>
                </button>
              </div>

              <h2
                className="text-2xl sm:text-3xl font-bold font-heading"
                style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
              >
                {howToData.taskTitle}
              </h2>

              {/* Huge Single Step Card */}
              <div
                className="p-6 sm:p-8 rounded-[20px] border text-2xl sm:text-3xl font-medium leading-snug space-y-4"
                style={{
                  backgroundColor: isNight ? '#1C1B45' : '#F4F2FF',
                  borderColor: isNight ? '#333270' : '#D1CEF0',
                  color: isNight ? '#F2F1FF' : '#16163A',
                }}
              >
                <p>{howToData.steps[currentStepIndex]?.instruction}</p>

                {howToData.steps[currentStepIndex]?.tip && (
                  <div
                    className="p-4 rounded-xl border text-lg sm:text-xl font-medium"
                    style={{
                      backgroundColor: isNight ? '#1A3340' : '#EAF6F5',
                      borderColor: '#0F8B8D',
                      color: '#0F8B8D',
                    }}
                  >
                    Tip: {howToData.steps[currentStepIndex].tip}
                  </div>
                )}
              </div>

              {/* Stuck Guidance Box if displayed */}
              {stuckGuidance && (
                <div
                  className="p-5 rounded-2xl border space-y-2"
                  style={{
                    backgroundColor: isNight ? '#1A3340' : '#EAF6F5',
                    borderColor: '#0F8B8D',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg" style={{ color: '#0F8B8D' }}>
                      {profile.language === 'hi' ? 'सरल मार्गदर्शन:' : 'Simplified Guidance:'}
                    </span>
                    <button
                      onClick={() => speechService.speak(stuckGuidance, profile.language, profile.speechRate)}
                      className="text-sm font-semibold flex items-center gap-1 cursor-pointer"
                      style={{ color: '#0F8B8D' }}
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Read aloud</span>
                    </button>
                  </div>
                  <p
                    className="text-xl font-medium leading-relaxed"
                    style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
                  >
                    {stuckGuidance}
                  </p>
                </div>
              )}

              {/* "What do you see on your screen?" Input when stuck clicked */}
              {showStuckInput && (
                <div
                  className="p-5 rounded-2xl border space-y-3"
                  style={{
                    backgroundColor: isNight ? '#1C1B45' : '#F4F2FF',
                    borderColor: isNight ? '#333270' : '#E4E1F5',
                  }}
                >
                  <label
                    className="block text-lg font-bold font-heading"
                    style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
                  >
                    {profile.language === 'hi'
                      ? 'आपकी स्क्रीन पर अभी क्या लिखा है?'
                      : 'What does your screen show right now?'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={stuckObservation}
                      onChange={(e) => setStuckObservation(e.target.value)}
                      placeholder="e.g. blue button, pop-up asking for permission"
                      className="flex-1 min-h-[54px] px-4 rounded-full border text-lg font-medium"
                      style={{
                        backgroundColor: profile.highContrast ? '#222222' : '#FFFFFF',
                        borderColor: isNight ? '#333270' : '#E4E1F5',
                        color: isNight ? '#F2F1FF' : '#16163A',
                      }}
                    />
                    <button
                      onClick={handleImStuck}
                      className="px-6 rounded-full font-semibold text-white cursor-pointer"
                      style={{ backgroundColor: '#0F8B8D' }}
                    >
                      Explain
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons: Next, Go back, I'm stuck, Read aloud */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Next Button */}
                {currentStepIndex + 1 < howToData.steps.length ? (
                  <button
                    onClick={handleNextStep}
                    className="min-h-[64px] rounded-full font-semibold text-2xl text-white flex items-center justify-center gap-3 shadow-md cursor-pointer transition-colors"
                    style={{ backgroundColor: '#3B3A9E' }}
                  >
                    <span>{profile.language === 'hi' ? 'अगला कदम (Next)' : 'Next Step'}</span>
                    <ArrowRight className="w-6 h-6" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      speechService.playChime('success');
                      setHowToData(null);
                    }}
                    className="min-h-[64px] rounded-full font-semibold text-2xl text-white flex items-center justify-center gap-3 shadow-md cursor-pointer"
                    style={{ backgroundColor: '#1B7F3B' }}
                  >
                    <CheckCircle className="w-6 h-6" />
                    <span>{profile.language === 'hi' ? 'काम पूरा हुआ! (Done)' : 'Finished!'}</span>
                  </button>
                )}

                {/* Read Aloud Step */}
                <button
                  onClick={() => {
                    const step = howToData.steps[currentStepIndex];
                    speechService.speak(
                      `Step ${step.stepNumber}: ${step.instruction}. ${step.tip || ''}`,
                      profile.language,
                      profile.speechRate
                    );
                  }}
                  className="min-h-[64px] rounded-full font-semibold text-xl border flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: isNight ? '#1C1B45' : '#EAF6F5',
                    color: '#0F8B8D',
                    borderColor: '#B2E2E0',
                  }}
                >
                  <Volume2 className="w-6 h-6 text-[#0F8B8D]" />
                  <span>{profile.language === 'hi' ? 'कदम बोलकर सुनें' : 'Read aloud'}</span>
                </button>

                {/* I'm Stuck Button */}
                <button
                  onClick={handleImStuck}
                  className="min-h-[60px] rounded-full font-semibold text-xl border flex items-center justify-center gap-2 cursor-pointer"
                  style={{
                    backgroundColor: isNight ? '#331515' : '#FFF4F4',
                    color: '#C62828',
                    borderColor: '#F8B4B4',
                  }}
                >
                  <HelpCircle className="w-6 h-6 text-[#C62828]" />
                  <span>{profile.language === 'hi' ? 'मैं अटक गया (I’m stuck)' : "I'm stuck"}</span>
                </button>

                {/* Go Back Step */}
                <button
                  onClick={handlePrevStep}
                  disabled={currentStepIndex === 0}
                  className="min-h-[60px] rounded-full font-semibold text-xl border flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                  style={{
                    backgroundColor: isNight ? '#23225A' : '#FFFFFF',
                    color: isNight ? '#F2F1FF' : '#3B3A9E',
                    borderColor: isNight ? '#8B8AF5' : '#3B3A9E',
                  }}
                >
                  <ArrowLeft className="w-6 h-6" />
                  <span>{profile.language === 'hi' ? 'पिछला कदम' : 'Go back'}</span>
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
};
