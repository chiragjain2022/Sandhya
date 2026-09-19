import React, { useEffect, useState } from 'react';
import { Sparkles, Volume2, VolumeX, X, Check } from 'lucide-react';
import { UserProfile } from '../types';
import { ApiService } from '../services/api';
import { speechService } from '../services/speech';

interface SimplifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawText: string;
  profile: UserProfile;
}

export const SimplifyModal: React.FC<SimplifyModalProps> = ({
  isOpen,
  onClose,
  rawText,
  profile,
}) => {
  const isNight = !!profile.nightMode;
  const [simplified, setSimplified] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      speechService.stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setSimplified('');

    ApiService.simplifyText(rawText, profile.language)
      .then((res) => {
        if (isMounted) {
          setSimplified(res);
          setLoading(false);
          // Automatically speak simplified text gently
          speechService.speak(res, profile.language, profile.speechRate, () => {
            if (isMounted) setIsSpeaking(false);
          });
          setIsSpeaking(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          const fallback =
            profile.language === 'hi'
              ? 'यहाँ सब सुरक्षित है। आप बड़े बटन दबाकर जो चाहें चुन सकते हैं।'
              : 'Everything on this screen is safe. You can tap any large button to continue.';
          setSimplified(fallback);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      speechService.stopSpeaking();
    };
  }, [isOpen, rawText, profile.language, profile.speechRate]);

  if (!isOpen) return null;

  const toggleSpeech = () => {
    if (isSpeaking) {
      speechService.stopSpeaking();
      setIsSpeaking(false);
    } else if (simplified) {
      speechService.speak(simplified, profile.language, profile.speechRate, () => {
        setIsSpeaking(false);
      });
      setIsSpeaking(true);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="simplify-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div
        className="w-full max-w-xl rounded-[24px] border p-6 sm:p-8 shadow-2xl transition-all"
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
        <div
          className="flex items-center justify-between border-b pb-4 mb-5"
          style={{ borderColor: isNight ? '#333270' : '#E4E1F5' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: isNight ? '#1C1B45' : '#F4F2FF' }}
            >
              <Sparkles className="w-7 h-7" style={{ color: '#E9B949' }} />
            </div>
            <div>
              <h3
                id="simplify-modal-title"
                className="text-2xl sm:text-3xl font-bold font-heading tracking-tight"
              >
                {profile.language === 'hi' ? 'सरल रूप में समझें' : 'In Simple Words'}
              </h3>
              <p
                className="text-sm font-semibold"
                style={{ color: isNight ? '#4FD1C5' : '#0F8B8D' }}
              >
                {profile.language === 'hi' ? 'Sandhya ने इसे आसान बनाया' : 'Simplified by Sandhya'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-8 h-8" />
          </button>
        </div>

        {loading ? (
          <div className="py-8 space-y-4 text-center">
            <p className="text-xl font-bold font-heading">
              {profile.language === 'hi'
                ? 'Sandhya इसे सरल बना रही है... कोई जल्दबाज़ी नहीं'
                : 'Sandhya is simplifying this... no rush'}
            </p>
            <div className="space-y-3 max-w-sm mx-auto pt-2">
              <div className="h-5 skeleton-box w-full" />
              <div className="h-5 skeleton-box w-4/5 mx-auto" />
              <div className="h-5 skeleton-box w-3/5 mx-auto" />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div
              className="p-5 rounded-2xl border text-xl sm:text-2xl leading-relaxed whitespace-pre-line font-medium"
              style={{
                backgroundColor: profile.highContrast
                  ? '#222222'
                  : isNight
                  ? '#1C1B45'
                  : '#F4F2FF',
                borderColor: isNight ? '#333270' : '#E4E1F5',
                color: profile.highContrast
                  ? '#FFFFFF'
                  : isNight
                  ? '#F2F1FF'
                  : '#16163A',
              }}
            >
              {simplified}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={toggleSpeech}
                className="flex-1 min-h-[64px] rounded-full font-semibold text-xl flex items-center justify-center gap-3 px-6 border-2 transition-colors cursor-pointer"
                style={{
                  backgroundColor: isSpeaking
                    ? isNight
                      ? '#4FD1C5'
                      : '#0F8B8D'
                    : isNight
                    ? '#1C1B45'
                    : '#EAF6F5',
                  color: isSpeaking
                    ? '#FFFFFF'
                    : isNight
                    ? '#4FD1C5'
                    : '#0F8B8D',
                  borderColor: isNight ? '#0F8B8D' : '#B2E2E0',
                }}
              >
                {isSpeaking ? <VolumeX className="w-7 h-7" /> : <Volume2 className="w-7 h-7" />}
                <span>{isSpeaking ? 'Stop speaking' : 'Read aloud again'}</span>
              </button>

              <button
                onClick={onClose}
                className="flex-1 min-h-[64px] rounded-full font-semibold text-xl flex items-center justify-center gap-3 px-6 text-white shadow-md transition-colors cursor-pointer"
                style={{
                  backgroundColor: '#3B3A9E',
                }}
              >
                <Check className="w-7 h-7" />
                <span>{profile.language === 'hi' ? 'समझ गए' : 'I Understood'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
