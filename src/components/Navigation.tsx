import React from 'react';
import { Home, ShieldCheck, FileText, MessageSquare, Users, Pill } from 'lucide-react';
import { UserProfile } from '../types';

export type ScreenTab = 'home' | 'check' | 'papers' | 'medicines' | 'chat' | 'family';

interface NavigationProps {
  activeTab: ScreenTab;
  onTabChange: (tab: ScreenTab) => void;
  profile: UserProfile;
  pendingMedicinesCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  profile,
  pendingMedicinesCount = 0,
}) => {
  const isNight = !!profile.nightMode;

  const tabs = [
    {
      id: 'home' as ScreenTab,
      label: profile.language === 'hi' ? 'होम' : 'Home',
      icon: Home,
    },
    {
      id: 'check' as ScreenTab,
      label: profile.language === 'hi' ? 'सुरक्षा जाँच' : 'Check',
      icon: ShieldCheck,
    },
    {
      id: 'papers' as ScreenTab,
      label: profile.language === 'hi' ? 'कागज़ात' : 'Papers',
      icon: FileText,
    },
    {
      id: 'medicines' as ScreenTab,
      label: profile.language === 'hi' ? 'दवाइयाँ' : 'Medicines',
      icon: Pill,
      badge: pendingMedicinesCount > 0 ? pendingMedicinesCount : undefined,
    },
    {
      id: 'chat' as ScreenTab,
      label: profile.language === 'hi' ? 'बातचीत' : 'Talk',
      icon: MessageSquare,
    },
    {
      id: 'family' as ScreenTab,
      label: profile.language === 'hi' ? 'परिवार' : 'Family',
      icon: Users,
    },
  ];

  const activeBg = profile.highContrast
    ? '#FFFFFF'
    : isNight
    ? '#8B8AF5'
    : '#3B3A9E';

  const activeColor = profile.highContrast
    ? '#000000'
    : isNight
    ? '#12122E'
    : '#FFFFFF';

  const inactiveColor = profile.highContrast
    ? '#FFFFFF'
    : isNight
    ? '#B0B0D8'
    : '#3F3F66';

  return (
    <>
      {/* 1. Mobile Bottom Navigation Bar (hidden on md and above) */}
      <nav
        id="bottom-navigation"
        aria-label="Mobile main navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t shadow-lg pb-safe transition-colors duration-200"
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
        <div className="flex items-center justify-around px-1 py-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`nav-tab-mobile-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className="flex-1 min-h-[64px] flex flex-col items-center justify-center py-1 px-1 rounded-full transition-all cursor-pointer relative"
                style={{
                  backgroundColor: isActive ? activeBg : 'transparent',
                  color: isActive ? activeColor : inactiveColor,
                }}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="relative">
                  <Icon className="w-6 h-6 shrink-0" />
                  {tab.badge !== undefined && (
                    <span
                      className="absolute -top-1.5 -right-2.5 text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2"
                      style={{
                        backgroundColor: '#C62828',
                        color: '#FFFFFF',
                        borderColor: isNight ? '#1C1B45' : '#FFFFFF',
                      }}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold mt-1 text-center truncate max-w-[58px]">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 2. Tablet & Desktop Left Sidebar Navigation (visible on md and above) */}
      <aside
        id="desktop-sidebar-navigation"
        aria-label="Desktop main navigation"
        className="hidden md:flex fixed top-[69px] bottom-0 left-0 w-64 flex-col p-4 border-r z-30 transition-colors duration-200"
        style={{
          backgroundColor: profile.highContrast
            ? '#000000'
            : isNight
            ? '#16153B'
            : '#FFFFFF',
          borderColor: profile.highContrast
            ? '#FFFFFF'
            : isNight
            ? '#333270'
            : '#E4E1F5',
        }}
      >
        <div className="space-y-2.5">
          <div className="px-3 py-1">
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{
                color: isNight ? '#B0B0D8' : '#3F3F66',
              }}
            >
              {profile.language === 'hi' ? 'नेविगेशन' : 'Menu'}
            </span>
          </div>

          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`nav-tab-desktop-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className="w-full min-h-[64px] px-4 rounded-full flex items-center justify-between text-left transition-all cursor-pointer font-bold text-lg"
                style={{
                  backgroundColor: isActive ? activeBg : 'transparent',
                  color: isActive ? activeColor : inactiveColor,
                }}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <Icon className="w-7 h-7 shrink-0" />
                    {tab.badge !== undefined && (
                      <span
                        className="absolute -top-1.5 -right-2 text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2"
                        style={{
                          backgroundColor: '#C62828',
                          color: '#FFFFFF',
                          borderColor: isNight ? '#16153B' : '#FFFFFF',
                        }}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </div>
                  <span>{tab.label}</span>
                </div>

                {isActive && (
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: isNight ? '#12122E' : '#E9B949',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Quiet Reassurance in Sidebar */}
        <div
          className="mt-auto p-4 rounded-2xl border text-sm"
          style={{
            backgroundColor: isNight ? '#23225A' : '#F4F2FF',
            borderColor: isNight ? '#333270' : '#E4E1F5',
            color: isNight ? '#B0B0D8' : '#3F3F66',
          }}
        >
          <p className="font-semibold text-base mb-1" style={{ color: isNight ? '#F2F1FF' : '#16163A' }}>
            {profile.language === 'hi' ? 'भरोसेमंद साथी' : 'Trust Layer'}
          </p>
          <p className="leading-snug">
            {profile.language === 'hi'
              ? 'Sandhya आपके साथ है। कोई भी संदेह होने पर पूछें।'
              : 'Sandhya protects your privacy. No rush, ask anytime.'}
          </p>
        </div>
      </aside>
    </>
  );
};
