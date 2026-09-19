import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Camera,
  Search,
  Volume2,
  PhoneCall,
  Save,
  CheckCircle,
  Sparkles,
  Calendar,
  Mic,
  ChevronDown,
  ChevronUp,
  Clock,
  Landmark,
  FileSpreadsheet,
  Stethoscope,
  Zap,
} from 'lucide-react';
import {
  UserProfile,
  SavedPaper,
  ExtractedMedicine,
} from '../types';
import { ApiService } from '../services/api';
import { speechService } from '../services/speech';
import { LoadingState } from '../components/LoadingState';
import { ConfirmationModal } from '../components/ConfirmationModal';

interface PapersScreenProps {
  profile: UserProfile;
  papers: SavedPaper[];
  onSavePaper: (paper: SavedPaper) => void;
  onAddMedicinesFromPrescription: (meds: ExtractedMedicine[]) => void;
  onNavigateToCheck: () => void;
  isSpeaking: boolean;
}

export const PapersScreen: React.FC<PapersScreenProps> = ({
  profile,
  papers,
  onSavePaper,
  onAddMedicinesFromPrescription,
  onNavigateToCheck: _onNavigateToCheck,
  isSpeaking: _isSpeaking,
}) => {
  const isNight = !!profile.nightMode;
  const [activeSubTab, setActiveSubTab] = useState<'translate' | 'mypapers'>('translate');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');

  // Input states
  const [inputText, setInputText] = useState<string>('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  // Result from translation
  const [translatedPaper, setTranslatedPaper] = useState<any | null>(null);
  const [showCallScript, setShowCallScript] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Prescription confirmation modal
  const [showPrescriptionModal, setShowPrescriptionModal] = useState<boolean>(false);

  // "Ask about my papers" state
  const [askQuery, setAskQuery] = useState<string>('');
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [askLoading, setAskLoading] = useState<boolean>(false);
  const [isAskingVoice, setIsAskingVoice] = useState<boolean>(false);

  // Search filter for saved papers
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sample bank letter
  const handleTrySampleBankLetter = () => {
    const sample =
      profile.language === 'hi'
        ? `स्टेट बैंक ऑफ इंडिया (SBI) - शाखा: मालवीय नगर, नई दिल्ली
दिनांक: 15 मार्च 2025
विषय: पेंशन खाता संख्या 3048291048 का वार्षिक जीवन प्रमाण पत्र एवं KYC नवीनीकरण

आदरणीय पेंशनधारक,
कृपया ध्यान दें कि आपके पेंशन खाते के सुचारू संचालन हेतु आपका वार्षिक जीवन प्रमाण पत्र (Life Certificate) अभी तक प्राप्त नहीं हुआ है। आपसे निवेदन है कि 25 अप्रैल 2025 से पूर्व अपने आधार कार्ड एवं पैन कार्ड की मूल प्रति के साथ अपनी गृह शाखा में उपस्थित हों या डिजिटल जीवन प्रमाण पत्र (Jeevan Pramaan) जमा करें।
किसी भी सहायता हेतु शाखा प्रबंधक से फोन: 011-26849301 पर संपर्क करें।`
        : `STATE BANK OF INDIA - Malviya Nagar Branch, New Delhi
Date: 15 March 2025
Ref: Annual Life Certificate and KYC Submission for Pension Account No: 3048291048

Dear Pensioner,
Please note that your Annual Life Certificate (Jeevan Pramaan) for the financial year is due for submission. Kindly submit the certificate before 25 April 2025 to ensure uninterrupted credit of your monthly pension.
You may visit the branch in person with your Aadhaar and PAN card, or submit digitally via Jeevan Pramaan portal.
For assistance, contact Branch Helpdesk at 011-26849301.`;

    setInputText(sample);
    setImageBase64(null);
  };

  // Sample prescription
  const handleTrySamplePrescription = () => {
    const sample = `Dr. Arvind Sharma, MBBS, MD (Medicine) - Clinic: Apollo Clinic
Patient: Kamla Sharma, Age: 68 yrs, Date: Today
Rx:
1. Tab Telma 40mg - 1 tablet daily in the morning after breakfast (Blood Pressure)
2. Tab Glycomet GP 1 - 1 tablet twice daily (Morning and Night before meals) (Diabetes)
3. Tab Shelcal 500 - 1 tablet in the afternoon after lunch (Calcium supplement)
Duration: 30 days. Review with blood sugar report after 1 month.`;

    setInputText(sample);
    setImageBase64(null);
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageBase64(reader.result as string);
      setInputText('');
    };
    reader.readAsDataURL(file);
  };

  // Run Paper Translation
  const handleTranslatePaper = async () => {
    if (!inputText.trim() && !imageBase64) return;

    setLoading(true);
    setLoadingMessage(
      profile.language === 'hi'
        ? 'Sandhya कागज़ात को ध्यानपूर्वक पढ़ रही है... कोई जल्दबाज़ी नहीं'
        : 'Sandhya is reading your paper carefully... no rush'
    );
    setTranslatedPaper(null);
    setSavedSuccess(false);

    try {
      let mimeType = 'image/jpeg';
      let b64 = undefined;
      if (imageBase64) {
        const parts = imageBase64.split(',');
        b64 = parts[1] || parts[0];
        if (parts[0].includes('image/png')) mimeType = 'image/png';
      }

      const result = await ApiService.translatePaper({
        imageBase64: b64,
        mimeType,
        textContent: inputText || undefined,
        language: profile.language,
      });

      setTranslatedPaper(result);

      // Play success chime & speak plain summary aloud
      speechService.playChime('success');
      speechService.speak(result.plain_summary, profile.language, profile.speechRate);
    } catch (err) {
      console.error('Translation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Save current translated paper
  const handleSaveToMyPapers = () => {
    if (!translatedPaper) return;

    const newPaper: SavedPaper = {
      id: 'paper_' + Date.now(),
      documentType: translatedPaper.document_type || 'other',
      title: translatedPaper.title || 'Official Document',
      plainSummary: translatedPaper.plain_summary || '',
      actionRequired: translatedPaper.action_required || { required: false, what: '' },
      deadline: translatedPaper.deadline || null,
      amount: translatedPaper.amount || null,
      whoToContact: translatedPaper.who_to_contact || null,
      documentsToKeepReady: translatedPaper.documents_to_keep_ready || [],
      callScript: translatedPaper.call_script || [],
      dateScanned: new Date().toISOString().split('T')[0],
      imageUrl: imageBase64 || undefined,
      rawText: inputText || undefined,
    };

    onSavePaper(newPaper);
    setSavedSuccess(true);
    speechService.playChime('success');

    // If prescription has medicines, open confirmation modal
    if (
      translatedPaper.document_type === 'prescription' &&
      translatedPaper.extracted_medicines &&
      translatedPaper.extracted_medicines.length > 0
    ) {
      setShowPrescriptionModal(true);
    }
  };

  // Add prescription medicines
  const handleConfirmPrescriptionMeds = () => {
    setShowPrescriptionModal(false);
    if (!translatedPaper?.extracted_medicines) return;

    const newMeds: ExtractedMedicine[] = translatedPaper.extracted_medicines.map((m: any, idx: number) => ({
      id: 'med_' + Date.now() + '_' + idx,
      name: m.name,
      dose: m.dose || '1 dose',
      morning: !!m.morning,
      afternoon: !!m.afternoon,
      night: !!m.night,
      duration: m.duration || 'As directed',
      instructions: m.instructions || '',
      sourcePaperId: 'paper_' + Date.now(),
      statusToday: 'pending',
    }));

    onAddMedicinesFromPrescription(newMeds);
  };

  // "Ask about my papers" flow
  const handleAskAboutPapers = async () => {
    if (!askQuery.trim()) return;
    setAskLoading(true);

    const papersSummary = papers
      .map(
        (p) =>
          `Title: ${p.title}\nType: ${p.documentType}\nDeadline: ${p.deadline || 'None'}\nAmount: ${
            p.amount || 'None'
          }\nContact: ${p.whoToContact || 'None'}\nSummary: ${p.plainSummary}`
      )
      .join('\n---\n');

    try {
      const ans = await ApiService.askAboutPapers(askQuery, papersSummary, profile.language);
      setAskAnswer(ans);
      speechService.speak(ans, profile.language, profile.speechRate);
    } catch (e) {
      console.error(e);
    } finally {
      setAskLoading(false);
    }
  };

  const handleStartVoiceQuery = () => {
    setIsAskingVoice(true);
    speechService.startListening(
      profile.language,
      (text) => {
        setAskQuery(text);
      },
      () => setIsAskingVoice(false),
      () => setIsAskingVoice(false)
    );
  };

  // Helper for document icon
  const getDocIcon = (type: string) => {
    switch (type) {
      case 'bank_letter':
        return <Landmark className="w-6 h-6 text-[#3B3A9E]" />;
      case 'prescription':
        return <Stethoscope className="w-6 h-6 text-[#0F8B8D]" />;
      case 'utility_bill':
        return <Zap className="w-6 h-6 text-[#E9B949]" />;
      case 'government_notice':
        return <FileSpreadsheet className="w-6 h-6 text-[#3B3A9E]" />;
      default:
        return <FileText className="w-6 h-6 text-[#0F8B8D]" />;
    }
  };

  // Filtered papers
  const filteredPapers = papers.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.plainSummary.toLowerCase().includes(q) ||
      p.documentType.toLowerCase().includes(q)
    );
  });

  return (
    <main
      id="screen-papers"
      className="pb-28 pt-2 px-3 sm:px-6 max-w-4xl mx-auto space-y-6"
    >
      {/* Top Banner with Sub-tabs (Scan & Translate vs My Papers) */}
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
            style={{ backgroundColor: '#0F8B8D', color: '#FFFFFF' }}
          >
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold font-heading tracking-tight"
              style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
            >
              {profile.language === 'hi' ? 'कागज़ात अनुवादक' : 'Help Me With a Paper'}
            </h1>
            <p
              className="text-base sm:text-lg font-medium"
              style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}
            >
              {profile.language === 'hi'
                ? 'कठिन सरकारी व बैंक पत्र को सरल हिंदी में समझें'
                : 'Turn confusing official letters into plain, calm words.'}
            </p>
          </div>
        </div>

        {/* Sub-tabs */}
        <div
          className="p-1 rounded-full border flex items-center gap-1 w-full sm:w-auto"
          style={{
            backgroundColor: isNight ? '#1C1B45' : '#F4F2FF',
            borderColor: isNight ? '#333270' : '#E4E1F5',
          }}
        >
          <button
            onClick={() => setActiveSubTab('translate')}
            className="flex-1 sm:flex-initial px-5 py-2 rounded-full font-semibold text-base transition-all cursor-pointer"
            style={{
              backgroundColor: activeSubTab === 'translate' ? '#3B3A9E' : 'transparent',
              color: activeSubTab === 'translate' ? '#FFFFFF' : isNight ? '#B0B0D8' : '#3F3F66',
            }}
          >
            {profile.language === 'hi' ? 'नया कागज़ पढ़ें' : 'Scan & Translate'}
          </button>
          <button
            onClick={() => setActiveSubTab('mypapers')}
            className="flex-1 sm:flex-initial px-5 py-2 rounded-full font-semibold text-base transition-all flex items-center justify-center gap-2 cursor-pointer"
            style={{
              backgroundColor: activeSubTab === 'mypapers' ? '#3B3A9E' : 'transparent',
              color: activeSubTab === 'mypapers' ? '#FFFFFF' : isNight ? '#B0B0D8' : '#3F3F66',
            }}
          >
            <span>{profile.language === 'hi' ? 'सहेजे कागज़ात' : 'My Papers'}</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{
                backgroundColor: activeSubTab === 'mypapers' ? '#0F8B8D' : isNight ? '#333270' : '#E4E1F5',
                color: '#FFFFFF',
              }}
            >
              {papers.length}
            </span>
          </button>
        </div>
      </div>

      {loading && <LoadingState message={loadingMessage} profile={profile} />}

      {/* SUB-TAB 1: TRANSLATE / SCAN A PAPER */}
      {!loading && activeSubTab === 'translate' && (
        <div className="space-y-6">
          {/* Upload / Input Card */}
          <section
            id="paper-input-card"
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
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2
                className="text-xl sm:text-2xl font-bold font-heading"
                style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
              >
                {profile.language === 'hi'
                  ? 'कागज़ की फोटो खींचें या पाठ लिखें:'
                  : 'Photo of the paper or paste text:'}
              </h2>

              {/* Sample buttons for testing */}
              <div className="flex gap-2">
                <button
                  onClick={handleTrySampleBankLetter}
                  className="px-3 py-1 rounded-full border text-xs sm:text-sm font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: isNight ? '#1C1B45' : '#F4F2FF',
                    color: isNight ? '#8B8AF5' : '#3B3A9E',
                    borderColor: isNight ? '#333270' : '#E4E1F5',
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" style={{ color: '#E9B949' }} />
                  <span>Sample Bank Letter</span>
                </button>
                <button
                  onClick={handleTrySamplePrescription}
                  className="px-3 py-1 rounded-full border text-xs sm:text-sm font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: isNight ? '#1C1B45' : '#EAF6F5',
                    color: '#0F8B8D',
                    borderColor: isNight ? '#333270' : '#B2E2E0',
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" style={{ color: '#E9B949' }} />
                  <span>Prescription</span>
                </button>
              </div>
            </div>

            {/* Upload Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className="min-h-[64px] rounded-2xl border-2 border-dashed flex items-center justify-center gap-3 p-4 cursor-pointer hover:border-[#3B3A9E] transition-colors"
                style={{
                  backgroundColor: isNight ? '#1C1B45' : '#F9F8FE',
                  borderColor: isNight ? '#333270' : '#D1CEF0',
                }}
              >
                <Camera className="w-6 h-6 text-[#3B3A9E]" />
                <span className="text-lg font-bold" style={{ color: isNight ? '#F2F1FF' : '#3B3A9E' }}>
                  {profile.language === 'hi' ? 'कैमरा से फोटो लें' : 'Take a photo'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              <label
                className="min-h-[64px] rounded-2xl border-2 border-dashed flex items-center justify-center gap-3 p-4 cursor-pointer hover:border-[#0F8B8D] transition-colors"
                style={{
                  backgroundColor: isNight ? '#1A3340' : '#F0F8F8',
                  borderColor: isNight ? '#225560' : '#B2E2E0',
                }}
              >
                <Upload className="w-6 h-6 text-[#0F8B8D]" />
                <span className="text-lg font-bold text-[#0F8B8D]">
                  {profile.language === 'hi' ? 'गैलरी से फाइल अपलोड' : 'Upload file / PDF image'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Image Preview */}
            {imageBase64 && (
              <div
                className="relative border-2 border-dashed p-3 rounded-2xl max-w-sm mx-auto"
                style={{ borderColor: '#0F8B8D' }}
              >
                <img
                  src={imageBase64}
                  alt="Paper upload preview"
                  className="rounded-xl max-h-60 w-full object-contain"
                  referrerPolicy="no-referrer"
                />
                <button
                  onClick={() => setImageBase64(null)}
                  className="absolute top-4 right-4 bg-black/70 text-white rounded-full p-1.5 text-xs font-bold cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Input Text Area */}
            <div>
              <label
                htmlFor="paper-input-textarea"
                className="block text-sm font-semibold mb-2"
                style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}
              >
                {profile.language === 'hi' ? 'या पत्र का पाठ यहाँ लिखें:' : 'Or paste the text of the letter:'}
              </label>
              <textarea
                id="paper-input-textarea"
                rows={5}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  profile.language === 'hi'
                    ? 'कागज़ पर लिखा पाठ यहाँ लिखें या चिपकाएं...'
                    : 'Paste the official letter, notice, bill or prescription text here...'
                }
                className="w-full p-4 rounded-2xl border text-xl font-medium focus:border-[#3B3A9E] leading-relaxed transition-colors"
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
            </div>

            {/* Big Translate Button */}
            <button
              id="btn-translate-paper"
              onClick={handleTranslatePaper}
              disabled={!inputText.trim() && !imageBase64}
              className="w-full min-h-[64px] rounded-full font-semibold text-2xl flex items-center justify-center gap-3 text-white shadow-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              style={{ backgroundColor: '#0F8B8D' }}
            >
              <FileText className="w-7 h-7" />
              <span>
                {profile.language === 'hi' ? 'सरल भाषा में समझाएं' : 'Translate into plain words'}
              </span>
            </button>
          </section>

          {/* Translated Result Card */}
          {translatedPaper && (
            <section
              id="translated-paper-result"
              className="p-6 sm:p-8 rounded-[24px] twilight-card space-y-6 transition-all"
              style={{
                backgroundColor: profile.highContrast
                  ? '#111111'
                  : isNight
                  ? '#23225A'
                  : '#FFFFFF',
                borderColor: isNight ? '#333270' : '#E4E1F5',
              }}
            >
              <div
                className="flex items-center justify-between border-b pb-4"
                style={{ borderColor: isNight ? '#333270' : '#E4E1F5' }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full text-white"
                    style={{ backgroundColor: '#0F8B8D' }}
                  >
                    {translatedPaper.document_type || 'Official Paper'}
                  </span>
                  <h3
                    className="text-2xl sm:text-3xl font-bold font-heading"
                    style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
                  >
                    {translatedPaper.title}
                  </h3>
                </div>

                <button
                  onClick={() => speechService.speak(translatedPaper.plain_summary, profile.language, profile.speechRate)}
                  className="px-4 py-2 rounded-full border font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: isNight ? '#1C1B45' : '#EAF6F5',
                    color: '#0F8B8D',
                    borderColor: '#B2E2E0',
                  }}
                >
                  <Volume2 className="w-5 h-5" />
                  <span>Read aloud</span>
                </button>
              </div>

              {/* Plain Summary */}
              <div
                className="p-5 rounded-2xl border text-xl sm:text-2xl font-medium leading-relaxed"
                style={{
                  backgroundColor: isNight ? '#1C1B45' : '#F9F8FE',
                  borderColor: isNight ? '#333270' : '#E4E1F5',
                  color: isNight ? '#F2F1FF' : '#16163A',
                }}
              >
                {translatedPaper.plain_summary}
              </div>

              {/* Action Required Banner */}
              {translatedPaper.action_required && (
                <div
                  className="p-5 rounded-2xl border flex items-start gap-4"
                  style={{
                    backgroundColor: translatedPaper.action_required.required
                      ? isNight ? '#331515' : '#FFF4F4'
                      : isNight ? '#1A3326' : '#F2FBF5',
                    borderColor: translatedPaper.action_required.required ? '#F8B4B4' : '#A3E3B6',
                    color: translatedPaper.action_required.required ? '#C62828' : '#1B7F3B',
                  }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold font-heading">
                      {translatedPaper.action_required.required
                        ? profile.language === 'hi' ? 'ज़रूरी काम (Action Required):' : 'Action Required:'
                        : profile.language === 'hi' ? 'कोई कार्रवाई ज़रूरी नहीं (No action needed)' : 'No action required'}
                    </h4>
                    <p className="text-lg font-medium mt-1">
                      {translatedPaper.action_required.what || 'This letter is for your records only.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Metadata Badges (Deadline, Amount, Contact) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {translatedPaper.deadline && (
                  <div
                    className="p-4 rounded-2xl border"
                    style={{
                      backgroundColor: isNight ? '#2E2210' : '#FFFDF5',
                      borderColor: '#F2D396',
                    }}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider text-[#A15C00]">
                      {profile.language === 'hi' ? 'अंतिम तारीख (Deadline)' : 'Deadline'}
                    </span>
                    <p className="text-xl font-bold text-[#A15C00] mt-1 flex items-center gap-1.5">
                      <Calendar className="w-5 h-5" />
                      <span>{translatedPaper.deadline}</span>
                    </p>
                  </div>
                )}

                {translatedPaper.amount && (
                  <div
                    className="p-4 rounded-2xl border"
                    style={{
                      backgroundColor: isNight ? '#1A3326' : '#F2FBF5',
                      borderColor: '#A3E3B6',
                    }}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1B7F3B]">
                      {profile.language === 'hi' ? 'राशि (Amount)' : 'Amount'}
                    </span>
                    <p className="text-xl font-bold text-[#1B7F3B] mt-1">
                      {translatedPaper.amount}
                    </p>
                  </div>
                )}

                {translatedPaper.who_to_contact && (
                  <div
                    className="p-4 rounded-2xl border"
                    style={{
                      backgroundColor: isNight ? '#1C1B45' : '#F4F2FF',
                      borderColor: isNight ? '#333270' : '#D1CEF0',
                    }}
                  >
                    <span
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: '#3B3A9E' }}
                    >
                      {profile.language === 'hi' ? 'किससे संपर्क करें' : 'Who to Contact'}
                    </span>
                    <p
                      className="text-lg font-bold mt-1"
                      style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
                    >
                      {translatedPaper.who_to_contact}
                    </p>
                  </div>
                )}
              </div>

              {/* Documents to keep ready */}
              {translatedPaper.documents_to_keep_ready && translatedPaper.documents_to_keep_ready.length > 0 && (
                <div
                  className="p-5 rounded-2xl border space-y-2"
                  style={{
                    backgroundColor: isNight ? '#1C1B45' : '#F4F2FF',
                    borderColor: isNight ? '#333270' : '#E4E1F5',
                  }}
                >
                  <h4
                    className="text-base font-bold font-heading"
                    style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
                  >
                    {profile.language === 'hi' ? 'यह कागज़ात साथ रखें:' : 'Keep these documents ready:'}
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-lg font-medium">
                    {translatedPaper.documents_to_keep_ready.map((doc: string, idx: number) => (
                      <li key={idx} style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}>{doc}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Call Script (Show me what to say on the call) */}
              {translatedPaper.call_script && translatedPaper.call_script.length > 0 && (
                <div
                  className="border rounded-2xl overflow-hidden"
                  style={{ borderColor: isNight ? '#333270' : '#E4E1F5' }}
                >
                  <button
                    onClick={() => setShowCallScript(!showCallScript)}
                    className="w-full p-4 font-bold text-lg flex items-center justify-between text-left cursor-pointer"
                    style={{
                      backgroundColor: isNight ? '#1C1B45' : '#F4F2FF',
                      color: isNight ? '#F2F1FF' : '#16163A',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <PhoneCall className="w-5 h-5 text-[#0F8B8D]" />
                      <span>
                        {profile.language === 'hi'
                          ? 'फोन पर क्या बोलें (Call Script)'
                          : 'Show me what to say on the call'}
                      </span>
                    </div>
                    {showCallScript ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                  </button>

                  {showCallScript && (
                    <div
                      className="p-4 space-y-2 text-lg font-medium leading-relaxed"
                      style={{
                        backgroundColor: isNight ? '#23225A' : '#FFFFFF',
                        color: isNight ? '#F2F1FF' : '#16163A',
                      }}
                    >
                      {translatedPaper.call_script.map((line: string, i: number) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl border"
                          style={{
                            backgroundColor: isNight ? '#1C1B45' : '#F9F8FE',
                            borderColor: isNight ? '#333270' : '#E4E1F5',
                          }}
                        >
                          {line}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Buttons: Save to My Papers & Scan Another */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  id="btn-save-to-my-papers"
                  onClick={handleSaveToMyPapers}
                  disabled={savedSuccess}
                  className="flex-1 min-h-[64px] rounded-full font-semibold text-xl flex items-center justify-center gap-3 px-6 shadow-md transition-colors cursor-pointer text-white"
                  style={{ backgroundColor: savedSuccess ? '#1B7F3B' : '#3B3A9E' }}
                >
                  {savedSuccess ? <CheckCircle className="w-6 h-6" /> : <Save className="w-6 h-6" />}
                  <span>
                    {savedSuccess
                      ? profile.language === 'hi'
                        ? 'सहेज लिया गया (Saved)'
                        : 'Saved to My Papers!'
                      : profile.language === 'hi'
                      ? 'कागज़ात में सहेजें'
                      : 'Save to My Papers'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setTranslatedPaper(null);
                    setInputText('');
                    setImageBase64(null);
                  }}
                  className="min-h-[64px] px-6 rounded-full font-semibold text-lg border-2 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: isNight ? '#23225A' : '#FFFFFF',
                    color: isNight ? '#F2F1FF' : '#3B3A9E',
                    borderColor: isNight ? '#8B8AF5' : '#3B3A9E',
                  }}
                >
                  {profile.language === 'hi' ? 'दूसरा कागज़ देखें' : 'Scan another'}
                </button>
              </div>
            </section>
          )}
        </div>
      )}

      {/* SUB-TAB 2: MY PAPERS (CARD GRID WITH DOC TYPE ICON, TITLE, DEADLINE BADGE, AND EMPTY STATE) */}
      {!loading && activeSubTab === 'mypapers' && (
        <div className="space-y-6">
          {/* Ask About My Papers Box */}
          <section
            id="ask-my-papers-box"
            className="p-6 sm:p-7 rounded-[24px] twilight-card space-y-4"
            style={{
              backgroundColor: profile.highContrast
                ? '#111111'
                : isNight
                ? '#23225A'
                : '#FFFFFF',
              borderColor: isNight ? '#333270' : '#E4E1F5',
            }}
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-[#0F8B8D]" />
              <h3
                className="text-xl sm:text-2xl font-bold font-heading"
                style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
              >
                {profile.language === 'hi' ? 'कागज़ात के बारे में पूछें' : 'Ask about your papers'}
              </h3>
            </div>
            <p
              className="text-base font-medium"
              style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}
            >
              {profile.language === 'hi'
                ? 'बोलकर या लिखकर पूछें, उदा: "मेरी बिजली बिल की अंतिम तारीख क्या है?"'
                : 'Ask in voice or text, e.g., "When is my electricity bill due?" or "What did the bank letter say?"'}
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={askQuery}
                onChange={(e) => setAskQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskAboutPapers()}
                placeholder={
                  profile.language === 'hi'
                    ? 'यहाँ अपना सवाल लिखें...'
                    : 'Ask any question about your saved papers...'
                }
                className="flex-1 min-h-[58px] px-5 rounded-full border text-lg font-medium transition-colors"
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
              <button
                onClick={handleStartVoiceQuery}
                className="w-14 min-h-[58px] rounded-full border flex items-center justify-center transition-colors cursor-pointer"
                style={{
                  backgroundColor: isAskingVoice ? '#0F8B8D' : isNight ? '#1C1B45' : '#EAF6F5',
                  color: isAskingVoice ? '#FFFFFF' : '#0F8B8D',
                  borderColor: '#0F8B8D',
                }}
                title="Ask by voice"
              >
                <Mic className="w-6 h-6" />
              </button>
              <button
                onClick={handleAskAboutPapers}
                disabled={!askQuery.trim() || askLoading}
                className="min-h-[58px] px-6 rounded-full font-semibold text-lg text-white shadow-sm disabled:opacity-40 cursor-pointer"
                style={{ backgroundColor: '#3B3A9E' }}
              >
                {askLoading ? 'Searching...' : 'Ask'}
              </button>
            </div>

            {/* Answer Display */}
            {askAnswer && (
              <div
                className="p-5 rounded-2xl border space-y-2"
                style={{
                  backgroundColor: isNight ? '#1C1B45' : '#F4F2FF',
                  borderColor: isNight ? '#333270' : '#D1CEF0',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base" style={{ color: '#3B3A9E' }}>
                    Sandhya says:
                  </span>
                  <button
                    onClick={() => speechService.speak(askAnswer, profile.language, profile.speechRate)}
                    className="text-sm font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                    style={{ color: '#0F8B8D' }}
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Read answer</span>
                  </button>
                </div>
                <p
                  className="text-xl font-medium leading-relaxed"
                  style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
                >
                  {askAnswer}
                </p>
              </div>
            )}
          </section>

          {/* Search Filter for Saved Papers */}
          <div className="flex items-center gap-2 px-1">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={profile.language === 'hi' ? 'सहेजे कागज़ात खोजें...' : 'Search your saved papers...'}
                className="w-full pl-12 pr-4 min-h-[52px] rounded-full border text-base font-medium transition-colors"
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
            </div>
          </div>

          {/* Card Grid of Saved Papers or Friendly Empty State */}
          {filteredPapers.length === 0 ? (
            /* Friendly Empty State with SVG Illustration and One Clear Button */
            <div
              className="p-10 text-center rounded-[24px] twilight-card space-y-5 flex flex-col items-center justify-center"
              style={{
                backgroundColor: profile.highContrast
                  ? '#111111'
                  : isNight
                  ? '#23225A'
                  : '#FFFFFF',
                borderColor: isNight ? '#333270' : '#E4E1F5',
              }}
            >
              {/* Simple Friendly SVG Illustration */}
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center bg-[#F4F2FF] text-[#3B3A9E]">
                <svg viewBox="0 0 80 80" fill="none" className="w-16 h-16">
                  <rect x="16" y="12" width="48" height="56" rx="8" fill="#E4E1F5" />
                  <rect x="24" y="22" width="32" height="4" rx="2" fill="#3B3A9E" />
                  <rect x="24" y="32" width="24" height="4" rx="2" fill="#3B3A9E" fillOpacity="0.6" />
                  <rect x="24" y="42" width="28" height="4" rx="2" fill="#3B3A9E" fillOpacity="0.4" />
                  <circle cx="52" cy="50" r="10" fill="#0F8B8D" />
                  <path d="M49 50L51 52L55 48" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="space-y-1">
                <h4
                  className="text-2xl font-bold font-heading"
                  style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
                >
                  {profile.language === 'hi' ? 'कोई कागज़ात नहीं मिले' : 'No saved papers yet'}
                </h4>
                <p
                  className="text-base font-medium max-w-md"
                  style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}
                >
                  {profile.language === 'hi'
                    ? 'आप बैंक पत्र, बिजली बिल या डॉक्टर का पर्चा स्कैन कर सकते हैं।'
                    : 'Scan your official letters, electricity bills, or prescriptions to keep them organized and easy to understand.'}
                </p>
              </div>

              {/* One Clear Button */}
              <button
                onClick={() => setActiveSubTab('translate')}
                className="min-h-[56px] px-8 rounded-full font-semibold text-lg text-white shadow-sm transition-colors cursor-pointer"
                style={{ backgroundColor: '#0F8B8D' }}
              >
                {profile.language === 'hi' ? 'नया कागज़ स्कैन करें' : 'Scan a new paper'}
              </button>
            </div>
          ) : (
            /* Card Grid with Document Type Icon, Title, Deadline Badge (turns red when due <= 3 days), and Soft Thumbnail */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPapers.map((paper) => {
                // Calculate if deadline is due within 3 days
                let isDueSoon = false;
                let daysLeft: number | null = null;
                if (paper.deadline) {
                  const deadlineDate = new Date(paper.deadline).getTime();
                  const diffTime = deadlineDate - Date.now();
                  daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  if (daysLeft >= 0 && daysLeft <= 3) {
                    isDueSoon = true;
                  }
                }

                return (
                  <div
                    key={paper.id}
                    className="p-6 rounded-[24px] twilight-card space-y-4 flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-md"
                    style={{
                      backgroundColor: profile.highContrast
                        ? '#111111'
                        : isNight
                        ? '#23225A'
                        : '#FFFFFF',
                      borderColor: isNight ? '#333270' : '#E4E1F5',
                    }}
                  >
                    <div>
                      {/* Top Bar: Icon + Type + Deadline Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: isNight ? '#1C1B45' : '#F4F2FF' }}
                          >
                            {getDocIcon(paper.documentType)}
                          </div>
                          <div>
                            <span
                              className="text-xs font-bold uppercase tracking-wider block"
                              style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}
                            >
                              {paper.documentType.replace('_', ' ')}
                            </span>
                            <h4
                              className="text-xl font-bold font-heading line-clamp-1"
                              style={{ color: isNight ? '#F2F1FF' : '#16163A' }}
                            >
                              {paper.title}
                            </h4>
                          </div>
                        </div>

                        {/* Deadline Badge: Turns red when due within 3 days */}
                        {paper.deadline && (
                          <span
                            className="text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shrink-0 border"
                            style={{
                              backgroundColor: isDueSoon
                                ? isNight ? '#331515' : '#FFF4F4'
                                : isNight ? '#2E2210' : '#FFFDF5',
                              color: isDueSoon ? '#C62828' : '#A15C00',
                              borderColor: isDueSoon ? '#F8B4B4' : '#F2D396',
                            }}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {isDueSoon
                                ? `Due in ${daysLeft}d`
                                : paper.deadline}
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Soft Thumbnail Preview */}
                      {paper.imageUrl ? (
                        <div className="mt-3 rounded-xl overflow-hidden h-28 w-full border border-[#E4E1F5] bg-gray-50">
                          <img
                            src={paper.imageUrl}
                            alt={paper.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div
                          className="mt-3 p-3 rounded-xl border text-xs font-mono line-clamp-2"
                          style={{
                            backgroundColor: isNight ? '#1C1B45' : '#F9F8FE',
                            borderColor: isNight ? '#333270' : '#E4E1F5',
                            color: isNight ? '#B0B0D8' : '#3F3F66',
                          }}
                        >
                          {paper.rawText ? paper.rawText.slice(0, 120) + '...' : paper.plainSummary.slice(0, 120)}
                        </div>
                      )}

                      {/* Summary */}
                      <p
                        className="text-base font-medium mt-3 line-clamp-2 leading-relaxed"
                        style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}
                      >
                        {paper.plainSummary}
                      </p>
                    </div>

                    {/* Bottom Metadata & Voice Action */}
                    <div
                      className="flex items-center justify-between pt-3 border-t text-sm font-semibold"
                      style={{ borderColor: isNight ? '#333270' : '#E4E1F5' }}
                    >
                      <span style={{ color: isNight ? '#B0B0D8' : '#3F3F66' }}>
                        {paper.amount ? `Amount: ${paper.amount}` : `Added ${paper.dateScanned}`}
                      </span>

                      <button
                        onClick={() => speechService.speak(paper.plainSummary, profile.language, profile.speechRate)}
                        className="p-2 rounded-full border transition-colors cursor-pointer"
                        style={{
                          backgroundColor: isNight ? '#1C1B45' : '#EAF6F5',
                          color: '#0F8B8D',
                          borderColor: '#B2E2E0',
                        }}
                        title="Read aloud"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Prescription Add Medicines Confirmation Modal */}
      <ConfirmationModal
        isOpen={showPrescriptionModal}
        title={
          profile.language === 'hi'
            ? 'पर्चे से दवाइयाँ जोड़ें?'
            : 'Add Medicines from Prescription?'
        }
        message={
          profile.language === 'hi'
            ? 'Sandhya ने पर्चे में दवाइयों की पहचान की है। कृपया शुरू करने से पहले अपने डॉक्टर या फार्मासिस्ट से पुष्टि अवश्य करें।'
            : 'Sandhya extracted medicines from this prescription. Please always confirm this with your doctor or pharmacist.'
        }
        confirmLabel={profile.language === 'hi' ? 'हाँ, सूची में जोड़ें' : 'Yes, add to Medicines'}
        cancelLabel={profile.language === 'hi' ? 'नहीं' : 'Cancel'}
        onConfirm={handleConfirmPrescriptionMeds}
        onCancel={() => setShowPrescriptionModal(false)}
        language={profile.language}
        highContrast={profile.highContrast}
      />
    </main>
  );
};
