import React from 'react';
import { UserProfile } from '../types';

interface LoadingStateProps {
  message?: string;
  profile: UserProfile;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message, profile }) => {
  const isNight = !!profile.nightMode;

  const defaultMsg =
    profile.language === 'hi'
      ? 'Sandhya पढ़ रही है... कोई जल्दबाज़ी नहीं'
      : profile.language === 'hinglish'
      ? 'Sandhya padh rahi hai... koi jaldbazi nahi'
      : 'Sandhya is reading... no rush';

  return (
    <div
      role="status"
      aria-live="polite"
      className="p-8 my-6 rounded-[24px] twilight-card space-y-5"
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
      {/* Calm Status Text */}
      <div className="text-center space-y-1">
        <h3
          className="text-2xl sm:text-3xl font-bold font-heading"
          style={{
            color: profile.highContrast
              ? '#FFFFFF'
              : isNight
              ? '#F2F1FF'
              : '#16163A',
          }}
        >
          {message || defaultMsg}
        </h3>
        <p
          className="text-lg font-medium"
          style={{
            color: isNight ? '#B0B0D8' : '#3F3F66',
          }}
        >
          {profile.language === 'hi'
            ? 'कृपया आराम से बैठें, Sandhya सब देख रही है'
            : 'Taking our time, keeping you safe'}
        </p>
      </div>

      {/* Calm Skeleton Loader Lines */}
      <div className="space-y-3 pt-2 max-w-md mx-auto">
        <div className="h-5 skeleton-box w-full" />
        <div className="h-5 skeleton-box w-4/5 mx-auto" />
        <div className="h-5 skeleton-box w-3/5 mx-auto" />
      </div>
    </div>
  );
};
