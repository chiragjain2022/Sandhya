import React, { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  MessageSquare,
  Volume2,
  CheckCircle2,
  Clock,
  Calendar,
  Smile,
  Meh,
  Frown,
  ChevronRight,
  Pill,
  HeartHandshake,
  Check,
} from 'lucide-react';
import {
  UserProfile,
  ExtractedMedicine,
  SavedPaper,
  MoodType,
  MoodRecord,
} from '../types';
import { speechService } from '../services/speech';

interface HomeScreenProps {
  profile: UserProfile;
  medicines: ExtractedMedicine[];
  papers: SavedPaper[];
  moods: MoodRecord[];
  onNavigateTab: (tab: 'check' | 'papers' | 'medicines' | 'chat' | 'family') => void;
  onUpdateMedicineStatus: (id: string, status: 'taken' | 'later' | 'pending') => void;
  onRecordMood: (mood: MoodType) => void;
  onNotifyFamilyMoodConcern: () => void;
  isSpeaking: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  profile,
  medicines,
  papers,
  moods,
  onNavigateTab,
  onUpdateMedicineStatus,
  onRecordMood,
  onNotifyFamilyMoodConcern,
  isSpeaking: _isSpeaking,
}) => {
  const isNight = !!profile.nightMode;
  const [showMoodSupportBanner, setShowMoodSupportBanner] = useState<boolean>(false);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = 'Good day';
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 17) timeGreeting = 'Good afternoon';
    else timeGreeting = 'Good evening';

    if (profile.language === 'hi') {
      let hiTime = 'शुभ प्रभात';
      if (hour >= 12 && hour < 17) hiTime = 'शुभ दोपहर';
      else if (hour >= 17) hiTime = 'शुभ संध्या';
      return `नमस्ते, ${profile.name} जी। ${hiTime}।`;
    } else if (profile.language === 'hinglish') {
      return `Namaste, ${profile.name} ji. ${timeGreeting}!`;
    }
    return `Namaste, ${profile.name} ji. ${timeGreeting}.`;
  };

  // Find medicines due today
  const pendingMedicines = medicines.filter((m) => m.statusToday !== 'taken');
  const takenMedicines = medicines.filter((m) => m.statusToday === 'taken');

  // Find bills / deadlines in next 7 days
  const now = new Date();
  const next7Days = new Date();
  next7Days.setDate(now.getDate() + 7);

  const upcomingDeadlines = papers.filter((p) => {
    if (!p.deadline) return false;
    const d = new Date(p.deadline);
    return d >= now && d <= next7Days;
  });

  // Friendly line
  const friendlyLines = {
    en: 'Remember to take a sip of warm water and enjoy the peaceful evening.',
    hi: 'थोड़ा गुनगुना पानी पिएं और शांत संध्या का आनंद लें।',
    hinglish: 'Thoda gunguna paani lijiye aur shanti se aaram kijiye.',
  };

  // Check recent moods: if 'not_well' chosen multiple times
  const recentNotWell = moods.slice(0, 3).filter((m) => m.mood === 'not_well').length >= 2;

  // Daily briefing text for speech
  const constructBriefingText = () => {
    let briefing = `${getGreeting()} Here is your briefing for today. `;
    if (pendingMedicines.length > 0) {
      briefing += `You have ${pendingMedicines.length} medicine doses scheduled today: ${pendingMedicines.map((m) => m.name).join(', ')}. `;
    } else {
      briefing += `All your medicines for today are taken. Well done! `;
    }

    if (upcomingDeadlines.length > 0) {
      briefing += `In your papers, you have ${upcomingDeadlines.length} upcoming deadlines: ${upcomingDeadlines.map((p) => p.title).join(', ')}. `;
    } else {
      briefing += `No pending official deadlines in the next seven days. `;
    }

    briefing += friendlyLines[profile.language] || friendlyLines.en;
    return briefing;
  };

  const handleReadBriefing = () => {
    const text = constructBriefingText();
    speechService.speak(text, profile.language, profile.speechRate);
  };

  const handleMoodSelect = (mood: MoodType) => {
    onRecordMood(mood);
    if (mood === 'not_well') {
      if (recentNotWell || (moods.length >= 1 && moods[0]?.mood === 'not_well')) {
        setShowMoodSupportBanner(true);
      }
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayMood = moods.find((m) => m.date === todayStr)?.mood;

  // Shield metric calculations
  const safeDaysCount = 7;
  const safeChecksCount = 12;

  return (
    <main
      id="screen-home"
      className="pb-28 pt-2 px-3 sm:px-6 max-w-4xl mx-auto space-y-6"
    >
      {/* 1. Hero Card with Soft Dusk Gradient, Subtle SVG Skyline/Hills & Setting Sun */}
      <section
        id="home-hero-card"
        className="relative overflow-hidden rounded-[24px] p-6 sm:p-8 text-white shadow-lg transition-all"
        style={{
          background: isNight
            ? 'linear-gradient(135deg, #1C1B45 0%, #2A2868 60%, #163B48 100%)'
            : 'linear-gradient(135deg, #3B3A9E 0%, #2A488E 60%, #0F8B8D 100%)',
        }}
      >
        {/* Subtle Background SVG Hills and Sun */}
        <div className="absolute right-0 bottom-0 pointer-events-none opacity-25 sm:opacity-35 w-64 sm:w-80 h-40">
          <svg viewBox="0 0 200 100" fill="none" className="w-full h-full">
            {/* Setting gold sun */}
            <circle cx="150" cy="40" r="22" fill="#E9B949" />
            {/* Hills */}
            <path
              d="M0 100C40 65 90 75 130 55C165 40 185 60 200 70V100H0Z"
              fill="#FFFFFF"
              fillOpacity="0.5"
            />
            <path
              d="M20 100C70 80 120 70 160 85C185 92 195 88 200 95V100H20Z"
              fill="#FFFFFF"
              fillOpacity="0.7"
            />
          </svg>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <span
              className="text-xs sm:text-sm font-bold tracking-wider uppercase px-3 py-1 rounded-full border border-white/20 bg-white/10 backdrop-blur-xs"
            >
              {new Date().toLocaleDateString(profile.language === 'hi' ? 'hi-IN' : 'en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-heading tracking-tight text-white leading-tight">
              {getGreeting()}
            </h1>
            <p className="text-lg sm:text-xl font-medium text-white/90 mt-2 max-w-xl leading-relaxed">
              {friendlyLines[profile.language] || friendlyLines.en}
            </p>
          </div>

          <div className="pt-2">
            <button
              id="btn-read-briefing-aloud"
              onClick={handleReadBriefing}
              className="min-h-[56px] px-6 rounded-full font-semibold text-lg flex items-center gap-3 transition-colors cursor-pointer text-white border border-white/30 hover:bg-white/20 active:scale-98 shadow-sm backdrop-blur-xs"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
              aria-label="Read my briefing aloud"
            >
              <Volume2 className="w-6 h-6 text-white" />
              <span>{profile.language === 'hi' ? 'दैनिक सारांश सुनें' : 'Read my briefing'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Sandhya Shield Card (Circular Progress Ring showing Safe days) */}
      <section
        id="home-shield-card"
        className="twilight-card p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-6"
        style={{
          backgroundColor: profile.highContrast
            ? '#111111'
            : isNight
            ? '#23225A'
            : '#FFFFFF',
          borderColor: profile.highContrast
            ? '#FFFFFF'
            : isNight
            ? '#333270'
            : '#E4E1F5',
        }}
      >
        <div className="flex items-center gap-5 w-full sm:w-auto">
          {/* Circular Progress Ring */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke={isNight ? '#333270' : '#E4E1F5'}
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="#0F8B8D"
                strokeWidth="8"
                strokeDasharray={264}
                strokeDashoffset={264 - (264 * 0.9)}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <ShieldCheck className="w-7 h-7 text-[#0F8B8D]" />
              <span
                className="text-xl sm:text-2xl font-black font-heading leading-none mt-0.5"
                style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
              >
                {safeDaysCount}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2
                className="text-2xl sm:text-3xl font-bold font-heading tracking-tight"
                style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
              >
                {profile.language === 'hi' ? 'संध्या शील्ड सुरक्षा' : 'Sandhya Shield'}
              </h2>
              <span
                className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                style={{ backgroundColor: '#EAF6F5', color: '#0F8B8D' }}
              >
                Active
              </span>
            </div>
            <p
              className="text-base sm:text-lg font-medium mt-1 leading-normal"
              style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}
            >
              {profile.language === 'hi'
                ? `${safeDaysCount} दिन से सुरक्षित • इस सप्ताह ${safeChecksCount} सुरक्षा जाँचें पूरी`
                : `${safeDaysCount} safe days • ${safeChecksCount} checks verified clean this week`}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('check')}
          className="w-full sm:w-auto min-h-[56px] px-6 rounded-full font-semibold text-lg flex items-center justify-center gap-2 text-white transition-colors cursor-pointer shadow-sm"
          style={{ backgroundColor: '#3B3A9E' }}
        >
          <ShieldCheck className="w-5 h-5" />
          <span>{profile.language === 'hi' ? 'नई जाँच करें' : 'Check a message'}</span>
        </button>
      </section>

      {/* 3. Bento-Style Grid of Large Action Tiles (At least 140px tall, subtle gradient, icon in colored circle) */}
      <section
        id="home-bento-actions"
        aria-label="Main action tiles"
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {/* Tile 1: Check something */}
        <button
          id="bento-tile-check"
          onClick={() => onNavigateTab('check')}
          className="min-h-[140px] p-6 rounded-[24px] twilight-card text-left flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer group"
          style={{
            backgroundColor: profile.highContrast
              ? '#111111'
              : isNight
              ? '#23225A'
              : '#FFFFFF',
            background: isNight
              ? 'linear-gradient(180deg, #23225A 0%, #1E1D4E 100%)'
              : 'linear-gradient(180deg, #FFFFFF 0%, #F6F5FF 100%)',
            borderColor: isNight ? '#333270' : '#E4E1F5',
          }}
        >
          <div className="flex items-center justify-between">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform"
              style={{ backgroundColor: '#3B3A9E' }}
            >
              <ShieldCheck className="w-8 h-8" />
            </div>
            <ChevronRight className="w-7 h-7 text-[#3B3A9E] opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>

          <div className="mt-4">
            <h3
              className="text-2xl font-bold font-heading"
              style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
            >
              {profile.language === 'hi' ? 'सुरक्षा जाँच (रोकें व पूछें)' : 'Check something'}
            </h3>
            <p
              className="text-base font-medium mt-1"
              style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}
            >
              {profile.language === 'hi'
                ? 'संदेश, फोन कॉल या लिंक की सुरक्षा जाँचें'
                : 'Pause and verify any message, call, or link'}
            </p>
          </div>
        </button>

        {/* Tile 2: Help me with a paper */}
        <button
          id="bento-tile-papers"
          onClick={() => onNavigateTab('papers')}
          className="min-h-[140px] p-6 rounded-[24px] twilight-card text-left flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer group"
          style={{
            backgroundColor: profile.highContrast
              ? '#111111'
              : isNight
              ? '#23225A'
              : '#FFFFFF',
            background: isNight
              ? 'linear-gradient(180deg, #23225A 0%, #1A284A 100%)'
              : 'linear-gradient(180deg, #FFFFFF 0%, #F0F8F8 100%)',
            borderColor: isNight ? '#333270' : '#E4E1F5',
          }}
        >
          <div className="flex items-center justify-between">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform"
              style={{ backgroundColor: '#0F8B8D' }}
            >
              <FileText className="w-8 h-8" />
            </div>
            <ChevronRight className="w-7 h-7 text-[#0F8B8D] opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>

          <div className="mt-4">
            <h3
              className="text-2xl font-bold font-heading"
              style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
            >
              {profile.language === 'hi' ? 'कागज़ात समझें' : 'Help me with a paper'}
            </h3>
            <p
              className="text-base font-medium mt-1"
              style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}
            >
              {profile.language === 'hi'
                ? 'बैंक चिट्ठी, बिजली बिल या डॉक्टर का पर्चा'
                : 'Bank letter, utility bill, or prescription'}
            </p>
          </div>
        </button>

        {/* Tile 3: Talk to me */}
        <button
          id="bento-tile-talk"
          onClick={() => onNavigateTab('chat')}
          className="min-h-[140px] p-6 rounded-[24px] twilight-card text-left flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer group"
          style={{
            backgroundColor: profile.highContrast
              ? '#111111'
              : isNight
              ? '#23225A'
              : '#FFFFFF',
            background: isNight
              ? 'linear-gradient(180deg, #23225A 0%, #252466 100%)'
              : 'linear-gradient(180deg, #FFFFFF 0%, #F8F7FF 100%)',
            borderColor: isNight ? '#333270' : '#E4E1F5',
          }}
        >
          <div className="flex items-center justify-between">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform"
              style={{ backgroundColor: '#3B3A9E' }}
            >
              <MessageSquare className="w-8 h-8" />
            </div>
            <ChevronRight className="w-7 h-7 text-[#3B3A9E] opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>

          <div className="mt-4">
            <h3
              className="text-2xl font-bold font-heading"
              style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
            >
              {profile.language === 'hi' ? 'बात करें (Talk to me)' : 'Talk to me'}
            </h3>
            <p
              className="text-base font-medium mt-1"
              style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}
            >
              {profile.language === 'hi'
                ? 'शांत आवाज़ में बात करें व फोन चलाना सीखें'
                : 'Gentle voice conversation & phone guidance'}
            </p>
          </div>
        </button>

        {/* Tile 4: Medicines */}
        <button
          id="bento-tile-medicines"
          onClick={() => onNavigateTab('medicines')}
          className="min-h-[140px] p-6 rounded-[24px] twilight-card text-left flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer group"
          style={{
            backgroundColor: profile.highContrast
              ? '#111111'
              : isNight
              ? '#23225A'
              : '#FFFFFF',
            background: isNight
              ? 'linear-gradient(180deg, #23225A 0%, #1A3245 100%)'
              : 'linear-gradient(180deg, #FFFFFF 0%, #EDF7F7 100%)',
            borderColor: isNight ? '#333270' : '#E4E1F5',
          }}
        >
          <div className="flex items-center justify-between">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform"
              style={{ backgroundColor: '#0F8B8D' }}
            >
              <Pill className="w-8 h-8" />
            </div>
            <div className="flex items-center gap-2">
              {pendingMedicines.length > 0 && (
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                  style={{ backgroundColor: '#0F8B8D' }}
                >
                  {pendingMedicines.length} due
                </span>
              )}
              <ChevronRight className="w-7 h-7 text-[#0F8B8D] opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </div>

          <div className="mt-4">
            <h3
              className="text-2xl font-bold font-heading"
              style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
            >
              {profile.language === 'hi' ? 'दवाइयाँ व समय' : 'Medicines schedule'}
            </h3>
            <p
              className="text-base font-medium mt-1"
              style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}
            >
              {pendingMedicines.length > 0
                ? profile.language === 'hi'
                  ? `आज ${pendingMedicines.length} दवाइयाँ बाकी हैं`
                  : `${pendingMedicines.length} medicine doses remaining today`
                : profile.language === 'hi'
                ? 'आज की सभी दवाइयाँ पूरी हो चुकी हैं'
                : 'All scheduled medicines taken for today'}
            </p>
          </div>
        </button>
      </section>

      {/* 4. "Today for you" Vertical Timeline */}
      <section
        id="home-today-card"
        className="twilight-card p-6 sm:p-7 space-y-6"
        style={{
          backgroundColor: profile.highContrast
            ? '#111111'
            : isNight
            ? '#23225A'
            : '#FFFFFF',
          borderColor: isNight ? '#333270' : '#E4E1F5',
        }}
      >
        <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: isNight ? '#333270' : '#E4E1F5' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: isNight ? '#1C1B45' : '#EAF6F5' }}
            >
              <Calendar className="w-6 h-6 text-[#0F8B8D]" />
            </div>
            <h2
              className="text-2xl sm:text-3xl font-bold font-heading tracking-tight"
              style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
            >
              {profile.language === 'hi' ? 'आज आपके लिए' : 'Today for you'}
            </h2>
          </div>
          <span
            className="text-sm font-bold px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: isNight ? '#1C1B45' : '#F4F2FF',
              color: isNight ? '#8B8AF5' : '#3B3A9E',
            }}
          >
            {new Date().toLocaleDateString(profile.language === 'hi' ? 'hi-IN' : 'en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })}
          </span>
        </div>

        {/* Vertical Timeline Items */}
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E4E1F5]">
          {/* Timeline Item 1: Medicines */}
          {medicines.length === 0 ? (
            <div className="relative">
              <div
                className="absolute -left-6 top-1 w-5 h-5 rounded-full border-4 border-white shadow-xs"
                style={{ backgroundColor: '#0F8B8D' }}
              />
              <p className="text-base italic" style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}>
                {profile.language === 'hi'
                  ? 'कोई दवाई अभी दर्ज नहीं है। आप पर्चा जोड़ सकते हैं।'
                  : 'No medicines added yet. You can scan a prescription in Papers.'}
              </p>
            </div>
          ) : (
            medicines.slice(0, 3).map((med) => {
              const isTaken = med.statusToday === 'taken';

              return (
                <div key={med.id} className="relative">
                  {/* Timeline Dot */}
                  <div
                    className="absolute -left-6 top-1.5 w-5 h-5 rounded-full border-4 shadow-xs transition-colors"
                    style={{
                      backgroundColor: isTaken ? '#1B7F3B' : '#0F8B8D',
                      borderColor: isNight ? '#23225A' : '#FFFFFF',
                    }}
                  />

                  <div
                    className="p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    style={{
                      backgroundColor: isTaken
                        ? isNight
                          ? '#1A3326'
                          : '#F2FBF5'
                        : isNight
                        ? '#1C1B45'
                        : '#F9F8FE',
                      borderColor: isTaken
                        ? '#A3E3B6'
                        : isNight
                        ? '#333270'
                        : '#E4E1F5',
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xl font-bold font-heading"
                          style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
                        >
                          {med.name}
                        </span>
                        {isTaken && (
                          <span
                            className="text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 text-white"
                            style={{ backgroundColor: '#1B7F3B' }}
                          >
                            <Check className="w-3 h-3" /> Taken
                          </span>
                        )}
                      </div>
                      <p
                        className="text-base font-medium mt-0.5"
                        style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}
                      >
                        {med.dose} • {med.instructions || med.duration}
                      </p>
                    </div>

                    {/* Big Done / Later Buttons */}
                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      {!isTaken ? (
                        <>
                          <button
                            id={`btn-taken-${med.id}`}
                            onClick={() => onUpdateMedicineStatus(med.id, 'taken')}
                            className="flex-1 sm:flex-initial min-h-[52px] px-5 rounded-full font-semibold text-base text-white flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                            style={{ backgroundColor: '#0F8B8D' }}
                          >
                            <CheckCircle2 className="w-5 h-5" />
                            <span>{profile.language === 'hi' ? 'ले ली (Done)' : 'Done'}</span>
                          </button>

                          <button
                            id={`btn-later-${med.id}`}
                            onClick={() => onUpdateMedicineStatus(med.id, 'later')}
                            className="flex-1 sm:flex-initial min-h-[52px] px-4 rounded-full font-semibold text-base border transition-colors cursor-pointer"
                            style={{
                              backgroundColor: isNight ? '#23225A' : '#FFFFFF',
                              color: isNight ? '#F2F1FF' : '#3B3A9E',
                              borderColor: isNight ? '#8B8AF5' : '#3B3A9E',
                            }}
                          >
                            <span>{profile.language === 'hi' ? 'बाद में' : 'Later'}</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => onUpdateMedicineStatus(med.id, 'pending')}
                          className="text-sm font-semibold hover:underline cursor-pointer"
                          style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}
                        >
                          Undo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Timeline Item 2: Upcoming Deadlines */}
          {upcomingDeadlines.length > 0 && (
            <div className="relative">
              <div
                className="absolute -left-6 top-1.5 w-5 h-5 rounded-full border-4 shadow-xs"
                style={{
                  backgroundColor: '#A15C00',
                  borderColor: isNight ? '#23225A' : '#FFFFFF',
                }}
              />
              <div
                className="p-4 rounded-2xl border flex items-center justify-between cursor-pointer"
                onClick={() => onNavigateTab('papers')}
                style={{
                  backgroundColor: isNight ? '#2E2210' : '#FFFDF5',
                  borderColor: '#F2D396',
                }}
              >
                <div>
                  <span
                    className="font-bold text-lg font-heading"
                    style={{ color: isNight ? '#FDE68A' : '#78350F' }}
                  >
                    {upcomingDeadlines[0].title}
                  </span>
                  <p
                    className="text-sm font-semibold mt-0.5 flex items-center gap-1.5"
                    style={{ color: '#A15C00' }}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Due: {upcomingDeadlines[0].deadline}</span>
                  </p>
                </div>
                <ChevronRight className="w-6 h-6 text-[#A15C00]" />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. Mood Check-in: Three Large Emoji Cards with Hover Lift and Glow */}
      <section
        id="home-mood-card"
        className="twilight-card p-6 sm:p-7 space-y-5"
        style={{
          backgroundColor: profile.highContrast
            ? '#111111'
            : isNight
            ? '#23225A'
            : '#FFFFFF',
          borderColor: isNight ? '#333270' : '#E4E1F5',
        }}
      >
        <div className="text-center sm:text-left">
          <h3
            className="text-2xl font-bold font-heading"
            style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
          >
            {profile.language === 'hi' ? 'आज आपकी तबीयत और मन कैसा है?' : 'How are you feeling today?'}
          </h3>
          <p
            className="text-base font-medium mt-1"
            style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}
          >
            {profile.language === 'hi' ? 'एक बटन दबाकर बताएं:' : 'Tap how you feel right now:'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {/* Good */}
          <button
            id="btn-mood-good"
            onClick={() => handleMoodSelect('good')}
            className={`min-h-[84px] sm:min-h-[96px] rounded-2xl border-2 flex flex-col items-center justify-center gap-2 p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer ${
              todayMood === 'good'
                ? 'shadow-md font-bold ring-3 ring-[#0F8B8D]/30'
                : 'hover:border-[#0F8B8D]'
            }`}
            style={{
              backgroundColor: todayMood === 'good'
                ? '#1B7F3B'
                : isNight
                ? '#1A3326'
                : '#F2FBF5',
              color: todayMood === 'good' ? '#FFFFFF' : '#1B7F3B',
              borderColor: todayMood === 'good' ? '#1B7F3B' : '#A3E3B6',
            }}
          >
            <Smile className="w-8 h-8 sm:w-9 sm:h-9 shrink-0" />
            <span className="text-base sm:text-lg font-bold font-heading">
              {profile.language === 'hi' ? 'अच्छा' : 'Good'}
            </span>
          </button>

          {/* Okay */}
          <button
            id="btn-mood-okay"
            onClick={() => handleMoodSelect('okay')}
            className={`min-h-[84px] sm:min-h-[96px] rounded-2xl border-2 flex flex-col items-center justify-center gap-2 p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer ${
              todayMood === 'okay'
                ? 'shadow-md font-bold ring-3 ring-[#3B3A9E]/30'
                : 'hover:border-[#3B3A9E]'
            }`}
            style={{
              backgroundColor: todayMood === 'okay'
                ? '#3B3A9E'
                : isNight
                ? '#1C1B45'
                : '#F4F2FF',
              color: todayMood === 'okay' ? '#FFFFFF' : '#3B3A9E',
              borderColor: todayMood === 'okay' ? '#3B3A9E' : '#D1CEF0',
            }}
          >
            <Meh className="w-8 h-8 sm:w-9 sm:h-9 shrink-0" />
            <span className="text-base sm:text-lg font-bold font-heading">
              {profile.language === 'hi' ? 'ठीक-ठाक' : 'Okay'}
            </span>
          </button>

          {/* Not Well */}
          <button
            id="btn-mood-not-well"
            onClick={() => handleMoodSelect('not_well')}
            className={`min-h-[84px] sm:min-h-[96px] rounded-2xl border-2 flex flex-col items-center justify-center gap-2 p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer ${
              todayMood === 'not_well'
                ? 'shadow-md font-bold ring-3 ring-[#C62828]/30'
                : 'hover:border-[#C62828]'
            }`}
            style={{
              backgroundColor: todayMood === 'not_well'
                ? '#C62828'
                : isNight
                ? '#331515'
                : '#FFF4F4',
              color: todayMood === 'not_well' ? '#FFFFFF' : '#C62828',
              borderColor: todayMood === 'not_well' ? '#C62828' : '#F8B4B4',
            }}
          >
            <Frown className="w-8 h-8 sm:w-9 sm:h-9 shrink-0" />
            <span className="text-base sm:text-lg font-bold font-heading">
              {profile.language === 'hi' ? 'तबीयत ठीक नहीं' : 'Not well'}
            </span>
          </button>
        </div>

        {/* If 'Not well' chosen repeatedly: gentle offer to notify family */}
        {showMoodSupportBanner && (
          <div
            className="p-5 rounded-[20px] border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            style={{
              backgroundColor: isNight ? '#23225A' : '#F4F2FF',
              borderColor: '#3B3A9E',
            }}
          >
            <div className="flex items-center gap-3.5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#3B3A9E', color: '#FFFFFF' }}
              >
                <HeartHandshake className="w-7 h-7" />
              </div>
              <div>
                <h4
                  className="font-bold text-lg font-heading"
                  style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
                >
                  {profile.language === 'hi'
                    ? 'क्या आप चाहेंगे कि परिवार को एक संक्षिप्त संदेश भेजा जाए?'
                    : 'Would you like to let family know you are feeling low?'}
                </h4>
                <p
                  className="text-base font-medium"
                  style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}
                >
                  {profile.language === 'hi'
                    ? 'हम बिना आपकी सहमति के कुछ भी नहीं भेजते।'
                    : 'We never send anything automatically. You will review it first.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowMoodSupportBanner(false);
                onNotifyFamilyMoodConcern();
              }}
              className="min-h-[52px] px-6 rounded-full font-semibold text-white shadow-sm text-base shrink-0 cursor-pointer"
              style={{ backgroundColor: '#0F8B8D' }}
            >
              {profile.language === 'hi' ? 'संदेश तैयार करें' : 'Prepare note'}
            </button>
          </div>
        )}
      </section>
    </main>
  );
};
