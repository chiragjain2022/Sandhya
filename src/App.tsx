import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Navigation, ScreenTab } from './components/Navigation';
import { InactivityBanner } from './components/InactivityBanner';
import { SimplifyModal } from './components/SimplifyModal';
import { AdaptivePrompt } from './components/AdaptivePrompt';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { CheckSomethingScreen } from './screens/CheckSomethingScreen';
import { PapersScreen } from './screens/PapersScreen';
import { MedicinesScreen } from './screens/MedicinesScreen';
import { TalkScreen } from './screens/TalkScreen';
import { FamilyCircleScreen } from './screens/FamilyCircleScreen';

import {
  UserProfile,
  ExtractedMedicine,
  SavedPaper,
  MoodRecord,
  MoodType,
  ActivityLogItem,
  FamilyContact,
} from './types';
import { StorageService } from './services/storage';
import { speechService } from './services/speech';

export default function App() {
  // Primary State
  const [profile, setProfile] = useState<UserProfile>(() => StorageService.getProfile());
  const [medicines, setMedicines] = useState<ExtractedMedicine[]>(() => StorageService.getMedicines());
  const [papers, setPapers] = useState<SavedPaper[]>(() => StorageService.getPapers());
  const [moods, setMoods] = useState<MoodRecord[]>(() => StorageService.getMoods());
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(() => StorageService.getActivityLogs());
  const [familyContacts, setFamilyContacts] = useState<FamilyContact[]>(() => StorageService.getFamilyContacts());

  // Active Screen
  const [activeTab, setActiveTab] = useState<ScreenTab>('home');

  // Speaking state indicator
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Global Modals
  const [showSimplifyModal, setShowSimplifyModal] = useState<boolean>(false);
  const [simplifyTargetText, setSimplifyTargetText] = useState<string>('');
  const [showAdaptivePrompt, setShowAdaptivePrompt] = useState<boolean>(false);

  // Inactivity Helper State (20 seconds timer)
  const [showInactivityBanner, setShowInactivityBanner] = useState<boolean>(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Struggle Signals Tracker
  const struggleCounterRef = useRef<number>(0);
  const lastNavTimeRef = useRef<number>(Date.now());

  // Reset inactivity timer on any user interaction
  const resetInactivityTimer = useCallback(() => {
    setShowInactivityBanner(false);
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      setShowInactivityBanner(true);
    }, 20000); // 20 seconds
  }, []);

  useEffect(() => {
    const handleActivity = () => {
      resetInactivityTimer();
    };

    window.addEventListener('pointerdown', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });

    resetInactivityTimer();

    return () => {
      window.removeEventListener('pointerdown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [resetInactivityTimer]);

  // Apply typography, contrast, and night mode classes to body
  useEffect(() => {
    document.body.classList.remove('text-size-normal', 'text-size-large', 'text-size-huge');
    document.body.classList.add(`text-size-${profile.textSize}`);

    if (profile.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }

    if (profile.nightMode) {
      document.body.classList.add('night-mode');
    } else {
      document.body.classList.remove('night-mode');
    }
  }, [profile.textSize, profile.highContrast, profile.nightMode]);

  // Track speech synthesizer state polling
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        setIsSpeaking(window.speechSynthesis.speaking);
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  // Profile Update Handler
  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    if (updated.demoMode !== undefined && updated.demoMode !== profile.demoMode) {
      if (updated.demoMode) {
        StorageService.loadDemoMode();
        setProfile(StorageService.getProfile());
        setMedicines(StorageService.getMedicines());
        setPapers(StorageService.getPapers());
        setMoods(StorageService.getMoods());
        setActivityLogs(StorageService.getActivityLogs());
        setFamilyContacts(StorageService.getFamilyContacts());
        speechService.playChime('success');
        return;
      } else {
        const next = StorageService.saveProfile({ demoMode: false });
        setProfile(next);
        return;
      }
    }
    const next = StorageService.saveProfile(updated);
    setProfile(next);
  };

  // Medicine Status Handler
  const handleUpdateMedicineStatus = (id: string, status: 'taken' | 'later' | 'pending') => {
    const updated = StorageService.updateMedicineStatus(id, status);
    setMedicines(updated);

    if (status === 'taken') {
      speechService.playChime('success');
      logActivity(
        'Medicine Taken',
        `Marked medicine as taken for today`,
        'bg-emerald-100 text-emerald-800'
      );
    }
  };

  // Add Medicine
  const handleAddMedicine = (med: ExtractedMedicine) => {
    const updated = StorageService.addMedicine(med);
    setMedicines(updated);
    speechService.playChime('success');
    logActivity('Medicine Added', `Added ${med.name} (${med.dose})`, 'bg-[#EAF6F5] text-[#0F8B8D]');
  };

  // Delete Medicine
  const handleDeleteMedicine = (id: string) => {
    const updated = StorageService.deleteMedicine(id);
    setMedicines(updated);
  };

  // Save Paper
  const handleSavePaper = (paper: SavedPaper) => {
    const updated = StorageService.savePaper(paper);
    setPapers(updated);
    logActivity('Paper Saved', `Saved document: ${paper.title}`, 'bg-blue-100 text-blue-800');
  };

  // Add prescription medicines
  const handleAddMedicinesFromPrescription = (newMeds: ExtractedMedicine[]) => {
    let currentMeds = medicines;
    newMeds.forEach((m) => {
      currentMeds = StorageService.addMedicine(m);
    });
    setMedicines(currentMeds);
    speechService.playChime('success');
    logActivity(
      'Prescription Processed',
      `Added ${newMeds.length} medicines from scanned prescription`,
      'bg-emerald-100 text-emerald-800'
    );
  };

  // Record Mood
  const handleRecordMood = (mood: MoodType) => {
    const updated = StorageService.recordMood(mood);
    setMoods(updated);
    speechService.playChime('neutral');
    logActivity('Daily Mood Check-in', `Feeling ${mood.replace('_', ' ')} today`);
  };

  // Log Activity Helper
  const logActivity = (title: string, details: string, color?: string) => {
    const updated = StorageService.addActivityLog(title, details, color);
    setActivityLogs(updated);
  };

  // Family Contacts Handlers
  const handleAddContact = (contact: FamilyContact) => {
    const updated = StorageService.addFamilyContact(contact);
    setFamilyContacts(updated);
    speechService.playChime('success');
  };

  const handleRemoveContact = (id: string) => {
    const updated = StorageService.removeFamilyContact(id);
    setFamilyContacts(updated);
  };

  // Reset All Data
  const handleResetAllData = () => {
    StorageService.clearAllData();
    speechService.stopSpeaking();
    setProfile(StorageService.getProfile());
    setMedicines([]);
    setPapers([]);
    setMoods([]);
    setActivityLogs([]);
    setFamilyContacts([]);
    setActiveTab('home');
  };

  // Navigation with struggle signal tracking (rapid repeated back-and-forth)
  const handleTabChange = (tab: ScreenTab) => {
    speechService.stopSpeaking();
    resetInactivityTimer();

    const now = Date.now();
    if (now - lastNavTimeRef.current < 2500 && tab !== activeTab) {
      struggleCounterRef.current += 1;
      if (struggleCounterRef.current >= 3) {
        setShowAdaptivePrompt(true);
        struggleCounterRef.current = 0;
      }
    }
    lastNavTimeRef.current = now;
    setActiveTab(tab);
  };

  // Struggle trigger from children
  const handleStruggleSignal = () => {
    struggleCounterRef.current += 1;
    if (struggleCounterRef.current >= 2) {
      setShowAdaptivePrompt(true);
      struggleCounterRef.current = 0;
    }
  };

  // Adaptive Prompt Yes handler
  const handleAcceptAdaptive = () => {
    handleUpdateProfile({
      textSize: 'huge',
      speechRate: 0.8,
    });
    setShowAdaptivePrompt(false);
    speechService.playChime('success');
    const msg =
      profile.language === 'hi'
        ? 'मैंने लिखावट बड़ी कर दी है और बोलने की गति धीमी कर दी है।'
        : 'I have made text huge and slowed down speech for your comfort.';
    speechService.speak(msg, profile.language, 0.8);
  };

  // Global "Read Screen Aloud"
  const handleReadScreenAloud = () => {
    if (isSpeaking) {
      speechService.stopSpeaking();
      return;
    }

    let screenSummary = '';
    if (activeTab === 'home') {
      screenSummary = `Welcome Home ${profile.name} ji. Sandhya is here with your daily briefing. You have ${
        medicines.filter((m) => m.statusToday !== 'taken').length
      } medicines pending today. Tap Check Something if you received a strange message, or Help with a Paper to read any document.`;
    } else if (activeTab === 'check') {
      screenSummary =
        'This is the Pause Button safety screen. You can paste an SMS, upload a photo, or describe a suspicious phone call. Sandhya will check if it is safe and protect you.';
    } else if (activeTab === 'papers') {
      screenSummary =
        'This is your Paperwork Translator. You can take a photo of any bank letter, electricity bill, or prescription. Sandhya explains what action is required in simple words.';
    } else if (activeTab === 'medicines') {
      screenSummary = `Here is your medicines list. You have ${medicines.length} total scheduled medications. You can tap Taken or Later for each.`;
    } else if (activeTab === 'chat') {
      screenSummary =
        'This is your companion screen. You can talk freely with Sandhya by tapping the microphone, or switch to Show Me How for step by step phone instructions.';
    } else if (activeTab === 'family') {
      screenSummary =
        'Here is your Family Circle. You can view your trusted contacts and create a weekly comfort summary to share via WhatsApp. We never send messages without your permission.';
    }

    speechService.speak(screenSummary, profile.language, profile.speechRate);
  };

  // Global "Simplify This"
  const handleSimplifyScreen = () => {
    let screenContext = '';
    if (activeTab === 'home') {
      screenContext = `Screen: Home. User: ${profile.name}. Pending medicines: ${
        medicines.filter((m) => m.statusToday !== 'taken').length
      }. Upcoming deadlines: ${papers.filter((p) => p.deadline).length}. Today's friendly reminder.`;
    } else if (activeTab === 'check') {
      screenContext =
        'Screen: Check Something (The Pause button). Helps senior citizens avoid SMS scams, fake bank calls, and suspicious payment links.';
    } else if (activeTab === 'papers') {
      screenContext =
        'Screen: Paperwork translator. Converts bank letters, insurance notices, pension papers, bills, and prescriptions into simple everyday language.';
    } else if (activeTab === 'medicines') {
      screenContext = `Screen: Medicines. List of daily doses with morning, afternoon, and night timing.`;
    } else if (activeTab === 'chat') {
      screenContext =
        'Screen: Talk to Sandhya. Senior companion for friendly chatting and step-by-step guidance for phone apps.';
    } else {
      screenContext =
        'Screen: Family Circle and Settings. Manages trusted family contacts and app preferences.';
    }

    setSimplifyTargetText(screenContext);
    setShowSimplifyModal(true);
  };

  // Onboarding completion
  const handleCompleteOnboarding = (newProfile: UserProfile, contact?: FamilyContact) => {
    setProfile(newProfile);
    StorageService.saveProfile(newProfile);

    if (contact) {
      handleAddContact(contact);
    }

    speechService.playChime('success');
    const welcome =
      newProfile.language === 'hi'
        ? `नमस्ते ${newProfile.name} जी! Sandhya में आपका स्वागत है।`
        : `Namaste ${newProfile.name} ji! Welcome to Sandhya.`;
    speechService.speak(welcome, newProfile.language, newProfile.speechRate);
  };

  // If first launch / onboarding not completed
  if (!profile.onboardingCompleted) {
    return (
      <OnboardingScreen
        profile={profile}
        onComplete={handleCompleteOnboarding}
      />
    );
  }

  const pendingMedicinesCount = medicines.filter((m) => m.statusToday !== 'taken').length;

  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-colors duration-200"
      style={{
        backgroundColor: profile.highContrast ? '#000000' : 'transparent',
        color: profile.highContrast
          ? '#FFFFFF'
          : profile.nightMode
          ? '#F2F1FF'
          : '#16163A',
      }}
    >
      {/* 1. Global Accessible Header */}
      <Header
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
        onReadScreenAloud={handleReadScreenAloud}
        onSimplifyScreen={handleSimplifyScreen}
        isSpeaking={isSpeaking}
      />

      {/* 2. Main Screen Body */}
      <div className="flex-1 w-full max-w-4xl mx-auto">
        {activeTab === 'home' && (
          <HomeScreen
            profile={profile}
            medicines={medicines}
            papers={papers}
            moods={moods}
            onNavigateTab={(tab) => handleTabChange(tab)}
            onUpdateMedicineStatus={handleUpdateMedicineStatus}
            onRecordMood={handleRecordMood}
            onNotifyFamilyMoodConcern={() => {
              handleTabChange('family');
            }}
            isSpeaking={isSpeaking}
          />
        )}

        {activeTab === 'check' && (
          <CheckSomethingScreen
            profile={profile}
            familyContacts={familyContacts}
            onLogActivity={logActivity}
            isSpeaking={isSpeaking}
          />
        )}

        {activeTab === 'papers' && (
          <PapersScreen
            profile={profile}
            papers={papers}
            onSavePaper={handleSavePaper}
            onAddMedicinesFromPrescription={handleAddMedicinesFromPrescription}
            onNavigateToCheck={() => handleTabChange('check')}
            isSpeaking={isSpeaking}
          />
        )}

        {activeTab === 'medicines' && (
          <MedicinesScreen
            profile={profile}
            medicines={medicines}
            onAddMedicine={handleAddMedicine}
            onUpdateMedicineStatus={handleUpdateMedicineStatus}
            onDeleteMedicine={handleDeleteMedicine}
            isSpeaking={isSpeaking}
          />
        )}

        {activeTab === 'chat' && (
          <TalkScreen
            profile={profile}
            onStruggleSignal={handleStruggleSignal}
            isSpeaking={isSpeaking}
          />
        )}

        {activeTab === 'family' && (
          <FamilyCircleScreen
            profile={profile}
            familyContacts={familyContacts}
            activityLogs={activityLogs}
            medicines={medicines}
            papers={papers}
            moods={moods}
            onAddContact={handleAddContact}
            onRemoveContact={handleRemoveContact}
            onUpdateProfile={handleUpdateProfile}
            onResetAllData={handleResetAllData}
            isSpeaking={isSpeaking}
          />
        )}
      </div>

      {/* 3. Inactivity Banner (Appears if user is idle for 20 seconds) */}
      <InactivityBanner
        visible={showInactivityBanner}
        onTapHelp={() => {
          setShowInactivityBanner(false);
          handleReadScreenAloud();
        }}
        onDismiss={() => setShowInactivityBanner(false)}
        language={profile.language}
        highContrast={profile.highContrast}
      />

      {/* 4. Adaptive Interface Simplification Prompt */}
      <AdaptivePrompt
        isOpen={showAdaptivePrompt}
        onAccept={handleAcceptAdaptive}
        onDecline={() => setShowAdaptivePrompt(false)}
        profile={profile}
      />

      {/* 5. "Simplify This" Modal */}
      <SimplifyModal
        isOpen={showSimplifyModal}
        onClose={() => setShowSimplifyModal(false)}
        rawText={simplifyTargetText}
        profile={profile}
      />

      {/* 6. Fixed Bottom Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        profile={profile}
        pendingMedicinesCount={pendingMedicinesCount}
      />
    </div>
  );
}
