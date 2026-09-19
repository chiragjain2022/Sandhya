import React from 'react';
import { Volume2, VolumeX, Sparkles, Sun, Moon, Eye } from 'lucide-react';
import { UserProfile, Language, TextSize } from '../types';

interface HeaderProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onReadScreenAloud: () => void;
  onSimplifyScreen: () => void;
  isSpeaking: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  onUpdateProfile,
  onReadScreenAloud,
  onSimplifyScreen,
  isSpeaking,
}) => {
  const isNight = !!profile.nightMode;

  const handleTextSizeCycle = () => {
    const order: TextSize[] = ['normal', 'large', 'huge'];
    const nextIdx = (order.indexOf(profile.textSize) + 1) % order.length;
    onUpdateProfile({ textSize: order[nextIdx] });
  };

  const toggleNightMode = () => {
    const nextVal = !profile.nightMode;
    onUpdateProfile({ nightMode: nextVal });
    if (nextVal) {
      document.body.classList.add('night-mode');
    } else {
      document.body.classList.remove('night-mode');
    }
  };

  const toggleContrast = () => {
    const nextVal = !profile.highContrast;
    onUpdateProfile({ highContrast: nextVal });
    if (nextVal) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  };

  const handleLangChange = (lang: Language) => {
    onUpdateProfile({ language: lang });
  };

  return (
    <header
      id="sandhya-header"
      className="w-full sticky top-0 z-40 transition-colors duration-200 border-b shadow-xs"
      style={{
        backgroundColor: profile.highContrast
          ? '#000000'
          : isNight
          ? '#1C1B45'
          : '#FFFFFF',
        borderColor: profile.highContrast
          ? '#FFFFFF'
          : isNight
          ? '#333270'
          : '#E4E1F5',
      }}
    >
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Inline SVG Setting Sun over Indigo Hill Logo */}
        <div className="flex items-center gap-3 select-none">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs overflow-hidden shrink-0 border"
            style={{
              backgroundColor: isNight ? '#23225A' : '#F4F2FF',
              borderColor: isNight ? '#49488C' : '#E4E1F5',
            }}
            aria-hidden="true"
          >
            {/* Inline SVG: Gold sun setting over an indigo hill */}
            <svg
              className="w-10 h-10"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Sky background / glow */}
              <circle cx="24" cy="20" r="14" fill="#E9B949" fillOpacity="0.18" />
              {/* Gold Sun setting */}
              <circle cx="24" cy="21" r="8" fill="#E9B949" />
              {/* Setting rays */}
              <line x1="24" y1="9" x2="24" y2="6" stroke="#E9B949" strokeWidth="2" strokeLinecap="round" />
              <line x1="14" y1="13" x2="12" y2="11" stroke="#E9B949" strokeWidth="2" strokeLinecap="round" />
              <line x1="34" y1="13" x2="36" y2="11" stroke="#E9B949" strokeWidth="2" strokeLinecap="round" />
              {/* Gentle indigo hills in foreground */}
              <path
                d="M4 42C12 34 20 31 29 36C36 40 42 35 46 38V44H4V42Z"
                fill={isNight ? '#8B8AF5' : '#3B3A9E'}
              />
              <path
                d="M0 44C8 38 18 35 26 39C32 42 40 40 48 44H0Z"
                fill={isNight ? '#6665D8' : '#2E2D80'}
                fillOpacity="0.9"
              />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                className="font-bold tracking-tight text-2xl sm:text-3xl"
                style={{
                  color: profile.highContrast
                    ? '#FFFFFF'
                    : isNight
                    ? '#F2F1FF'
                    : '#16163A',
                  fontFamily: 'Lexend, sans-serif',
                }}
              >
                Sandhya
              </span>
              {profile.demoMode && (
                <span
                  className="text-xs font-bold px-2.5 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: isNight ? '#2A2968' : '#F4F2FF',
                    color: isNight ? '#8B8AF5' : '#3B3A9E',
                    borderColor: isNight ? '#49488C' : '#E4E1F5',
                  }}
                >
                  Demo
                </span>
              )}
            </div>
            <p
              className="text-xs sm:text-sm font-semibold tracking-wide"
              style={{
                color: profile.highContrast
                  ? '#E9B949'
                  : isNight
                  ? '#B0B0D8'
                  : '#3F3F66',
              }}
            >
              Pehle Sandhya se poochho
            </p>
          </div>
        </div>

        {/* Action Controls: Language, Text Size, Day/Night, Contrast, Read Aloud, Simplify */}
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
          {/* Language Selector */}
          <div
            className="flex items-center rounded-xl p-0.5 border"
            style={{
              backgroundColor: isNight ? '#23225A' : '#F4F2FF',
              borderColor: isNight ? '#333270' : '#E4E1F5',
            }}
          >
            {(['en', 'hi', 'hinglish'] as Language[]).map((l) => {
              const active = profile.language === l;
              return (
                <button
                  key={l}
                  onClick={() => handleLangChange(l)}
                  className="px-2.5 py-1 text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer"
                  style={{
                    backgroundColor: active
                      ? isNight
                        ? '#8B8AF5'
                        : '#3B3A9E'
                      : 'transparent',
                    color: active
                      ? '#FFFFFF'
                      : isNight
                      ? '#B0B0D8'
                      : '#3F3F66',
                  }}
                  aria-label={`Switch to ${l === 'en' ? 'English' : l === 'hi' ? 'Hindi' : 'Hinglish'}`}
                >
                  {l === 'en' ? 'Eng' : l === 'hi' ? 'हिंदी' : 'Hing'}
                </button>
              );
            })}
          </div>

          {/* Text Size (A / A+ / A++) */}
          <button
            id="btn-text-size"
            onClick={handleTextSizeCycle}
            className="h-10 px-3 rounded-xl border font-bold text-sm sm:text-base flex items-center justify-center transition-colors cursor-pointer"
            style={{
              backgroundColor: isNight ? '#23225A' : '#FFFFFF',
              color: isNight ? '#F2F1FF' : '#16163A',
              borderColor: isNight ? '#333270' : '#E4E1F5',
            }}
            title="Change Text Size (A / A+ / A++)"
            aria-label="Change Text Size"
          >
            {profile.textSize === 'normal' ? 'A' : profile.textSize === 'large' ? 'A+' : 'A++'}
          </button>

          {/* Day / Night Theme Toggle */}
          <button
            id="btn-theme-toggle"
            onClick={toggleNightMode}
            className="h-10 px-2.5 sm:px-3 rounded-xl border font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            style={{
              backgroundColor: isNight ? '#8B8AF5' : '#FFFFFF',
              color: isNight ? '#12122E' : '#16163A',
              borderColor: isNight ? '#8B8AF5' : '#E4E1F5',
            }}
            title={isNight ? 'Switch to Day Mode' : 'Switch to Night Mode'}
            aria-label={isNight ? 'Switch to Day Mode' : 'Switch to Night Mode'}
          >
            {isNight ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-[#3B3A9E]" />}
            <span className="hidden sm:inline">{isNight ? 'Night' : 'Day'}</span>
          </button>

          {/* High Contrast Toggle */}
          <button
            id="btn-contrast-toggle"
            onClick={toggleContrast}
            className="h-10 px-2.5 rounded-xl border font-bold text-xs sm:text-sm flex items-center gap-1 cursor-pointer"
            style={{
              backgroundColor: profile.highContrast
                ? '#FFFFFF'
                : isNight
                ? '#23225A'
                : '#FFFFFF',
              color: profile.highContrast
                ? '#000000'
                : isNight
                ? '#F2F1FF'
                : '#16163A',
              borderColor: isNight ? '#333270' : '#E4E1F5',
            }}
            title="Toggle High Contrast"
            aria-label="Toggle High Contrast"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden md:inline">Contrast</span>
          </button>

          {/* Read Screen Aloud Button */}
          <button
            id="btn-read-screen-aloud"
            onClick={onReadScreenAloud}
            className="h-10 px-3 rounded-xl border font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer"
            style={{
              backgroundColor: isSpeaking
                ? isNight
                  ? '#4FD1C5'
                  : '#0F8B8D'
                : isNight
                ? '#1A3340'
                : '#EAF6F5',
              color: isSpeaking
                ? '#FFFFFF'
                : isNight
                ? '#4FD1C5'
                : '#0F8B8D',
              borderColor: isSpeaking
                ? '#0F8B8D'
                : isNight
                ? '#0F8B8D'
                : '#B2E2E0',
            }}
            title="Read screen aloud"
            aria-label="Read screen aloud"
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isSpeaking ? 'Stop voice' : 'Read screen'}</span>
          </button>

          {/* Simplify This Button */}
          <button
            id="btn-simplify-screen"
            onClick={onSimplifyScreen}
            className="h-10 px-3 rounded-xl border font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            style={{
              backgroundColor: isNight ? '#23225A' : '#FFFFFF',
              color: isNight ? '#4FD1C5' : '#0F8B8D',
              borderColor: isNight ? '#333270' : '#E4E1F5',
            }}
            title="Simplify this screen"
            aria-label="Simplify this screen"
          >
            <Sparkles className="w-4 h-4" style={{ color: '#E9B949' }} />
            <span className="hidden sm:inline">Simplify</span>
          </button>
        </div>
      </div>
    </header>
  );
};
