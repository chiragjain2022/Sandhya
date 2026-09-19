export type Language = 'en' | 'hi' | 'hinglish';
export type TextSize = 'normal' | 'large' | 'huge';
export type MoodType = 'good' | 'okay' | 'not_well';

export interface UserProfile {
  name: string;
  age?: number;
  language: Language;
  textSize: TextSize;
  highContrast: boolean;
  nightMode?: boolean;
  speechRate: number; // ~0.85
  voiceGuidance: boolean;
  onboardingCompleted: boolean;
  demoMode: boolean;
}

export interface FamilyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
}

export interface ExtractedMedicine {
  id: string;
  name: string;
  dose: string;
  morning?: boolean;
  afternoon?: boolean;
  night?: boolean;
  timing?: {
    morning: boolean;
    afternoon: boolean;
    night: boolean;
  };
  duration: string;
  instructions?: string;
  statusToday?: 'taken' | 'later' | 'pending';
  lastTakenDate?: string;
  sourcePaperId?: string;
}

export interface SavedPaper {
  id: string;
  title: string;
  documentType: 'bank_letter' | 'insurance' | 'pension' | 'electricity_bill' | 'gov_form' | 'medical_report' | 'prescription' | 'other' | string;
  plainSummary: string;
  actionRequired: {
    required: boolean;
    what: string;
  };
  deadline: string | null;
  amount: string | null;
  whoToContact: string | null;
  documentsToKeepReady: string[];
  callScript: string[];
  warningIfSuspicious?: string | null;
  savedAt?: string;
  dateScanned?: string;
  imageUrl?: string;
  rawText?: string;
  extractedMedicines?: ExtractedMedicine[];
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  type: 'scam_check' | 'paper_translated' | 'medicine_status' | 'mood_check' | 'companion_chat' | 'show_me_how';
  title: string;
  details: string;
  badgeColor?: string;
}

export interface ScamClarificationQuestion {
  id: string;
  question: string;
  options: string[]; // ["Yes", "No", "Not sure"]
}

export interface ScamVerdict {
  verdict: 'STOP' | 'BE_CAREFUL' | 'SAFE';
  headline: string;
  reason: string;
  red_flags: string[];
  what_to_do_now: string[];
  never_do: string[];
  isFallback?: boolean;
}

export interface ShowMeHowStep {
  stepNumber: number;
  instruction: string;
  tip?: string;
  totalSteps: number;
}

export interface MoodRecord {
  date: string;
  mood: MoodType;
  timestamp: string;
}
