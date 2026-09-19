import React, { useState } from 'react';
import {
  Pill,
  Plus,
  CheckCircle2,
  Clock,
  Volume2,
  Trash2,
  Sun,
  Sunset,
  Moon,
  AlertCircle,
} from 'lucide-react';
import { UserProfile, ExtractedMedicine } from '../types';
import { speechService } from '../services/speech';
import { ConfirmationModal } from '../components/ConfirmationModal';

interface MedicinesScreenProps {
  profile: UserProfile;
  medicines: ExtractedMedicine[];
  onAddMedicine: (med: ExtractedMedicine) => void;
  onUpdateMedicineStatus: (id: string, status: 'taken' | 'later' | 'pending') => void;
  onDeleteMedicine: (id: string) => void;
  isSpeaking: boolean;
}

export const MedicinesScreen: React.FC<MedicinesScreenProps> = ({
  profile,
  medicines,
  onAddMedicine,
  onUpdateMedicineStatus,
  onDeleteMedicine,
  isSpeaking: _isSpeaking,
}) => {
  const isNight = !!profile.nightMode;
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [medName, setMedName] = useState<string>('');
  const [medDose, setMedDose] = useState<string>('1 tablet');
  const [morning, setMorning] = useState<boolean>(true);
  const [afternoon, setAfternoon] = useState<boolean>(false);
  const [night, setNight] = useState<boolean>(true);
  const [instructions, setInstructions] = useState<string>('After food');

  // Delete confirm
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleSaveNewMed = () => {
    if (!medName.trim()) return;

    const newMed: ExtractedMedicine = {
      id: 'med_' + Date.now(),
      name: medName.trim(),
      dose: medDose.trim() || '1 tablet',
      morning,
      afternoon,
      night,
      duration: 'Ongoing',
      instructions: instructions.trim(),
      statusToday: 'pending',
    };

    onAddMedicine(newMed);
    setShowAddModal(false);
    setMedName('');
    setMedDose('1 tablet');
    setInstructions('After food');
  };

  const handleSpeakMedicineReminder = (med: ExtractedMedicine) => {
    const text =
      profile.language === 'hi'
        ? `दवाई का समय: ${med.name}, मात्रा: ${med.dose}। ${med.instructions}।`
        : `Medicine reminder: It is time for ${med.name}, dose ${med.dose}. ${med.instructions}.`;

    speechService.speak(text, profile.language, profile.speechRate);
  };

  return (
    <main
      id="screen-medicines"
      className="pb-28 pt-2 px-3 sm:px-6 max-w-4xl mx-auto space-y-6"
    >
      {/* Header Banner */}
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
            <Pill className="w-8 h-8" />
          </div>
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold font-heading tracking-tight"
              style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
            >
              {profile.language === 'hi' ? 'दवाइयों की सूची' : 'My Medicines'}
            </h1>
            <p
              className="text-base sm:text-lg font-medium"
              style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}
            >
              {profile.language === 'hi'
                ? 'समय पर याद दिलाने और खुराक का रिकॉर्ड रखने के लिए'
                : 'Anticipating your health schedule with clear, gentle reminders.'}
            </p>
          </div>
        </div>

        <button
          id="btn-open-add-med"
          onClick={() => setShowAddModal(true)}
          className="min-h-[52px] px-6 rounded-full font-semibold text-lg text-white flex items-center gap-2 shadow-xs shrink-0 cursor-pointer hover:opacity-90"
          style={{ backgroundColor: '#0F8B8D' }}
        >
          <Plus className="w-6 h-6" />
          <span>{profile.language === 'hi' ? 'नई दवाई जोड़ें' : 'Add medicine'}</span>
        </button>
      </div>

      {/* Safety Notice */}
      <div
        className="p-5 rounded-[20px] border flex items-center gap-4 shadow-xs"
        style={{
          backgroundColor: isNight ? '#1A3340' : '#EAF6F5',
          borderColor: '#0F8B8D',
        }}
      >
        <AlertCircle className="w-7 h-7 shrink-0" style={{ color: '#0F8B8D' }} />
        <p
          className="text-base font-medium"
          style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}
        >
          {profile.language === 'hi'
            ? 'कृपया हमेशा अपने डॉक्टर या फार्मासिस्ट की सलाह के अनुसार ही दवा लें। Sandhya केवल याद दिलाने का माध्यम है।'
            : 'Always follow your doctor’s explicit prescription and advice. Sandhya serves as your gentle daily memory reminder.'}
        </p>
      </div>

      {/* Medicines List */}
      {medicines.length === 0 ? (
        <div
          className="p-10 text-center rounded-[24px] twilight-card space-y-3"
          style={{
            backgroundColor: profile.highContrast
              ? '#111111'
              : isNight
              ? '#23225A'
              : '#FFFFFF',
            borderColor: isNight ? '#333270' : '#E4E1F5',
          }}
        >
          <p
            className="text-xl font-bold font-heading"
            style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
          >
            {profile.language === 'hi' ? 'अभी कोई दवाई दर्ज नहीं है।' : 'No medicines listed yet.'}
          </p>
          <p
            className="text-base font-medium"
            style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}
          >
            {profile.language === 'hi'
              ? 'आप डॉक्टर का पर्चा स्कैन कर सकते हैं या ऊपर बटन दबाकर स्वयं जोड़ सकते हैं।'
              : 'You can scan a prescription in "Help with a paper" or tap Add Medicine above.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {medicines.map((med) => {
            const isTaken = med.statusToday === 'taken';

            return (
              <div
                key={med.id}
                className="p-6 sm:p-7 rounded-[24px] twilight-card space-y-4 transition-all"
                style={{
                  backgroundColor: profile.highContrast
                    ? '#111111'
                    : isNight
                    ? isTaken
                      ? '#172E27'
                      : '#23225A'
                    : isTaken
                    ? '#F0FDF4'
                    : '#FFFFFF',
                  borderColor: isTaken
                    ? '#86EFAC'
                    : isNight
                    ? '#333270'
                    : '#E4E1F5',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3
                        className="text-2xl sm:text-3xl font-bold font-heading"
                        style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
                      >
                        {med.name}
                      </h3>
                      {isTaken && (
                        <span
                          className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full text-white shadow-xs"
                          style={{ backgroundColor: '#1B7F3B' }}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Taken today
                        </span>
                      )}
                    </div>
                    <p
                      className="text-lg font-medium mt-1"
                      style={{ color: '#0F8B8D' }}
                    >
                      {med.dose} • {med.instructions}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSpeakMedicineReminder(med)}
                      className="p-2.5 rounded-full border transition-colors cursor-pointer"
                      style={{
                        borderColor: isNight ? '#333270' : '#E4E1F5',
                        color: '#0F8B8D',
                      }}
                      title="Speak reminder"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setDeleteTargetId(med.id)}
                      className="p-2.5 rounded-full border text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                      style={{ borderColor: isNight ? '#333270' : '#E4E1F5' }}
                      title="Delete medicine"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Timing Chips */}
                <div className="flex flex-wrap gap-2">
                  {med.morning && (
                    <span
                      className="px-3.5 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 border"
                      style={{
                        backgroundColor: isNight ? '#1C1B45' : '#F4F2FF',
                        borderColor: isNight ? '#333270' : '#E4E1F5',
                        color: '#3B3A9E',
                      }}
                    >
                      <Sun className="w-4 h-4" />
                      <span>{profile.language === 'hi' ? 'सुबह (Morning)' : 'Morning'}</span>
                    </span>
                  )}
                  {med.afternoon && (
                    <span
                      className="px-3.5 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 border"
                      style={{
                        backgroundColor: isNight ? '#1A3340' : '#EAF6F5',
                        borderColor: '#B2E2E0',
                        color: '#0F8B8D',
                      }}
                    >
                      <Sunset className="w-4 h-4" />
                      <span>{profile.language === 'hi' ? 'दोपहर (Afternoon)' : 'Afternoon'}</span>
                    </span>
                  )}
                  {med.night && (
                    <span
                      className="px-3.5 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 border"
                      style={{
                        backgroundColor: isNight ? '#25245E' : '#ECEBFC',
                        borderColor: isNight ? '#44438A' : '#D1CEF0',
                        color: '#3B3A9E',
                      }}
                    >
                      <Moon className="w-4 h-4" />
                      <span>{profile.language === 'hi' ? 'रात (Night)' : 'Night'}</span>
                    </span>
                  )}
                </div>

                {/* Big Taken / Later Action Buttons */}
                <div
                  className="pt-3 border-t flex flex-col sm:flex-row items-center gap-3"
                  style={{ borderColor: isNight ? '#333270' : '#E4E1F5' }}
                >
                  {!isTaken ? (
                    <>
                      <button
                        onClick={() => onUpdateMedicineStatus(med.id, 'taken')}
                        className="w-full sm:w-auto flex-1 min-h-[56px] px-6 rounded-full font-semibold text-xl text-white flex items-center justify-center gap-2 shadow-xs cursor-pointer hover:opacity-90"
                        style={{ backgroundColor: '#1B7F3B' }}
                      >
                        <CheckCircle2 className="w-6 h-6" />
                        <span>{profile.language === 'hi' ? 'दवाई ले ली (Taken)' : 'Taken'}</span>
                      </button>
                      <button
                        onClick={() => onUpdateMedicineStatus(med.id, 'later')}
                        className="w-full sm:w-auto min-h-[56px] px-8 rounded-full font-semibold text-lg border flex items-center justify-center gap-2 cursor-pointer transition-colors"
                        style={{
                          backgroundColor: isNight ? '#23225A' : '#FFFFFF',
                          borderColor: isNight ? '#333270' : '#E4E1F5',
                          color: isNight ? '#F2F1FF' : '#16163A',
                        }}
                      >
                        <Clock className="w-5 h-5" style={{ color: '#0F8B8D' }} />
                        <span>{profile.language === 'hi' ? 'थोड़ी देर बाद (Later)' : 'Later'}</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <p className="text-base font-semibold text-[#1B7F3B]">
                        {profile.language === 'hi' ? 'आज की खुराक पूरी हुई' : 'Marked as taken for today'}
                      </p>
                      <button
                        onClick={() => onUpdateMedicineStatus(med.id, 'pending')}
                        className="text-sm font-semibold underline cursor-pointer"
                        style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}
                      >
                        Undo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-lg rounded-[24px] border p-6 sm:p-8 shadow-2xl space-y-5"
            style={{
              backgroundColor: isNight ? '#23225A' : '#FFFFFF',
              borderColor: isNight ? '#333270' : '#E4E1F5',
              color: isNight ? '#F2F1FF' : '#16163A',
            }}
          >
            <h3
              className="text-2xl sm:text-3xl font-bold font-heading"
              style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
            >
              {profile.language === 'hi' ? 'नई दवाई जोड़ें' : 'Add New Medicine'}
            </h3>

            <div className="space-y-4">
              <div>
                <label
                  className="block text-lg font-semibold mb-1"
                  style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
                >
                  Medicine Name
                </label>
                <input
                  type="text"
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  placeholder="e.g. Telma 40 or Disprin"
                  className="w-full min-h-[56px] px-5 rounded-full border text-xl font-bold"
                  style={{
                    backgroundColor: isNight ? '#1C1B45' : '#FFFFFF',
                    borderColor: isNight ? '#333270' : '#E4E1F5',
                    color: isNight ? '#F2F1FF' : '#16163A',
                  }}
                />
              </div>

              <div>
                <label
                  className="block text-lg font-semibold mb-1"
                  style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
                >
                  Dose
                </label>
                <input
                  type="text"
                  value={medDose}
                  onChange={(e) => setMedDose(e.target.value)}
                  placeholder="e.g. 1 tablet or 5ml"
                  className="w-full min-h-[56px] px-5 rounded-full border text-xl font-bold"
                  style={{
                    backgroundColor: isNight ? '#1C1B45' : '#FFFFFF',
                    borderColor: isNight ? '#333270' : '#E4E1F5',
                    color: isNight ? '#F2F1FF' : '#16163A',
                  }}
                />
              </div>

              <div>
                <label
                  className="block text-lg font-semibold mb-2"
                  style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
                >
                  When do you take it?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMorning(!morning)}
                    className="min-h-[52px] rounded-full font-semibold text-base border flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    style={{
                      backgroundColor: morning ? '#3B3A9E' : 'transparent',
                      color: morning ? '#FFFFFF' : isNight ? '#B0B0D8' : '#3F3F66',
                      borderColor: morning ? '#3B3A9E' : isNight ? '#333270' : '#E4E1F5',
                    }}
                  >
                    <Sun className="w-5 h-5" />
                    <span>Morning</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAfternoon(!afternoon)}
                    className="min-h-[52px] rounded-full font-semibold text-base border flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    style={{
                      backgroundColor: afternoon ? '#3B3A9E' : 'transparent',
                      color: afternoon ? '#FFFFFF' : isNight ? '#B0B0D8' : '#3F3F66',
                      borderColor: afternoon ? '#3B3A9E' : isNight ? '#333270' : '#E4E1F5',
                    }}
                  >
                    <Sunset className="w-5 h-5" />
                    <span>Afternoon</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNight(!night)}
                    className="min-h-[52px] rounded-full font-semibold text-base border flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    style={{
                      backgroundColor: night ? '#3B3A9E' : 'transparent',
                      color: night ? '#FFFFFF' : isNight ? '#B0B0D8' : '#3F3F66',
                      borderColor: night ? '#3B3A9E' : isNight ? '#333270' : '#E4E1F5',
                    }}
                  >
                    <Moon className="w-5 h-5" />
                    <span>Night</span>
                  </button>
                </div>
              </div>

              <div>
                <label
                  className="block text-lg font-semibold mb-1"
                  style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
                >
                  Instructions
                </label>
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. After meals with warm water"
                  className="w-full min-h-[56px] px-5 rounded-full border text-lg font-medium"
                  style={{
                    backgroundColor: isNight ? '#1C1B45' : '#FFFFFF',
                    borderColor: isNight ? '#333270' : '#E4E1F5',
                    color: isNight ? '#F2F1FF' : '#16163A',
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleSaveNewMed}
                disabled={!medName.trim()}
                className="flex-1 min-h-[58px] rounded-full font-semibold text-xl text-white disabled:opacity-40 cursor-pointer shadow-xs"
                style={{ backgroundColor: '#3B3A9E' }}
              >
                Save Medicine
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="min-h-[58px] px-8 rounded-full font-semibold text-lg border cursor-pointer"
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

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        title="Remove Medicine?"
        message="Are you sure you want to remove this medicine from your list?"
        confirmLabel="Yes, Remove"
        cancelLabel="Keep it"
        onConfirm={() => {
          if (deleteTargetId) onDeleteMedicine(deleteTargetId);
          setDeleteTargetId(null);
        }}
        onCancel={() => setDeleteTargetId(null)}
        destructive
        language={profile.language}
        highContrast={profile.highContrast}
      />
    </main>
  );
};
