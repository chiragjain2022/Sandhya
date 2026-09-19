import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Upload,
  Mic,
  Volume2,
  Share2,
  RotateCcw,
  Sparkles,
  Hand,
  Check,
  ArrowRight,
} from 'lucide-react';
import {
  UserProfile,
  ScamVerdict,
  ScamClarificationQuestion,
  FamilyContact,
} from '../types';
import { ApiService } from '../services/api';
import { speechService } from '../services/speech';
import { LoadingState } from '../components/LoadingState';
import { ConfirmationModal } from '../components/ConfirmationModal';

interface CheckSomethingScreenProps {
  profile: UserProfile;
  familyContacts: FamilyContact[];
  onLogActivity: (title: string, details: string, color?: string) => void;
  isSpeaking: boolean;
}

export const CheckSomethingScreen: React.FC<CheckSomethingScreenProps> = ({
  profile,
  familyContacts,
  onLogActivity,
  isSpeaking: _isSpeaking,
}) => {
  const isNight = !!profile.nightMode;
  const [inputText, setInputText] = useState<string>('');
  const [inputMode, setInputMode] = useState<'paste' | 'photo' | 'describe'>('paste');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Flow stages: 'input' -> 'questions' -> 'verdict'
  const [flowStage, setFlowStage] = useState<'input' | 'questions' | 'verdict'>('input');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');

  // Clarification questions
  const [questions, setQuestions] = useState<ScamClarificationQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Array<{ question: string; answer: string }>>([]);

  // Final Verdict
  const [verdict, setVerdict] = useState<ScamVerdict | null>(null);

  // Tell family confirmation modal
  const [showFamilyModal, setShowFamilyModal] = useState<boolean>(false);
  const [familyMessagePreview, setFamilyMessagePreview] = useState<string>('');

  const primaryContact = familyContacts[0];

  // Try Sample Scam
  const handleTrySampleScam = () => {
    const sample =
      profile.language === 'hi'
        ? 'प्रिय ग्राहक, आपका SBI बैंक खाता आज 8 बजे ब्लॉक कर दिया जाएगा। तुरंत KYC नवीनीकरण के लिए यहाँ क्लिक करें: bit.ly/sbi-kyc-block'
        : profile.language === 'hinglish'
        ? 'Dear customer, aapka SBI account aaj raat block kar diya jaayega. Turant KYC update karein: bit.ly/sbi-kyc-alert'
        : 'Dear Customer, Your SBI account will be blocked today. Please update KYC immediately by tapping this link: bit.ly/sbi-kyc-verify';

    setInputText(sample);
    setInputMode('paste');
  };

  // Start Voice input
  const handleStartVoice = () => {
    setIsListening(true);
    speechService.startListening(
      profile.language,
      (transcript) => {
        setInputText(transcript);
      },
      () => {
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      if (!inputText) {
        setInputText('Screenshot of suspicious SMS / WhatsApp message attached.');
      }
    };
    reader.readAsDataURL(file);
  };

  // Step 1: Submit input to get 2-3 clarifying questions
  const handleStartAnalysis = async () => {
    if (!inputText.trim() && !imagePreview) return;

    setLoading(true);
    setLoadingMessage(
      profile.language === 'hi'
        ? 'Sandhya संदेश की जाँच शुरू कर रही है...'
        : 'Sandhya is carefully reading the message...'
    );

    try {
      const qList = await ApiService.getScamQuestions(inputText, profile.language);
      setQuestions(qList);
      setCurrentQIndex(0);
      setAnswers([]);
      setFlowStage('questions');

      // Speak the first question aloud politely
      if (qList.length > 0) {
        speechService.speak(qList[0].question, profile.language, profile.speechRate);
      }
    } catch (err) {
      console.error('Questions fetch error:', err);
      // Directly evaluate if questions error out
      await handleEvaluateVerdict([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle user answering one question at a time
  const handleAnswerQuestion = async (ans: string) => {
    const currentQ = questions[currentQIndex];
    const newAnswers = [...answers, { question: currentQ.question, answer: ans }];
    setAnswers(newAnswers);

    if (currentQIndex + 1 < questions.length) {
      const nextIdx = currentQIndex + 1;
      setCurrentQIndex(nextIdx);
      speechService.speak(questions[nextIdx].question, profile.language, profile.speechRate);
    } else {
      // All questions answered, generate verdict
      await handleEvaluateVerdict(newAnswers);
    }
  };

  // Step 2: Evaluate Final Verdict
  const handleEvaluateVerdict = async (answeredList: Array<{ question: string; answer: string }>) => {
    setLoading(true);
    setLoadingMessage(
      profile.language === 'hi'
        ? 'Sandhya अंतिम निष्कर्ष तैयार कर रही है...'
        : 'Sandhya is preparing your safety verdict...'
    );

    try {
      const result = await ApiService.getScamVerdict(inputText, answeredList, profile.language);
      setVerdict(result);
      setFlowStage('verdict');

      // Play audio chime and speak verdict headline & reason aloud automatically
      speechService.playChime(result.verdict === 'STOP' ? 'alert' : 'success');
      const speechText = `${result.verdict}! ${result.headline}. ${result.reason}`;
      speechService.speak(speechText, profile.language, profile.speechRate);

      // Log in activity
      onLogActivity(
        `Safety Check: ${result.verdict}`,
        result.headline,
        result.verdict === 'STOP' ? 'bg-red-50 text-[#C62828]' : 'bg-emerald-50 text-[#1B7F3B]'
      );
    } catch (err) {
      console.error('Verdict error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Prepare "Tell my family" WhatsApp/SMS message
  const handlePrepareFamilyAlert = () => {
    if (!verdict) return;

    const contactName = primaryContact ? primaryContact.name : 'Family';
    const message =
      profile.language === 'hi'
        ? `नमस्ते ${contactName}! मुझे एक संदिग्ध संदेश आया था। Sandhya ऐप ने चेतावनी दी है: "${verdict.headline}". कृपया कोई चिंता न करें, मैंने कोई लिंक नहीं खोला और न ही OTP दिया है।`
        : profile.language === 'hinglish'
        ? `Namaste ${contactName}! Mujhe ek suspicious message aaya tha. Sandhya app ne alert kiya: "${verdict.headline}". Chinta mat karna, maine koi link open nahi kiya na OTP diya.`
        : `Namaste ${contactName}! I received a suspicious message. Sandhya safety check warned: "${verdict.headline}". Do not worry, I did not click any link or share any OTP.`;

    setFamilyMessagePreview(message);
    setShowFamilyModal(true);
  };

  // Send via WhatsApp or SMS link
  const handleSendToFamilyConfirm = () => {
    setShowFamilyModal(false);
    const phone = primaryContact ? primaryContact.phone.replace(/[^0-9]/g, '') : '';
    const encoded = encodeURIComponent(familyMessagePreview);

    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  // Reset to check another message
  const handleReset = () => {
    speechService.stopSpeaking();
    setInputText('');
    setImagePreview(null);
    setFlowStage('input');
    setQuestions([]);
    setCurrentQIndex(0);
    setAnswers([]);
    setVerdict(null);
  };

  return (
    <main
      id="screen-check-something"
      className="pb-28 pt-2 px-3 sm:px-6 max-w-3xl mx-auto space-y-6"
    >
      {/* Title & Tagline Banner */}
      <div
        className="p-6 rounded-[24px] twilight-card flex items-center justify-between gap-4 transition-all"
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
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold font-heading tracking-tight"
              style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
            >
              {profile.language === 'hi' ? 'रोकें व जाँचें (The Pause Button)' : 'Check Something'}
            </h1>
            <p
              className="text-base sm:text-lg font-medium"
              style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}
            >
              {profile.language === 'hi'
                ? 'जल्दबाज़ी न करें। पहले Sandhya से पूछें।'
                : 'Pause before you tap or share. Check with Sandhya first.'}
            </p>
          </div>
        </div>

        {flowStage !== 'input' && (
          <button
            onClick={handleReset}
            className="h-11 px-4 rounded-full border font-semibold flex items-center gap-1.5 text-sm transition-colors cursor-pointer"
            style={{
              backgroundColor: isNight ? '#1C1B45' : '#F4F2FF',
              color: isNight ? '#8B8AF5' : '#3B3A9E',
              borderColor: isNight ? '#333270' : '#E4E1F5',
            }}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{profile.language === 'hi' ? 'नया जाँचें' : 'Check new'}</span>
          </button>
        )}
      </div>

      {loading && <LoadingState message={loadingMessage} profile={profile} />}

      {/* STAGE 1: INPUT OPTIONS (Big Card with 3 Input Tabs: Paste, Photo, Describe as Segmented Buttons) */}
      {!loading && flowStage === 'input' && (
        <section
          id="check-input-section"
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
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2
              className="text-xl sm:text-2xl font-bold font-heading"
              style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
            >
              {profile.language === 'hi'
                ? 'संदेश पेस्ट करें, फोटो दें या बोलकर बताएं:'
                : 'How would you like to check?'}
            </h2>

            {/* Quick Demo Sample Button */}
            <button
              id="btn-try-sample-scam"
              onClick={handleTrySampleScam}
              className="px-3.5 py-1.5 rounded-full font-semibold text-sm flex items-center gap-1.5 border transition-colors cursor-pointer"
              style={{
                backgroundColor: isNight ? '#1C1B45' : '#F4F2FF',
                color: isNight ? '#8B8AF5' : '#3B3A9E',
                borderColor: isNight ? '#333270' : '#E4E1F5',
              }}
            >
              <Sparkles className="w-4 h-4" style={{ color: '#E9B949' }} />
              <span>{profile.language === 'hi' ? 'नकली SMS उदाहरण' : 'Try sample scam SMS'}</span>
            </button>
          </div>

          {/* Segmented Buttons: Paste, Photo, Describe */}
          <div
            className="p-1.5 rounded-2xl border flex items-center gap-1.5"
            style={{
              backgroundColor: isNight ? '#1C1B45' : '#F4F2FF',
              borderColor: isNight ? '#333270' : '#E4E1F5',
            }}
          >
            {/* Tab 1: Paste */}
            <button
              onClick={() => setInputMode('paste')}
              className="flex-1 min-h-[52px] rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer"
              style={{
                backgroundColor: inputMode === 'paste' ? '#3B3A9E' : 'transparent',
                color: inputMode === 'paste' ? '#FFFFFF' : isNight ? '#B0B0D8' : '#3F3F66',
                boxShadow: inputMode === 'paste' ? '0 2px 8px rgba(59, 58, 158, 0.25)' : 'none',
              }}
            >
              <span>{profile.language === 'hi' ? 'पेस्ट करें' : 'Paste'}</span>
            </button>

            {/* Tab 2: Photo */}
            <label
              className="flex-1 min-h-[52px] rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer"
              style={{
                backgroundColor: inputMode === 'photo' ? '#3B3A9E' : 'transparent',
                color: inputMode === 'photo' ? '#FFFFFF' : isNight ? '#B0B0D8' : '#3F3F66',
                boxShadow: inputMode === 'photo' ? '0 2px 8px rgba(59, 58, 158, 0.25)' : 'none',
              }}
            >
              <Upload className="w-5 h-5" />
              <span>{profile.language === 'hi' ? 'फोटो' : 'Photo'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setInputMode('photo');
                  handleImageUpload(e);
                }}
                className="hidden"
              />
            </label>

            {/* Tab 3: Describe */}
            <button
              onClick={() => {
                setInputMode('describe');
                handleStartVoice();
              }}
              className="flex-1 min-h-[52px] rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer"
              style={{
                backgroundColor: inputMode === 'describe' ? '#3B3A9E' : 'transparent',
                color: inputMode === 'describe' ? '#FFFFFF' : isNight ? '#B0B0D8' : '#3F3F66',
                boxShadow: inputMode === 'describe' ? '0 2px 8px rgba(59, 58, 158, 0.25)' : 'none',
              }}
            >
              <Mic className="w-5 h-5" />
              <span>{profile.language === 'hi' ? 'बोलकर बताएं' : 'Describe'}</span>
            </button>
          </div>

          {/* Voice Listening indicator */}
          {isListening && (
            <div
              className="p-4 rounded-2xl border flex items-center gap-3 animate-pulse"
              style={{
                backgroundColor: isNight ? '#1A3340' : '#EAF6F5',
                borderColor: '#0F8B8D',
                color: '#0F8B8D',
              }}
            >
              <Mic className="w-6 h-6 shrink-0" />
              <p className="text-base font-bold">
                {profile.language === 'hi'
                  ? 'Sandhya सुन रही है... आप फोन कॉल या मैसेज के बारे में बताएं'
                  : 'Sandhya is listening... tell me what the caller or message said'}
              </p>
            </div>
          )}

          {/* Image preview */}
          {imagePreview && (
            <div
              className="relative border-2 border-dashed p-3 rounded-2xl max-w-sm mx-auto"
              style={{ borderColor: '#3B3A9E' }}
            >
              <img
                src={imagePreview}
                alt="Uploaded message"
                className="rounded-xl max-h-56 w-full object-contain"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={() => setImagePreview(null)}
                className="absolute top-4 right-4 bg-black/70 text-white rounded-full p-1.5 text-xs font-bold cursor-pointer"
              >
                Remove
              </button>
            </div>
          )}

          {/* Input Textarea */}
          <div>
            <textarea
              id="textarea-check-input"
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                profile.language === 'hi'
                  ? 'यहाँ SMS, WhatsApp संदेश पेस्ट करें या कॉल के बारे में लिखें...'
                  : 'Paste the SMS, WhatsApp text, email link, or describe the call here...'
              }
              className="w-full p-4 rounded-2xl border text-xl font-medium focus:border-[#3B3A9E] leading-relaxed transition-colors"
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
          </div>

          {/* Primary Action Button (Minimum 64px tall, solid indigo) */}
          <button
            id="btn-submit-check"
            onClick={handleStartAnalysis}
            disabled={!inputText.trim() && !imagePreview}
            className="w-full min-h-[64px] rounded-full font-semibold text-2xl flex items-center justify-center gap-3 text-white shadow-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            style={{ backgroundColor: '#3B3A9E' }}
          >
            <ShieldCheck className="w-7 h-7" />
            <span>{profile.language === 'hi' ? 'जाँचें: क्या यह सुरक्षित है?' : 'Check: Is this safe?'}</span>
          </button>
        </section>
      )}

      {/* STAGE 2: 2-3 SHORT CLARIFYING QUESTIONS (ONE AT A TIME) */}
      {!loading && flowStage === 'questions' && questions.length > 0 && (
        <section
          id="check-questions-section"
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
          <div
            className="flex items-center justify-between border-b pb-3"
            style={{ borderColor: isNight ? '#333270' : '#E4E1F5' }}
          >
            <span
              className="text-base font-bold"
              style={{ color: isNight ? '#8B8AF5' : '#3B3A9E' }}
            >
              Question {currentQIndex + 1} of {questions.length}
            </span>
            <button
              onClick={() => speechService.speak(questions[currentQIndex]?.question, profile.language, profile.speechRate)}
              className="px-3 py-1 rounded-full font-semibold flex items-center gap-1.5 text-sm cursor-pointer"
              style={{ color: '#0F8B8D' }}
            >
              <Volume2 className="w-5 h-5" />
              <span>Read question</span>
            </button>
          </div>

          <div className="py-2 text-center sm:text-left">
            <h2
              className="text-2xl sm:text-3xl font-bold font-heading leading-snug"
              style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
            >
              {questions[currentQIndex]?.question}
            </h2>
          </div>

          {/* Big Buttons for Yes / No / Not sure */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(questions[currentQIndex]?.options || ['Yes', 'No', 'Not sure']).map((opt, i) => (
              <button
                key={i}
                id={`btn-question-option-${i}`}
                onClick={() => handleAnswerQuestion(opt)}
                className="min-h-[64px] sm:min-h-[72px] rounded-full border-2 font-bold text-xl transition-all cursor-pointer flex items-center justify-center p-3"
                style={{
                  backgroundColor: isNight ? '#1C1B45' : '#FFFFFF',
                  color: isNight ? '#F2F1FF' : '#3B3A9E',
                  borderColor: isNight ? '#8B8AF5' : '#3B3A9E',
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* STAGE 3: DRAMATIC VERDICT CARD (Full-width, coloured header band, huge icon, headline, reason, red flags chips) */}
      {!loading && flowStage === 'verdict' && verdict && (
        <section
          id="check-verdict-section"
          className="space-y-6 transition-all duration-300 animate-fadeIn"
        >
          {/* Main Dramatic Verdict Card */}
          <div
            className="rounded-[24px] overflow-hidden border shadow-xl transition-all"
            style={{
              backgroundColor: isNight ? '#23225A' : '#FFFFFF',
              borderColor:
                verdict.verdict === 'STOP'
                  ? '#C62828'
                  : verdict.verdict === 'BE_CAREFUL'
                  ? '#A15C00'
                  : '#1B7F3B',
            }}
          >
            {/* Coloured Full-Width Header Band */}
            <div
              className="p-6 sm:p-7 text-white flex items-center justify-between gap-4"
              style={{
                backgroundColor:
                  verdict.verdict === 'STOP'
                    ? '#C62828'
                    : verdict.verdict === 'BE_CAREFUL'
                    ? '#A15C00'
                    : '#1B7F3B',
              }}
            >
              <div className="flex items-center gap-4">
                {/* Very Large Verdict Icon */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                  {verdict.verdict === 'STOP' ? (
                    <Hand className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  ) : verdict.verdict === 'BE_CAREFUL' ? (
                    <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  ) : (
                    <ShieldCheck className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  )}
                </div>

                <div>
                  <span className="text-3xl sm:text-4xl font-black font-heading tracking-wider uppercase">
                    {verdict.verdict === 'STOP'
                      ? 'STOP'
                      : verdict.verdict === 'BE_CAREFUL'
                      ? 'BE CAREFUL'
                      : 'SAFE'}
                  </span>
                  <p className="text-base sm:text-lg font-medium text-white/90 mt-0.5">
                    {verdict.verdict === 'STOP'
                      ? 'Do not click, share, or pay'
                      : verdict.verdict === 'BE_CAREFUL'
                      ? 'Proceed with caution'
                      : 'Verified safe to proceed'}
                  </p>
                </div>
              </div>

              {verdict.isFallback && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/20 text-white">
                  Local Check
                </span>
              )}
            </div>

            {/* Verdict Body */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Headline in Huge Text */}
              <h3
                className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight leading-snug"
                style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
              >
                {verdict.headline}
              </h3>

              {/* Reason in Simple Words */}
              <div
                className="p-5 rounded-2xl border text-xl sm:text-2xl font-medium leading-relaxed"
                style={{
                  backgroundColor: isNight ? '#1C1B45' : '#F4F2FF',
                  borderColor: isNight ? '#333270' : '#E4E1F5',
                  color: isNight ? '#F2F1FF' : '#16163A',
                }}
              >
                {verdict.reason}
              </div>

              {/* Read Aloud Button */}
              <div className="flex justify-end">
                <button
                  onClick={() =>
                    speechService.speak(
                      `${verdict.verdict}! ${verdict.headline}. ${verdict.reason}`,
                      profile.language,
                      profile.speechRate
                    )
                  }
                  className="px-5 py-2.5 rounded-full border font-semibold text-base flex items-center gap-2 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: isNight ? '#1C1B45' : '#EAF6F5',
                    color: '#0F8B8D',
                    borderColor: '#B2E2E0',
                  }}
                >
                  <Volume2 className="w-5 h-5" />
                  <span>Read aloud</span>
                </button>
              </div>

              {/* Red Flags as Chips */}
              {verdict.red_flags && verdict.red_flags.length > 0 && (
                <div className="space-y-2.5">
                  <h4
                    className="text-base font-bold uppercase tracking-wider"
                    style={{ color: '#C62828' }}
                  >
                    {profile.language === 'hi' ? 'खतरे के संकेत:' : 'Red flags detected:'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {verdict.red_flags.map((flag, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2 rounded-full border text-base font-bold flex items-center gap-2"
                        style={{
                          backgroundColor: isNight ? '#331515' : '#FFF4F4',
                          borderColor: '#F8B4B4',
                          color: '#C62828',
                        }}
                      >
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{flag}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* What to do now (Steps) */}
              {verdict.what_to_do_now && verdict.what_to_do_now.length > 0 && (
                <div className="space-y-3">
                  <h4
                    className="text-base font-bold uppercase tracking-wider"
                    style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
                  >
                    {profile.language === 'hi' ? 'अब क्या करें:' : 'What to do right now:'}
                  </h4>
                  <div className="space-y-2">
                    {verdict.what_to_do_now.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl border flex items-center gap-3.5"
                        style={{
                          backgroundColor: isNight ? '#1C1B45' : '#F9F8FE',
                          borderColor: isNight ? '#333270' : '#E4E1F5',
                          color: isNight ? '#F2F1FF' : '#16163A',
                        }}
                      >
                        <span
                          className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-sm shrink-0"
                          style={{ backgroundColor: '#0F8B8D' }}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-lg font-medium">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Never Do Warning */}
              {verdict.never_do && verdict.never_do.length > 0 && (
                <div
                  className="p-4.5 rounded-2xl border font-bold text-lg flex items-center gap-3"
                  style={{
                    backgroundColor: isNight ? '#331515' : '#FFF4F4',
                    borderColor: '#C62828',
                    color: '#C62828',
                  }}
                >
                  <Hand className="w-6 h-6 shrink-0" />
                  <span>{verdict.never_do.join(' • ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons: "Tell My Family" & "Check Another Message" */}
          <div className="flex flex-col sm:flex-row gap-3">
            {(verdict.verdict === 'STOP' || verdict.verdict === 'BE_CAREFUL') && (
              <button
                id="btn-tell-family"
                onClick={handlePrepareFamilyAlert}
                className="flex-1 min-h-[64px] rounded-full font-semibold text-xl text-white flex items-center justify-center gap-3 px-6 shadow-md transition-colors cursor-pointer"
                style={{ backgroundColor: '#0F8B8D' }}
              >
                <Share2 className="w-6 h-6" />
                <span>
                  {profile.language === 'hi'
                    ? 'परिवार को बताएं (WhatsApp)'
                    : 'Tell my family (WhatsApp)'}
                </span>
              </button>
            )}

            <button
              onClick={handleReset}
              className="flex-1 min-h-[64px] rounded-full font-semibold text-xl border-2 flex items-center justify-center gap-3 px-6 transition-colors cursor-pointer"
              style={{
                backgroundColor: isNight ? '#23225A' : '#FFFFFF',
                color: isNight ? '#F2F1FF' : '#3B3A9E',
                borderColor: isNight ? '#8B8AF5' : '#3B3A9E',
              }}
            >
              <RotateCcw className="w-6 h-6" />
              <span>{profile.language === 'hi' ? 'कुछ और जाँचें' : 'Check another'}</span>
            </button>
          </div>
        </section>
      )}

      {/* Confirmation Modal before sending WhatsApp/SMS to family */}
      <ConfirmationModal
        isOpen={showFamilyModal}
        title={profile.language === 'hi' ? 'परिवार को संदेश भेजना है?' : 'Send warning note to family?'}
        message={familyMessagePreview}
        confirmLabel={profile.language === 'hi' ? 'हाँ, WhatsApp खोलें' : 'Yes, open WhatsApp'}
        cancelLabel={profile.language === 'hi' ? 'नहीं, रहने दें' : 'Cancel'}
        onConfirm={handleSendToFamilyConfirm}
        onCancel={() => setShowFamilyModal(false)}
        language={profile.language}
        highContrast={profile.highContrast}
      />
    </main>
  );
};
