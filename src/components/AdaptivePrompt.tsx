import React from 'react';
import { Sparkles, Check, X } from 'lucide-react';
import { UserProfile } from '../types';

interface AdaptivePromptProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
  profile: UserProfile;
}

export const AdaptivePrompt: React.FC<AdaptivePromptProps> = ({
  isOpen,
  onAccept,
  onDecline,
  profile,
}) => {
  const isNight = !!profile.nightMode;
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="adaptive-prompt-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div
        className="w-full max-w-lg rounded-[24px] border p-6 sm:p-8 shadow-2xl transition-all"
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
          color: profile.highContrast
            ? '#FFFFFF'
            : isNight
            ? '#F2F1FF'
            : '#16163A',
        }}
      >
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: isNight ? '#1C1B45' : '#F4F2FF' }}
          >
            <Sparkles className="w-8 h-8" style={{ color: '#E9B949' }} />
          </div>
          <div>
            <h3
              id="adaptive-prompt-title"
              className="text-2xl sm:text-3xl font-bold font-heading tracking-tight"
            >
              {profile.language === 'hi'
                ? 'क्या मैं इसे और आसान बना दूँ?'
                : 'Would you like me to make things simpler?'}
            </h3>
            <p
              className="text-base font-semibold"
              style={{ color: isNight ? '#4FD1C5' : '#0F8B8D' }}
            >
              {profile.language === 'hi'
                ? 'अक्षर बड़े होंगे और Sandhya हर बात बोलकर बताएगी'
                : 'We will make the letters bigger and speak more slowly for you.'}
            </p>
          </div>
        </div>

        <p
          className="text-lg sm:text-xl font-medium leading-relaxed mb-6"
          style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}
        >
          {profile.language === 'hi'
            ? 'अगर आपको देखने या पढ़ने में परेशानी हो रही है, तो मैं लिखावट बड़ी कर दूँगी और बोलने की गति धीमी कर दूँगी।'
            : 'I noticed you might be finding things a little busy. I can enlarge the text, simplify buttons, and talk more slowly.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onAccept}
            className="flex-1 min-h-[64px] rounded-full font-semibold text-xl flex items-center justify-center gap-3 px-6 text-white shadow-md transition-colors cursor-pointer"
            style={{ backgroundColor: '#3B3A9E' }}
          >
            <Check className="w-7 h-7" />
            <span>{profile.language === 'hi' ? 'हाँ, आसान बनाइए' : 'Yes, make it simpler'}</span>
          </button>

          <button
            onClick={onDecline}
            className="flex-1 min-h-[64px] rounded-full font-semibold text-xl flex items-center justify-center gap-3 px-6 border-2 transition-colors cursor-pointer"
            style={{
              backgroundColor: isNight ? '#23225A' : '#FFFFFF',
              color: isNight ? '#F2F1FF' : '#3B3A9E',
              borderColor: isNight ? '#8B8AF5' : '#3B3A9E',
            }}
          >
            <X className="w-7 h-7" />
            <span>{profile.language === 'hi' ? 'नहीं, यह ठीक है' : 'No, this is fine'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
