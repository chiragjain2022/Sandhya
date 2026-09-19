import React from 'react';
import { Volume2, X } from 'lucide-react';
import { Language } from '../types';

interface InactivityBannerProps {
  visible: boolean;
  onTapHelp: () => void;
  onDismiss: () => void;
  language: Language;
  highContrast: boolean;
}

export const InactivityBanner: React.FC<InactivityBannerProps> = ({
  visible,
  onTapHelp,
  onDismiss,
  language,
  highContrast,
}) => {
  if (!visible) return null;

  return (
    <aside
      id="inactivity-helper-banner"
      role="region"
      aria-label="Help helper"
      className="fixed bottom-24 left-4 right-4 max-w-lg mx-auto z-50 shadow-2xl rounded-[24px] p-4.5 flex items-center justify-between gap-3 border transition-all"
      style={{
        backgroundColor: highContrast ? '#111111' : '#FFFFFF',
        borderColor: highContrast ? '#FFFFFF' : '#3B3A9E',
        boxShadow: '0 10px 30px -5px rgba(59, 58, 158, 0.25)',
      }}
    >
      <button
        onClick={onTapHelp}
        className="flex-1 flex items-center gap-3.5 text-left cursor-pointer"
      >
        <div
          className="w-12 h-12 rounded-full text-white flex items-center justify-center shrink-0 shadow-sm"
          style={{ backgroundColor: '#0F8B8D' }}
        >
          <Volume2 className="w-6 h-6" />
        </div>
        <div>
          <h4
            className="font-bold text-lg font-heading"
            style={{ color: highContrast ? '#FFFFFF' : '#16163A' }}
          >
            {language === 'hi' ? 'मदद चाहिए?' : 'Need help?'}
          </h4>
          <p
            className="text-base font-medium"
            style={{ color: highContrast ? '#E5E7EB' : '#3F3F66' }}
          >
            {language === 'hi'
              ? 'यहाँ दबाएं, मैं यह स्क्रीन बोलकर समझाऊँगी।'
              : 'Tap here and I will read this screen and guide you.'}
          </p>
        </div>
      </button>

      <button
        onClick={onDismiss}
        className="p-2 rounded-full hover:bg-black/5 cursor-pointer"
        style={{ color: highContrast ? '#FFFFFF' : '#3F3F66' }}
        aria-label="Dismiss helper"
      >
        <X className="w-6 h-6" />
      </button>
    </aside>
  );
};
