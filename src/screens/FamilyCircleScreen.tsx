import React, { useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Share2,
  ShieldCheck,
  Phone,
  MessageCircle,
  FileText,
  Volume2,
  Sparkles,
  Settings as SettingsIcon,
  Moon,
  Sun,
} from 'lucide-react';
import {
  UserProfile,
  FamilyContact,
  ActivityLogItem,
  ExtractedMedicine,
  SavedPaper,
  MoodRecord,
  Language,
  TextSize,
} from '../types';
import { ApiService } from '../services/api';
import { speechService } from '../services/speech';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { LoadingState } from '../components/LoadingState';

interface FamilyCircleScreenProps {
  profile: UserProfile;
  familyContacts: FamilyContact[];
  activityLogs: ActivityLogItem[];
  medicines: ExtractedMedicine[];
  papers: SavedPaper[];
  moods: MoodRecord[];
  onAddContact: (contact: FamilyContact) => void;
  onRemoveContact: (id: string) => void;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onResetAllData: () => void;
  isSpeaking: boolean;
}

export const FamilyCircleScreen: React.FC<FamilyCircleScreenProps> = ({
  profile,
  familyContacts,
  activityLogs,
  medicines,
  papers,
  moods,
  onAddContact,
  onRemoveContact,
  onUpdateProfile,
  onResetAllData,
  isSpeaking: _isSpeaking,
}) => {
  const isNight = !!profile.nightMode;
  const [activeTab, setActiveTab] = useState<'family' | 'settings'>('family');

  // New contact modal
  const [showAddContact, setShowAddContact] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newRelation, setNewRelation] = useState<string>('Child');
  const [newPhone, setNewPhone] = useState<string>('');

  // Weekly summary state
  const [weeklySummary, setWeeklySummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);

  // Delete all data modal
  const [showDeleteDataModal, setShowDeleteDataModal] = useState<boolean>(false);

  // Generate Weekly Family Summary
  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    setWeeklySummary(null);

    const scamsChecked = activityLogs.filter((l) => l.title.includes('Safety Check')).length;
    const medicinesTaken = medicines.filter((m) => m.statusToday === 'taken').length;
    const moodList = moods.map((m) => m.mood);
    const deadlines = papers
      .filter((p) => p.deadline)
      .map((p) => `${p.title} (due ${p.deadline})`);

    try {
      const summary = await ApiService.getWeeklyFamilySummary({
        userName: profile.name,
        activityCount: activityLogs.length,
        scamsChecked,
        medicinesTakenCount: medicinesTaken,
        moods: moodList,
        deadlinesUpcoming: deadlines,
        language: profile.language,
      });

      setWeeklySummary(summary);
      speechService.playChime('success');
      speechService.speak(summary, profile.language, profile.speechRate);
    } catch (e) {
      console.error(e);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleShareToWhatsApp = (contact?: FamilyContact, customText?: string) => {
    const textToShare = customText || weeklySummary;
    if (!textToShare) return;
    const phone = contact?.phone ? contact.phone.replace(/[^0-9]/g, '') : '';
    const encoded = encodeURIComponent(textToShare);

    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  const handleSendCheckIn = (contact: FamilyContact) => {
    const greeting =
      profile.language === 'hi'
        ? `नमस्ते ${contact.name}! मैं ठीक हूँ और सब कुशल-मंगल है। Sandhya ऐप के माध्यम से यह संदेश भेज रही हूँ।`
        : `Namaste ${contact.name}! I am doing well, taking my medicines on time and feeling good today. Sent via Sandhya app.`;
    handleShareToWhatsApp(contact, greeting);
  };

  const handleSaveNewContact = () => {
    if (!newName.trim() || !newPhone.trim()) return;

    onAddContact({
      id: 'contact_' + Date.now(),
      name: newName.trim(),
      relation: newRelation.trim() || 'Family',
      phone: newPhone.trim(),
    });

    setShowAddContact(false);
    setNewName('');
    setNewPhone('');
  };

  // Status indicator helper: If medicines pending or mood not well, amber, else green
  const getContactStatus = (idx: number) => {
    const pendingMeds = medicines.filter((m) => m.statusToday !== 'taken').length;
    if (idx === 0 && pendingMeds > 1) {
      return { status: 'amber', label: 'Needs a check-in' };
    }
    return { status: 'green', label: 'Doing well' };
  };

  return (
    <main
      id="screen-family-circle"
      className="pb-28 pt-2 px-3 sm:px-6 max-w-4xl mx-auto space-y-6"
    >
      {/* Top Banner with Subtabs (Family Circle vs Settings) */}
      <div
        className="p-6 rounded-[24px] twilight-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
        style={{
          backgroundColor: profile.highContrast
            ? '#111111'
            : isNight
            ? '#23225A'
            : '#FFFFFF',
          borderColor: isNight ? '#333270' : '#E4E1F5',
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
            style={{ backgroundColor: '#3B3A9E', color: '#FFFFFF' }}
          >
            {activeTab === 'family' ? (
              <Users className="w-8 h-8" />
            ) : (
              <SettingsIcon className="w-8 h-8" />
            )}
          </div>
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold font-heading tracking-tight"
              style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
            >
              {activeTab === 'family'
                ? profile.language === 'hi'
                  ? 'परिवार और सुरक्षा (Family Circle)'
                  : 'Family Circle'
                : profile.language === 'hi'
                ? 'सेटिंग्स और विकल्प'
                : 'App Settings'}
            </h1>
            <p
              className="text-base sm:text-lg font-medium"
              style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}
            >
              {activeTab === 'family'
                ? profile.language === 'hi'
                  ? 'केवल आपकी अनुमति से परिवार को शांति और अपडेट दें'
                  : 'Keeps loved ones assured, always strictly with your permission.'
                : profile.language === 'hi'
                ? 'भाषा, आवाज़ की गति और डेमो मोड प्रबंधित करें'
                : 'Manage voice speed, language, and demo mode.'}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div
          className="p-1 rounded-full border flex items-center gap-1 w-full sm:w-auto"
          style={{
            backgroundColor: isNight ? '#1C1B45' : '#F4F2FF',
            borderColor: isNight ? '#333270' : '#E4E1F5',
          }}
        >
          <button
            onClick={() => setActiveTab('family')}
            className="flex-1 sm:flex-initial px-5 py-2 rounded-full font-semibold text-base transition-all cursor-pointer"
            style={{
              backgroundColor: activeTab === 'family' ? '#3B3A9E' : 'transparent',
              color: activeTab === 'family' ? '#FFFFFF' : isNight ? '#B0B0D8' : '#3F3F66',
            }}
          >
            {profile.language === 'hi' ? 'परिवार' : 'Family Circle'}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className="flex-1 sm:flex-initial px-5 py-2 rounded-full font-semibold text-base transition-all cursor-pointer"
            style={{
              backgroundColor: activeTab === 'settings' ? '#3B3A9E' : 'transparent',
              color: activeTab === 'settings' ? '#FFFFFF' : isNight ? '#B0B0D8' : '#3F3F66',
            }}
          >
            {profile.language === 'hi' ? 'सेटिंग्स' : 'Settings'}
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: FAMILY CIRCLE */}
      {activeTab === 'family' && (
        <div className="space-y-6">
          {/* Privacy Guarantee Note */}
          <div
            className="p-5 rounded-[20px] border flex items-center gap-4 shadow-xs"
            style={{
              backgroundColor: isNight ? '#1A3340' : '#EAF6F5',
              borderColor: '#0F8B8D',
            }}
          >
            <ShieldCheck className="w-9 h-9 shrink-0" style={{ color: '#0F8B8D' }} />
            <div>
              <h4
                className="font-bold text-lg font-heading"
                style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
              >
                {profile.language === 'hi' ? 'गोपनीयता की गारंटी' : 'Sandhya Privacy Guarantee'}
              </h4>
              <p
                className="text-base font-medium"
                style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}
              >
                {profile.language === 'hi'
                  ? 'Sandhya आपकी सहमति के बिना परिवार को कभी कोई संदेश नहीं भेजती। आप जो भी साझा करते हैं, वह पहले आप खुद देखते हैं।'
                  : 'Sandhya never messages your family without asking you first. You always preview and approve anything shared.'}
              </p>
            </div>
          </div>

          {/* Trusted Contacts List with Avatars and Status Indicator Dots */}
          <section
            id="family-contacts-section"
            className="p-6 sm:p-8 rounded-[24px] twilight-card space-y-5"
            style={{
              backgroundColor: profile.highContrast
                ? '#111111'
                : isNight
                ? '#23225A'
                : '#FFFFFF',
              borderColor: isNight ? '#333270' : '#E4E1F5',
            }}
          >
            <div className="flex items-center justify-between">
              <h3
                className="text-xl sm:text-2xl font-bold font-heading"
                style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
              >
                {profile.language === 'hi' ? 'विश्वस्त संपर्क (अधिकतम 3)' : 'Trusted Contacts (Up to 3)'}
              </h3>

              {familyContacts.length < 3 && (
                <button
                  onClick={() => setShowAddContact(true)}
                  className="px-5 py-2.5 rounded-full font-semibold text-base text-white flex items-center gap-2 shadow-xs cursor-pointer hover:opacity-90"
                  style={{ backgroundColor: '#0F8B8D' }}
                >
                  <Plus className="w-5 h-5" />
                  <span>{profile.language === 'hi' ? 'संपर्क जोड़ें' : 'Add Contact'}</span>
                </button>
              )}
            </div>

            {familyContacts.length === 0 ? (
              <p
                className="text-lg italic py-4"
                style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}
              >
                {profile.language === 'hi'
                  ? 'अभी कोई पारिवारिक संपर्क नहीं जोड़ा गया है। आप ऊपर बटन दबाकर जोड़ सकते हैं।'
                  : 'No family contact added yet. Tap Add Contact above.'}
              </p>
            ) : (
              <div className="space-y-4">
                {familyContacts.map((c, idx) => {
                  const statusInfo = getContactStatus(idx);
                  const isDoingWell = statusInfo.status === 'green';

                  return (
                    <div
                      key={c.id}
                      className="p-5 rounded-[20px] border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
                      style={{
                        backgroundColor: isNight ? '#1C1B45' : '#F9F8FE',
                        borderColor: isNight ? '#333270' : '#E4E1F5',
                      }}
                    >
                      {/* Avatar with Soft Teal/Indigo Ring & Status Indicator Dot */}
                      <div className="flex items-center gap-4">
                        <div className="relative shrink-0">
                          <div
                            className="w-14 h-14 rounded-full border-2 flex items-center justify-center font-bold text-xl shadow-xs"
                            style={{
                              backgroundColor: idx % 2 === 0 ? '#F4F2FF' : '#EAF6F5',
                              borderColor: idx % 2 === 0 ? '#3B3A9E' : '#0F8B8D',
                              color: idx % 2 === 0 ? '#3B3A9E' : '#0F8B8D',
                            }}
                          >
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          {/* Status Dot: Green = doing well, Amber = needs a check-in */}
                          <span
                            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white shadow-xs"
                            style={{
                              backgroundColor: isDoingWell ? '#1B7F3B' : '#A15C00',
                            }}
                            title={statusInfo.label}
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-xl font-bold font-heading"
                              style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
                            >
                              {c.name}
                            </span>
                            <span
                              className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                              style={{
                                backgroundColor: isNight ? '#23225A' : '#F4F2FF',
                                color: '#3B3A9E',
                              }}
                            >
                              {c.relation}
                            </span>
                          </div>
                          <p
                            className="text-sm font-medium mt-0.5"
                            style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}
                          >
                            {c.phone} •{' '}
                            <span
                              className="font-semibold"
                              style={{ color: isDoingWell ? '#1B7F3B' : '#A15C00' }}
                            >
                              {statusInfo.label}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Clean Action Buttons: Check-in via WhatsApp / Call */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleSendCheckIn(c)}
                          className="px-4 py-2 rounded-full font-semibold text-sm border flex items-center gap-1.5 transition-colors cursor-pointer"
                          style={{
                            backgroundColor: isNight ? '#1A3340' : '#EAF6F5',
                            borderColor: '#B2E2E0',
                            color: '#0F8B8D',
                          }}
                          title="Send quick check-in"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Check-in</span>
                        </button>

                        <a
                          href={`tel:${c.phone}`}
                          className="p-2.5 rounded-full border text-gray-400 hover:text-[#3B3A9E] transition-colors cursor-pointer"
                          style={{ borderColor: isNight ? '#333270' : '#E4E1F5' }}
                          title="Call directly"
                        >
                          <Phone className="w-5 h-5" />
                        </a>

                        <button
                          onClick={() => onRemoveContact(c.id)}
                          className="p-2.5 rounded-full border text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                          style={{ borderColor: isNight ? '#333270' : '#E4E1F5' }}
                          title="Remove contact"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Clean Action Card: Weekly Summary Generator */}
          <section
            id="family-summary-generator"
            className="p-6 sm:p-8 rounded-[24px] twilight-card space-y-5"
            style={{
              backgroundColor: profile.highContrast
                ? '#111111'
                : isNight
                ? '#23225A'
                : '#FFFFFF',
              borderColor: isNight ? '#333270' : '#E4E1F5',
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
                style={{ backgroundColor: '#EAF6F5', color: '#0F8B8D' }}
              >
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h3
                  className="text-xl sm:text-2xl font-bold font-heading"
                  style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
                >
                  {profile.language === 'hi' ? 'साप्ताहिक परिवार सारांश' : 'Weekly Kind Summary'}
                </h3>
                <p
                  className="text-base font-medium"
                  style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}
                >
                  {profile.language === 'hi'
                    ? 'दवाइयों, कागज़ात और दिनचर्या का सुखद सारांश जो परिवार को शांति दे'
                    : 'A short, comforting update about medicines, safety checks, and peace of mind.'}
                </p>
              </div>
            </div>

            {summaryLoading && (
              <LoadingState message="Sandhya is preparing the summary..." profile={profile} />
            )}

            {!summaryLoading && !weeklySummary && (
              <button
                id="btn-generate-family-summary"
                onClick={handleGenerateSummary}
                className="w-full min-h-[58px] rounded-full font-semibold text-xl text-white shadow-md flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition-all"
                style={{ backgroundColor: '#3B3A9E' }}
              >
                <FileText className="w-6 h-6" />
                <span>{profile.language === 'hi' ? 'साप्ताहिक सारांश तैयार करें' : 'Generate Weekly Summary'}</span>
              </button>
            )}

            {!summaryLoading && weeklySummary && (
              <div className="space-y-4">
                <div
                  className="p-6 rounded-[20px] border text-xl font-medium leading-relaxed shadow-xs"
                  style={{
                    backgroundColor: isNight ? '#1C1B45' : '#F4F2FF',
                    borderColor: isNight ? '#333270' : '#D1CEF0',
                    color: isNight ? '#F2F1FF' : '#16163A',
                  }}
                >
                  <p className="whitespace-pre-line">{weeklySummary}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleShareToWhatsApp(familyContacts[0])}
                    className="flex-1 min-h-[58px] rounded-full font-semibold text-xl text-white flex items-center justify-center gap-3 shadow-md cursor-pointer transition-colors"
                    style={{ backgroundColor: '#0F8B8D' }}
                  >
                    <Share2 className="w-6 h-6" />
                    <span>{profile.language === 'hi' ? 'WhatsApp पर साझा करें' : 'Share via WhatsApp'}</span>
                  </button>

                  <button
                    onClick={() => speechService.speak(weeklySummary, profile.language, profile.speechRate)}
                    className="min-h-[58px] px-8 rounded-full font-semibold text-lg border flex items-center justify-center gap-2 cursor-pointer"
                    style={{
                      backgroundColor: isNight ? '#23225A' : '#FFFFFF',
                      borderColor: isNight ? '#333270' : '#E4E1F5',
                      color: isNight ? '#F2F1FF' : '#16163A',
                    }}
                  >
                    <Volume2 className="w-6 h-6" style={{ color: '#0F8B8D' }} />
                    <span>Read aloud</span>
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* SUB-TAB 2: SETTINGS (with Sleek Pill Switch for Demo Mode) */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <section
            id="settings-controls-section"
            className="p-6 sm:p-8 rounded-[24px] twilight-card space-y-6"
            style={{
              backgroundColor: profile.highContrast
                ? '#111111'
                : isNight
                ? '#23225A'
                : '#FFFFFF',
              borderColor: isNight ? '#333270' : '#E4E1F5',
            }}
          >
            {/* User Name */}
            <div>
              <label
                className="block text-lg font-bold font-heading mb-1.5"
                style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
              >
                Your Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => onUpdateProfile({ name: e.target.value })}
                className="w-full min-h-[56px] px-5 rounded-full border text-xl font-bold transition-colors"
                style={{
                  backgroundColor: profile.highContrast
                    ? '#222222'
                    : isNight
                    ? '#1C1B45'
                    : '#FFFFFF',
                  borderColor: isNight ? '#333270' : '#E4E1F5',
                  color: isNight ? '#F2F1FF' : '#16163A',
                }}
              />
              <p
                className="text-sm font-semibold mt-1 px-2"
                style={{ color: '#0F8B8D' }}
              >
                Addressed as: {profile.name} ji
              </p>
            </div>

            {/* Language */}
            <div>
              <label
                className="block text-lg font-bold font-heading mb-2"
                style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
              >
                Language
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['en', 'hi', 'hinglish'] as Language[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => onUpdateProfile({ language: l })}
                    className="min-h-[52px] rounded-full font-semibold text-base border transition-all cursor-pointer"
                    style={{
                      backgroundColor: profile.language === l ? '#3B3A9E' : 'transparent',
                      color: profile.language === l ? '#FFFFFF' : isNight ? '#B0B0D8' : '#3F3F66',
                      borderColor: profile.language === l ? '#3B3A9E' : isNight ? '#333270' : '#E4E1F5',
                    }}
                  >
                    {l === 'en' ? 'English' : l === 'hi' ? 'हिंदी' : 'Hinglish'}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Size */}
            <div>
              <label
                className="block text-lg font-bold font-heading mb-2"
                style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
              >
                Text Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['normal', 'large', 'huge'] as TextSize[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => onUpdateProfile({ textSize: s })}
                    className="min-h-[52px] rounded-full font-semibold text-base border transition-all cursor-pointer"
                    style={{
                      backgroundColor: profile.textSize === s ? '#3B3A9E' : 'transparent',
                      color: profile.textSize === s ? '#FFFFFF' : isNight ? '#B0B0D8' : '#3F3F66',
                      borderColor: profile.textSize === s ? '#3B3A9E' : isNight ? '#333270' : '#E4E1F5',
                    }}
                  >
                    {s === 'normal' ? 'Normal (A)' : s === 'large' ? 'Large (A+)' : 'Huge (A++)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Speech Rate */}
            <div>
              <label
                className="block text-lg font-bold font-heading mb-2"
                style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
              >
                Sandhya Voice Speed: {profile.speechRate <= 0.8 ? 'Slow & Gentle' : 'Standard'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdateProfile({ speechRate: 0.8 })}
                  className="min-h-[50px] rounded-full font-semibold text-base border transition-all cursor-pointer"
                  style={{
                    backgroundColor: profile.speechRate <= 0.8 ? '#3B3A9E' : 'transparent',
                    color: profile.speechRate <= 0.8 ? '#FFFFFF' : isNight ? '#B0B0D8' : '#3F3F66',
                    borderColor: profile.speechRate <= 0.8 ? '#3B3A9E' : isNight ? '#333270' : '#E4E1F5',
                  }}
                >
                  Slow & Clear (0.8x)
                </button>
                <button
                  onClick={() => onUpdateProfile({ speechRate: 1.0 })}
                  className="min-h-[50px] rounded-full font-semibold text-base border transition-all cursor-pointer"
                  style={{
                    backgroundColor: profile.speechRate > 0.8 ? '#3B3A9E' : 'transparent',
                    color: profile.speechRate > 0.8 ? '#FFFFFF' : isNight ? '#B0B0D8' : '#3F3F66',
                    borderColor: profile.speechRate > 0.8 ? '#3B3A9E' : isNight ? '#333270' : '#E4E1F5',
                  }}
                >
                  Standard (1.0x)
                </button>
              </div>
            </div>

            {/* Night Theme Toggle */}
            <div
              className="pt-5 border-t flex items-center justify-between"
              style={{ borderColor: isNight ? '#333270' : '#E4E1F5' }}
            >
              <div>
                <h4
                  className="text-xl font-bold font-heading"
                  style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
                >
                  Night Theme (Calm Twilight)
                </h4>
                <p
                  className="text-base font-medium"
                  style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}
                >
                  Gentle on senior eyes at dusk and night time.
                </p>
              </div>
              {/* Sleek Pill Switch for Night Mode */}
              <button
                type="button"
                role="switch"
                aria-checked={profile.nightMode}
                onClick={() => onUpdateProfile({ nightMode: !profile.nightMode })}
                className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  profile.nightMode ? 'bg-[#3B3A9E]' : 'bg-[#D1CEF0]'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    profile.nightMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Demo Mode Toggle - SLEEK PILL SWITCH */}
            <div
              className="pt-5 border-t flex items-center justify-between"
              style={{ borderColor: isNight ? '#333270' : '#E4E1F5' }}
            >
              <div>
                <h4
                  className="text-xl font-bold font-heading"
                  style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
                >
                  Demo Mode ("Kamla ji" sample)
                </h4>
                <p
                  className="text-base font-medium"
                  style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}
                >
                  Preloads Kamla ji profile, medicines, and sample letters for a rapid 2-minute demo.
                </p>
              </div>
              {/* Sleek Pill Switch */}
              <button
                id="toggle-demo-mode"
                type="button"
                role="switch"
                aria-checked={profile.demoMode}
                onClick={() => onUpdateProfile({ demoMode: !profile.demoMode })}
                className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  profile.demoMode ? 'bg-[#0F8B8D]' : isNight ? 'bg-[#333270]' : 'bg-[#D1CEF0]'
                }`}
                title={profile.demoMode ? 'Demo Mode Active' : 'Demo Mode Inactive'}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    profile.demoMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Delete All Data with Confirmation */}
            <div
              className="pt-5 border-t"
              style={{ borderColor: isNight ? '#333270' : '#E4E1F5' }}
            >
              <button
                id="btn-delete-all-data"
                onClick={() => setShowDeleteDataModal(true)}
                className="w-full min-h-[56px] rounded-full font-semibold text-lg border flex items-center justify-center gap-2 cursor-pointer transition-colors"
                style={{
                  backgroundColor: isNight ? '#331515' : '#FFF4F4',
                  borderColor: '#F8B4B4',
                  color: '#C62828',
                }}
              >
                <Trash2 className="w-5 h-5 text-[#C62828]" />
                <span>Delete All My Data</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-md rounded-[24px] border p-6 shadow-2xl space-y-4"
            style={{
              backgroundColor: isNight ? '#23225A' : '#FFFFFF',
              borderColor: isNight ? '#333270' : '#E4E1F5',
            }}
          >
            <h3
              className="text-2xl font-bold font-heading"
              style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
            >
              Add Family Contact
            </h3>

            <div>
              <label
                className="block text-base font-semibold mb-1"
                style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
              >
                Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Rahul"
                className="w-full min-h-[50px] px-4 rounded-full border text-lg font-semibold"
                style={{
                  backgroundColor: isNight ? '#1C1B45' : '#FFFFFF',
                  borderColor: isNight ? '#333270' : '#E4E1F5',
                  color: isNight ? '#F2F1FF' : '#16163A',
                }}
              />
            </div>

            <div>
              <label
                className="block text-base font-semibold mb-1"
                style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
              >
                Relationship
              </label>
              <input
                type="text"
                value={newRelation}
                onChange={(e) => setNewRelation(e.target.value)}
                placeholder="e.g. Son, Daughter, Grandchild"
                className="w-full min-h-[50px] px-4 rounded-full border text-lg font-semibold"
                style={{
                  backgroundColor: isNight ? '#1C1B45' : '#FFFFFF',
                  borderColor: isNight ? '#333270' : '#E4E1F5',
                  color: isNight ? '#F2F1FF' : '#16163A',
                }}
              />
            </div>

            <div>
              <label
                className="block text-base font-semibold mb-1"
                style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
              >
                Phone Number (with WhatsApp)
              </label>
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full min-h-[50px] px-4 rounded-full border text-lg font-semibold"
                style={{
                  backgroundColor: isNight ? '#1C1B45' : '#FFFFFF',
                  borderColor: isNight ? '#333270' : '#E4E1F5',
                  color: isNight ? '#F2F1FF' : '#16163A',
                }}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveNewContact}
                disabled={!newName.trim() || !newPhone.trim()}
                className="flex-1 min-h-[52px] rounded-full font-semibold text-lg text-white disabled:opacity-40 cursor-pointer shadow-xs"
                style={{ backgroundColor: '#3B3A9E' }}
              >
                Save Contact
              </button>
              <button
                onClick={() => setShowAddContact(false)}
                className="min-h-[52px] px-6 rounded-full font-semibold text-base border cursor-pointer"
                style={{
                  backgroundColor: isNight ? '#1C1B45' : '#FFFFFF',
                  borderColor: isNight ? '#333270' : '#E4E1F5',
                  color: isNight ? '#F2F1FF' : '#16163A',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Data Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteDataModal}
        title="Delete All Data?"
        message="This will completely clear your profile, saved papers, medicines, and activity records from this phone. Are you sure?"
        confirmLabel="Yes, Delete Everything"
        cancelLabel="No, Keep Data"
        onConfirm={() => {
          setShowDeleteDataModal(false);
          onResetAllData();
        }}
        onCancel={() => setShowDeleteDataModal(false)}
        destructive
        language={profile.language}
        highContrast={profile.highContrast}
      />
    </main>
  );
};
