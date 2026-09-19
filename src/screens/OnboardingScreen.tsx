import React, { useState } from 'react';
import { ArrowRight, Mic } from 'lucide-react';
import { UserProfile, Language, TextSize, FamilyContact } from '../types';
import { speechService } from '../services/speech';

interface OnboardingScreenProps {
  profile: UserProfile;
  onComplete: (profile: UserProfile, familyContact?: FamilyContact) => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  profile,
  onComplete,
}) => {
  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState<string>(profile.name || 'Kamla');
  const [language, setLanguage] = useState<Language>(profile.language || 'en');
  const [textSize, setTextSize] = useState<TextSize>(profile.textSize || 'large');
  const [familyName, setFamilyName] = useState<string>('Rahul');
  const [familyPhone, setFamilyPhone] = useState<string>('+91 98765 43210');
  const [familyRelation, setFamilyRelation] = useState<string>('Son');
  const [isListening, setIsListening] = useState<boolean>(false);

  const handleStartVoice = () => {
    setIsListening(true);
    speechService.startListening(
      language,
      (text) => {
        setName(text.replace(/[.!?]/g, '').trim());
      },
      () => setIsListening(false),
      () => setIsListening(false)
    );
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      const updatedProfile: UserProfile = {
        ...profile,
        name: name.trim() || 'Kamla',
        language,
        textSize,
        onboardingCompleted: true,
      };

      let contact: FamilyContact | undefined = undefined;
      if (familyName.trim() && familyPhone.trim()) {
        contact = {
          id: 'fam_' + Date.now(),
          name: familyName.trim(),
          relation: familyRelation.trim() || 'Family',
          phone: familyPhone.trim(),
        };
      }

      onComplete(updatedProfile, contact);
    }
  };

  return (
    <main
      id="onboarding-container"
      className="min-h-screen flex flex-col justify-between p-4 sm:p-8 max-w-2xl mx-auto transition-colors"
      style={{
        backgroundColor: profile.highContrast ? '#000000' : 'transparent',
        color: profile.highContrast ? '#FFFFFF' : '#16163A',
      }}
    >
      {/* Top Brand Header */}
      <div className="pt-6 text-center">
        <div
          className="w-20 h-20 mx-auto rounded-full flex items-center justify-center shadow-md border-2 mb-4"
          style={{
            background: 'linear-gradient(135deg, #3B3A9E 0%, #0F8B8D 100%)',
            borderColor: '#E4E1F5',
          }}
        >
          {/* Logo with Soft Gold Sun */}
          <svg className="w-11 h-11" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="5" fill="#E9B949" />
            <path
              d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h1
          className="text-3xl sm:text-4xl font-bold font-heading tracking-tight"
          style={{ color: '#3B3A9E' }}
        >
          Sandhya
        </h1>
        <p
          className="text-lg sm:text-xl font-medium mt-1"
          style={{ color: '#0F8B8D' }}
        >
          Pehle Sandhya se poochho
        </p>
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              className={`h-2 rounded-full transition-all ${
                s === step ? 'w-8 bg-[#3B3A9E]' : 'w-2 bg-[#D1CEF0]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step Contents */}
      <div className="my-8">
        {step === 1 && (
          <div
            className="p-6 sm:p-8 rounded-[24px] twilight-card space-y-6"
            style={{
              backgroundColor: profile.highContrast ? '#111111' : '#FFFFFF',
              borderColor: '#E4E1F5',
            }}
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold font-heading">
                Namaste! What may I call you?
              </h2>
              <p className="text-lg text-[#3F3F66]">
                Please enter your name so Sandhya can address you respectfully.
              </p>
            </div>

            <div className="space-y-3">
              <label htmlFor="input-onboarding-name" className="block text-lg font-bold font-heading">
                Your Name
              </label>
              <div className="flex gap-2">
                <input
                  id="input-onboarding-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kamla"
                  className="flex-1 min-h-[60px] px-5 rounded-full border text-2xl font-bold transition-colors"
                  style={{
                    backgroundColor: profile.highContrast ? '#222222' : '#FFFFFF',
                    borderColor: '#E4E1F5',
                    color: profile.highContrast ? '#FFFFFF' : '#16163A',
                  }}
                />
                <button
                  onClick={handleStartVoice}
                  className={`w-16 min-h-[60px] rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                    isListening
                      ? 'text-white ring-4 ring-[#0F8B8D]/40'
                      : 'text-white'
                  }`}
                  style={{
                    backgroundColor: isListening ? '#0F8B8D' : '#3B3A9E',
                  }}
                  title="Speak your name"
                  aria-label="Speak your name"
                >
                  <Mic className="w-7 h-7" />
                </button>
              </div>
              <p className="text-base font-semibold px-2" style={{ color: '#0F8B8D' }}>
                Sandhya will address you as: <span className="underline font-bold">{name || 'Friend'} ji</span>
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div
            className="p-6 sm:p-8 rounded-[24px] twilight-card space-y-8"
            style={{
              backgroundColor: profile.highContrast ? '#111111' : '#FFFFFF',
              borderColor: '#E4E1F5',
            }}
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold font-heading">
                Language & Text Size
              </h2>
              <p className="text-lg text-[#3F3F66]">
                Choose what feels most comfortable for your eyes.
              </p>
            </div>

            {/* Language options */}
            <div className="space-y-3">
              <label className="block text-lg font-bold font-heading">Preferred Language</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'en' as Language, label: 'English' },
                  { id: 'hi' as Language, label: 'हिंदी' },
                  { id: 'hinglish' as Language, label: 'Hinglish' },
                ].map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLanguage(l.id)}
                    className="min-h-[58px] rounded-full font-semibold text-lg border transition-all cursor-pointer"
                    style={{
                      backgroundColor: language === l.id ? '#3B3A9E' : 'transparent',
                      color: language === l.id ? '#FFFFFF' : profile.highContrast ? '#FFFFFF' : '#16163A',
                      borderColor: language === l.id ? '#3B3A9E' : '#E4E1F5',
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text size options */}
            <div className="space-y-3">
              <label className="block text-lg font-bold font-heading">Text Size (Letters Size)</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'normal' as TextSize, label: 'Standard (A)', preview: 'text-lg' },
                  { id: 'large' as TextSize, label: 'Large (A+)', preview: 'text-xl' },
                  { id: 'huge' as TextSize, label: 'Huge (A++)', preview: 'text-2xl' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setTextSize(s.id)}
                    className="min-h-[58px] rounded-full font-semibold border flex flex-col items-center justify-center p-2 transition-all cursor-pointer"
                    style={{
                      backgroundColor: textSize === s.id ? '#3B3A9E' : 'transparent',
                      color: textSize === s.id ? '#FFFFFF' : profile.highContrast ? '#FFFFFF' : '#16163A',
                      borderColor: textSize === s.id ? '#3B3A9E' : '#E4E1F5',
                    }}
                  >
                    <span className={s.preview}>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div
            className="p-6 sm:p-8 rounded-[24px] twilight-card space-y-6"
            style={{
              backgroundColor: profile.highContrast ? '#111111' : '#FFFFFF',
              borderColor: '#E4E1F5',
            }}
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold font-heading">
                Trusted Family Contact
              </h2>
              <div
                className="p-4 rounded-[16px] border text-left"
                style={{ backgroundColor: '#EAF6F5', borderColor: '#B2E2E0' }}
              >
                <p className="text-base font-medium" style={{ color: '#0F8B8D' }}>
                  Family only receives short alerts when you specifically choose to notify them. You are always in full control.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="input-family-name" className="block text-lg font-bold font-heading mb-1">
                  Contact Name
                </label>
                <input
                  id="input-family-name"
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="e.g. Rahul (Son)"
                  className="w-full min-h-[56px] px-5 rounded-full border text-xl font-semibold"
                  style={{
                    backgroundColor: profile.highContrast ? '#222222' : '#FFFFFF',
                    borderColor: '#E4E1F5',
                    color: profile.highContrast ? '#FFFFFF' : '#16163A',
                  }}
                />
              </div>

              <div>
                <label htmlFor="input-family-phone" className="block text-lg font-bold font-heading mb-1">
                  Phone Number (for WhatsApp / SMS)
                </label>
                <input
                  id="input-family-phone"
                  type="tel"
                  value={familyPhone}
                  onChange={(e) => setFamilyPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full min-h-[56px] px-5 rounded-full border text-xl font-semibold"
                  style={{
                    backgroundColor: profile.highContrast ? '#222222' : '#FFFFFF',
                    borderColor: '#E4E1F5',
                    color: profile.highContrast ? '#FFFFFF' : '#16163A',
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Button */}
      <div className="pt-4 flex flex-col gap-3">
        <button
          id="btn-onboarding-next"
          onClick={handleNext}
          className="w-full min-h-[62px] rounded-full font-semibold text-2xl flex items-center justify-center gap-3 text-white shadow-md cursor-pointer hover:opacity-95 transition-transform active:scale-98"
          style={{ backgroundColor: '#3B3A9E' }}
        >
          <span>{step === 3 ? 'Start using Sandhya' : 'Continue'}</span>
          <ArrowRight className="w-6 h-6" />
        </button>

        {step === 3 && (
          <button
            onClick={() => {
              setFamilyName('');
              setFamilyPhone('');
              handleNext();
            }}
            className="w-full min-h-[44px] text-base font-semibold hover:underline cursor-pointer"
            style={{ color: '#3F3F66' }}
          >
            I will add family later (Skip)
          </button>
        )}
      </div>
    </main>
  );
};
