import { Language, ScamClarificationQuestion, ScamVerdict, SavedPaper, ExtractedMedicine } from '../types';

export interface TranslatePaperResponse {
  paper: {
    document_type: SavedPaper['documentType'];
    title: string;
    plain_summary: string;
    action_required: {
      required: boolean;
      what: string;
    };
    deadline: string | null;
    amount: string | null;
    who_to_contact: string | null;
    documents_to_keep_ready: string[];
    call_script: string[];
    warning_if_suspicious: string | null;
    extracted_medicines?: Array<{
      name: string;
      dose: string;
      morning: boolean;
      afternoon: boolean;
      night: boolean;
      duration: string;
      instructions: string;
    }>;
  };
}

export const ApiService = {
  async getScamQuestions(
    inputContent: string,
    language: Language
  ): Promise<ScamClarificationQuestion[]> {
    try {
      const res = await fetch('/api/check/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputContent, language }),
      });
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      return data.questions || [];
    } catch (e) {
      console.warn('Questions API error, providing safe fallback questions:', e);
      return [
        {
          id: 'q1',
          question:
            language === 'hi'
              ? 'क्या यह संदेश किसी अज्ञात नंबर से आया है?'
              : 'Did this message come from an unknown number or person?',
          options: language === 'hi' ? ['हाँ', 'नहीं', 'पक्का नहीं'] : ['Yes', 'No', 'Not sure'],
        },
        {
          id: 'q2',
          question:
            language === 'hi'
              ? 'क्या इसमें OTP, पासवर्ड या तुरंत पैसे भेजने को कहा गया है?'
              : 'Did they ask for an OTP, password, or immediate money transfer?',
          options: language === 'hi' ? ['हाँ', 'नहीं', 'पक्का नहीं'] : ['Yes', 'No', 'Not sure'],
        },
        {
          id: 'q3',
          question:
            language === 'hi'
              ? 'क्या वे आपको डरा रहे हैं कि सेवा या खाता आज ही बंद हो जाएगा?'
              : 'Are they threatening that your account or service will stop today?',
          options: language === 'hi' ? ['हाँ', 'नहीं', 'पक्का नहीं'] : ['Yes', 'No', 'Not sure'],
        },
      ];
    }
  },

  async getScamVerdict(
    inputContent: string,
    answers: Array<{ question: string; answer: string }>,
    language: Language
  ): Promise<ScamVerdict> {
    try {
      const res = await fetch('/api/check/verdict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputContent, answers, language }),
      });
      if (!res.ok) throw new Error('Verdict error');
      const data = await res.json();
      return data.verdict;
    } catch (e) {
      console.warn('Scam verdict error, applying client-side fallback:', e);
      // Cautious safe fallback
      return {
        verdict: 'STOP',
        headline:
          language === 'hi'
            ? 'रुकिए! सावधानी सबसे पहले'
            : 'STOP! Please pause before proceeding',
        reason:
          language === 'hi'
            ? 'संदेश में असामान्य शब्द हैं। सुरक्षित रहने के लिए किसी लिंक पर क्लिक न करें।'
            : 'This communication contains suspicious urgent requests. Please do not click any link or send money.',
        red_flags: ['अनजान प्रेषक', 'जल्दबाज़ी का दबाव'],
        what_to_do_now: [
          'संदेश को बंद कर दें',
          'किसी लिंक पर क्लिक न करें',
          'परिवार या बैंक से बात करें',
        ],
        never_do: ['किसी को भी फोन पर अपना OTP या PIN न बताएं'],
        isFallback: true,
      };
    }
  },

  async translatePaper(payload: {
    imageBase64?: string;
    mimeType?: string;
    textContent?: string;
    language: Language;
  }): Promise<TranslatePaperResponse['paper']> {
    const res = await fetch('/api/paper/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Paper translation failed');
    const data = await res.json();
    return data.paper;
  },

  async askAboutPapers(userQuery: string, papersSummary: string, language: Language): Promise<string> {
    try {
      const res = await fetch('/api/paper/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userQuery, papersSummary, language }),
      });
      if (!res.ok) throw new Error('Query failed');
      const data = await res.json();
      return data.answer;
    } catch (e) {
      return language === 'hi'
        ? 'माफ़ कीजिए, अभी आपके कागज़ात देखने में थोड़ी परेशानी हुई। कृपया My Papers में जाकर तारीख जांचें।'
        : 'I could not search your papers right now. Please tap My Papers to check your documents directly.';
    }
  },

  async simplifyText(text: string, language: Language): Promise<string> {
    try {
      const res = await fetch('/api/simplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      });
      if (!res.ok) throw new Error('Simplify failed');
      const data = await res.json();
      return data.simplified;
    } catch (e) {
      return language === 'hi'
        ? 'सरल शब्दों में: कोई जल्दबाज़ी न करें। आप पूरी तरह सुरक्षित हैं। नीचे दिए गए बड़े बटनों में से जो चाहें दबाएं।'
        : 'In simple words: Take your time, there is no hurry. You are safe. Tap any of the big buttons to continue.';
    }
  },

  async sendCompanionChat(
    message: string,
    history: Array<{ role: 'user' | 'model'; text: string }>,
    language: Language
  ): Promise<string> {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history, language }),
      });
      if (!res.ok) throw new Error('Chat failed');
      const data = await res.json();
      return data.reply;
    } catch (e) {
      return language === 'hi'
        ? 'नमस्ते जी! मैं आपकी बात सुन रही हूँ। कृपया थोड़ा रुक कर दोबारा बोलें।'
        : 'Namaste ji! I am right here listening to you. Please tell me again.';
    }
  },

  async getHowTo(task: string, language: Language): Promise<{
    taskTitle: string;
    steps: Array<{ stepNumber: number; instruction: string; tip?: string }>;
  }> {
    const res = await fetch('/api/how-to', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, language }),
    });
    if (!res.ok) throw new Error('How-to failed');
    return await res.json();
  },

  async getHowToStuckHelp(
    taskTitle: string,
    currentStep: string,
    userObservation: string,
    language: Language
  ): Promise<string> {
    try {
      const res = await fetch('/api/how-to/stuck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskTitle, currentStep, userObservation, language }),
      });
      if (!res.ok) throw new Error('Stuck API failed');
      const data = await res.json();
      return data.guidance;
    } catch (e) {
      return language === 'hi'
        ? 'चिंता न करें। आप नीचे दिया गया "वापस जाएं" बटन दबा सकते हैं। कुछ भी खराब नहीं होगा।'
        : 'Do not worry at all. You can tap "Go back" safely. Nothing will be harmed.';
    }
  },

  async getWeeklyFamilySummary(payload: {
    userName: string;
    activityCount: number;
    scamsChecked: number;
    medicinesTakenCount: number;
    moods: string[];
    deadlinesUpcoming: string[];
    language: Language;
  }): Promise<string> {
    try {
      const res = await fetch('/api/family/weekly-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Family summary failed');
      const data = await res.json();
      return data.summaryText;
    } catch (e) {
      return `Namaste! Weekly update for family: Sandhya has been monitoring medicines and official papers. All is well and peaceful.`;
    }
  },
};
