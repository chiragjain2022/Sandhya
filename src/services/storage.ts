import {
  UserProfile,
  FamilyContact,
  SavedPaper,
  ExtractedMedicine,
  ActivityLogItem,
  MoodRecord,
  MoodType,
} from '../types';

const STORAGE_KEYS = {
  PROFILE: 'sandhya_profile',
  PAPERS: 'sandhya_papers',
  MEDICINES: 'sandhya_medicines',
  FAMILY: 'sandhya_family',
  LOGS: 'sandhya_activity_logs',
  MOODS: 'sandhya_moods',
};

// Default initial profile
export const DEFAULT_PROFILE: UserProfile = {
  name: 'Kamla',
  age: 68,
  language: 'en',
  textSize: 'large',
  highContrast: false,
  nightMode: false,
  speechRate: 0.85,
  voiceGuidance: true,
  onboardingCompleted: true,
  demoMode: true,
};

// Demo Seed Data
export const DEMO_DATA = {
  profile: {
    ...DEFAULT_PROFILE,
    name: 'Kamla',
    demoMode: true,
    nightMode: false,
    onboardingCompleted: true,
  },
  familyContacts: [
    {
      id: 'fam_1',
      name: 'Rahul (Son)',
      relation: 'Son',
      phone: '+919876543210',
    },
  ] as FamilyContact[],
  medicines: [
    {
      id: 'med_1',
      name: 'Metformin 500mg',
      dose: '1 tablet after breakfast & dinner',
      timing: { morning: true, afternoon: false, night: true },
      duration: 'Ongoing (Sugar)',
      instructions: 'Take with warm water after food',
      statusToday: 'pending',
    },
    {
      id: 'med_2',
      name: 'Amlodipine 5mg',
      dose: '1 tablet in the morning',
      timing: { morning: true, afternoon: false, night: false },
      duration: 'Ongoing (BP)',
      instructions: 'Do not skip',
      statusToday: 'taken',
      lastTakenDate: new Date().toISOString().split('T')[0],
    },
  ] as ExtractedMedicine[],
  papers: [
    {
      id: 'paper_demo_1',
      title: 'State Bank of India - Annual KYC Refresh Notice',
      documentType: 'bank_letter' as const,
      plainSummary:
        'This letter from State Bank of India requests an update of your KYC details at your home branch within 5 days to keep your pension account active.',
      actionRequired: {
        required: true,
        what: 'Visit SBI branch with photo ID (Aadhaar or Voter ID) and 2 passport photos.',
      },
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: null,
      whoToContact: 'SBI Branch Manager or Toll-Free 1800 1234',
      documentsToKeepReady: ['Bank Passbook', 'Aadhaar Card Copy', 'Two Passport Photos'],
      callScript: [
        'Namaste, my name is Kamla. I am a senior citizen with a pension account.',
        'I received a KYC renewal letter. Can I come tomorrow morning at 11 AM?',
        'Will my son be allowed to assist me with the form?',
      ],
      warningIfSuspicious: null,
      savedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ] as SavedPaper[],
  activityLogs: [
    {
      id: 'log_1',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      type: 'medicine_status' as const,
      title: 'Medicine Taken',
      details: 'Amlodipine 5mg morning dose taken',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'log_2',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      type: 'paper_translated' as const,
      title: 'Paperwork Saved',
      details: 'SBI Annual KYC notice saved with reminder',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
  ] as ActivityLogItem[],
  moods: [
    {
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      mood: 'good' as const,
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    },
  ] as MoodRecord[],
};

// Safe storage wrapper
export const StorageService = {
  getProfile(): UserProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (stored) {
        return { ...DEFAULT_PROFILE, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Storage read error for profile:', e);
    }
    // Return demo profile by default for seamless instant demonstration
    return DEMO_DATA.profile;
  },

  saveProfile(profileOrUpdates: Partial<UserProfile>): UserProfile {
    try {
      const current = this.getProfile();
      const updated: UserProfile = { ...current, ...profileOrUpdates };
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('Storage save error for profile:', e);
      return this.getProfile();
    }
  },

  getPapers(): SavedPaper[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PAPERS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Storage read error for papers:', e);
    }
    return DEMO_DATA.papers;
  },

  savePapers(papers: SavedPaper[]): SavedPaper[] {
    try {
      localStorage.setItem(STORAGE_KEYS.PAPERS, JSON.stringify(papers));
    } catch (e) {
      console.warn('Storage save error for papers:', e);
    }
    return papers;
  },

  savePaper(paper: SavedPaper): SavedPaper[] {
    return this.addPaper(paper);
  },

  addPaper(paper: SavedPaper): SavedPaper[] {
    const papers = this.getPapers();
    const updated = [paper, ...papers];
    this.savePapers(updated);
    this.addLog({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      type: 'paper_translated',
      title: 'New Paper Saved',
      details: paper.title,
    });
    return updated;
  },

  deletePaper(id: string): SavedPaper[] {
    const papers = this.getPapers();
    const filtered = papers.filter((p) => p.id !== id);
    this.savePapers(filtered);
    return filtered;
  },

  getMedicines(): ExtractedMedicine[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MEDICINES);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Storage read error for medicines:', e);
    }
    return DEMO_DATA.medicines;
  },

  saveMedicines(medicines: ExtractedMedicine[]): ExtractedMedicine[] {
    try {
      localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(medicines));
    } catch (e) {
      console.warn('Storage save error for medicines:', e);
    }
    return medicines;
  },

  addMedicine(medicine: ExtractedMedicine): ExtractedMedicine[] {
    const medicines = this.getMedicines();
    const updated = [...medicines, medicine];
    this.saveMedicines(updated);
    return updated;
  },

  deleteMedicine(id: string): ExtractedMedicine[] {
    const medicines = this.getMedicines();
    const updated = medicines.filter((m) => m.id !== id);
    this.saveMedicines(updated);
    return updated;
  },

  updateMedicineStatus(id: string, status: 'taken' | 'later' | 'pending'): ExtractedMedicine[] {
    const medicines = this.getMedicines();
    const today = new Date().toISOString().split('T')[0];
    const updated = medicines.map((m) => {
      if (m.id === id) {
        return {
          ...m,
          statusToday: status,
          lastTakenDate: status === 'taken' ? today : m.lastTakenDate,
        };
      }
      return m;
    });
    this.saveMedicines(updated);

    const med = medicines.find((m) => m.id === id);
    if (med) {
      this.addLog({
        id: 'log_' + Date.now(),
        timestamp: new Date().toISOString(),
        type: 'medicine_status',
        title: status === 'taken' ? 'Medicine Taken' : 'Medicine Postponed',
        details: `${med.name} (${status})`,
      });
    }
    return updated;
  },

  getFamilyContacts(): FamilyContact[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FAMILY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Storage read error for family:', e);
    }
    return DEMO_DATA.familyContacts;
  },

  saveFamilyContacts(contacts: FamilyContact[]): FamilyContact[] {
    try {
      localStorage.setItem(STORAGE_KEYS.FAMILY, JSON.stringify(contacts));
    } catch (e) {
      console.warn('Storage save error for family:', e);
    }
    return contacts;
  },

  addFamilyContact(contact: FamilyContact): FamilyContact[] {
    const current = this.getFamilyContacts();
    const updated = [...current, contact];
    return this.saveFamilyContacts(updated);
  },

  removeFamilyContact(id: string): FamilyContact[] {
    const current = this.getFamilyContacts();
    const updated = current.filter((c) => c.id !== id);
    return this.saveFamilyContacts(updated);
  },

  getActivityLogs(): ActivityLogItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Storage read error for logs:', e);
    }
    return DEMO_DATA.activityLogs;
  },

  addLog(item: ActivityLogItem): ActivityLogItem[] {
    try {
      const logs = this.getActivityLogs();
      const updated = [item, ...logs].slice(0, 50); // Keep latest 50
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('Storage save error for logs:', e);
      return this.getActivityLogs();
    }
  },

  addActivityLog(title: string, details: string, badgeColor?: string): ActivityLogItem[] {
    return this.addLog({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      type: 'medicine_status',
      title,
      details,
      badgeColor,
    });
  },

  getMoods(): MoodRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MOODS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Storage read error for moods:', e);
    }
    return DEMO_DATA.moods;
  },

  recordMood(mood: MoodType): MoodRecord[] {
    try {
      const moods = this.getMoods();
      const today = new Date().toISOString().split('T')[0];
      const record: MoodRecord = {
        date: today,
        mood,
        timestamp: new Date().toISOString(),
      };
      const filtered = moods.filter((m) => m.date !== today);
      const updated = [record, ...filtered];
      localStorage.setItem(STORAGE_KEYS.MOODS, JSON.stringify(updated));

      this.addLog({
        id: 'log_' + Date.now(),
        timestamp: new Date().toISOString(),
        type: 'mood_check',
        title: 'Daily Mood Logged',
        details: `Felt ${mood === 'good' ? 'Happy & Good' : mood === 'okay' ? 'Okay' : 'Not well'} today`,
      });

      return updated;
    } catch (e) {
      console.warn('Storage error recording mood:', e);
      return this.getMoods();
    }
  },

  loadDemoMode(): void {
    this.saveProfile(DEMO_DATA.profile);
    this.savePapers(DEMO_DATA.papers);
    this.saveMedicines(DEMO_DATA.medicines);
    this.saveFamilyContacts(DEMO_DATA.familyContacts);
    this.saveMedicines(DEMO_DATA.medicines);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(DEMO_DATA.activityLogs));
    localStorage.setItem(STORAGE_KEYS.MOODS, JSON.stringify(DEMO_DATA.moods));
  },

  clearAllData(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.PROFILE);
      localStorage.removeItem(STORAGE_KEYS.PAPERS);
      localStorage.removeItem(STORAGE_KEYS.MEDICINES);
      localStorage.removeItem(STORAGE_KEYS.FAMILY);
      localStorage.removeItem(STORAGE_KEYS.LOGS);
      localStorage.removeItem(STORAGE_KEYS.MOODS);
    } catch (e) {
      console.warn('Clear storage error:', e);
    }
  },
};
