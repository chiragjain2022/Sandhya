import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { PROMPTS, GEMINI_CONFIG } from "./src/config/prompts";

dotenv.config();

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Fallback scam evaluation if AI key is missing or offline
function fallbackScamCheck(inputContent: string, language: string) {
  const lower = inputContent.toLowerCase();
  const highRiskKeywords = [
    "otp",
    "pin",
    "password",
    "kyc",
    "blocked",
    "lottery",
    "prize",
    "won",
    "urgent",
    "click link",
    "bit.ly",
    "remote access",
    "anydesk",
    "teamviewer",
    "gift card",
    "refund",
    "electricity power cut",
    "sim blocked",
    "pan card link",
    "aadhaar link",
    "apk",
  ];

  const matched = highRiskKeywords.filter((k) => lower.includes(k));

  if (matched.length >= 2 || lower.includes("otp") || lower.includes("kyc") || lower.includes("blocked")) {
    if (language === "hi") {
      return {
        verdict: "STOP",
        headline: "रुकिए! यह संदेश धोखाधड़ी (Scam) हो सकता है",
        reason: "इस संदेश में तुरंत कार्रवाई करने या खाता ब्लॉक करने की धमकी दी गई है। बैंक कभी भी ऐसे लिंक पर क्लिक करने या OTP देने को नहीं कहते।",
        red_flags: [
          `संदेहास्पद शब्द मिले: ${matched.slice(0, 3).join(", ")}`,
          "खाता बंद होने का झूठा डर दिखाया गया है",
          "अनजान लिंक पर क्लिक करने को कहा गया है",
        ],
        what_to_do_now: [
          "इस संदेश को तुरंत डिलीट कर दें",
          "किसी भी लिंक पर क्लिक न करें और न ही उस नंबर पर फोन करें",
          "निश्चिंत रहें, आपका बैंक खाता बिल्कुल सुरक्षित है",
        ],
        never_do: ["किसी के साथ भी अपना OTP, PIN या पासवर्ड कभी साझा न करें"],
        isFallback: true,
      };
    } else if (language === "hinglish") {
      return {
        verdict: "STOP",
        headline: "Rukiye! Yeh message Scam ya Fraud ho sakta hai",
        reason: "Is message me account block karne ya urgent action lene ki dhamki hai. Bank kabhi SMS ya WhatsApp link se KYC update nahi karwata.",
        red_flags: [
          `Suspicious words mile: ${matched.slice(0, 3).join(", ")}`,
          "Account block hone ka jhootha dar",
          "Anjaan link par click karne ka dabav",
        ],
        what_to_do_now: [
          "Is message ko turant delete kar dein",
          "Kisi link par click na karein na call karein",
          "Aapka account bilkul safe hai, chinta na karein",
        ],
        never_do: ["Apna OTP, UPI PIN ya password kisi ko na dein"],
        isFallback: true,
      };
    } else {
      return {
        verdict: "STOP",
        headline: "STOP! This message looks like a scam",
        reason: "This message creates false urgency by threatening account suspension or demanding immediate action. Banks never ask for sensitive updates via random links.",
        red_flags: [
          `Detected risky terms: ${matched.slice(0, 3).join(", ")}`,
          "Urgent threat of service blockage",
          "Unverified link or phone number",
        ],
        what_to_do_now: [
          "Delete this message right now",
          "Do not click any link or call the number",
          "Your bank account is safe; please stay relaxed",
        ],
        never_do: ["Never share your OTP, PIN, or password with anyone"],
        isFallback: true,
      };
    }
  }

  // Cautious
  return {
    verdict: "BE_CAREFUL",
    headline: language === "hi" ? "सावधानी बरतें: पुष्टि किए बिना आगे न बढ़ें" : "Be careful: Verify before taking any step",
    reason: language === "hi"
      ? "यह संदेश असामान्य लग रहा है। किसी भी भुगतान या जानकारी साझा करने से पहले परिवार या बैंक शाखा से पूछें।"
      : "This message contains unusual requests. Please check with your family or official bank branch before doing anything.",
    red_flags: ["अनजानी सूचना या ऑफ़र", "स्रोत सत्यापित नहीं है"],
    what_to_do_now: [
      "कोई जल्दबाज़ी न करें",
      "अपने किसी परिवार के सदस्य या विश्वसनीय व्यक्ति को दिखाएं",
    ],
    never_do: ["अपरिचित व्यक्ति को फोन पर OTP या कार्ड नंबर न दें"],
    isFallback: true,
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));

  // API 1: Generate clarifying questions for scam check
  app.post("/api/check/questions", async (req, res) => {
    try {
      const { inputContent, language = "en" } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        // Fallback default questions
        const fallbackQs =
          language === "hi"
            ? [
                { id: "q1", question: "क्या यह संदेश किसी अज्ञात नंबर से आया है?", options: ["हाँ", "नहीं", "पक्का नहीं"] },
                { id: "q2", question: "क्या इसमें OTP, पासवर्ड या पैसे मांगे गए हैं?", options: ["हाँ", "नहीं", "पक्का नहीं"] },
                { id: "q3", question: "क्या वे आपको तुरंत करने के लिए डरा रहे हैं?", options: ["हाँ", "नहीं", "पक्का नहीं"] },
              ]
            : language === "hinglish"
            ? [
                { id: "q1", question: "Kya yeh message kisi anjaan number se aaya hai?", options: ["Haan", "Nahi", "Sure nahi"] },
                { id: "q2", question: "Kya aapse OTP, PIN ya paise maange ja rahe hain?", options: ["Haan", "Nahi", "Sure nahi"] },
                { id: "q3", question: "Kya wo turant karne ke liye rush ya darra rahe hain?", options: ["Haan", "Nahi", "Sure nahi"] },
              ]
            : [
                { id: "q1", question: "Did this message come from an unknown number or email?", options: ["Yes", "No", "Not sure"] },
                { id: "q2", question: "Did they ask for an OTP, password, or payment?", options: ["Yes", "No", "Not sure"] },
                { id: "q3", question: "Are they rushing you or threatening that your service will stop?", options: ["Yes", "No", "Not sure"] },
              ];
        return res.json({ questions: fallbackQs });
      }

      const prompt = PROMPTS.scamClarificationQuestions(inputContent, language);
      const response = await ai.models.generateContent({
        model: GEMINI_CONFIG.model,
        contents: prompt,
        config: {
          systemInstruction: PROMPTS.systemPersona,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ["id", "question", "options"],
            },
          },
        },
      });

      const text = response.text || "[]";
      const parsed = JSON.parse(text);
      return res.json({ questions: Array.isArray(parsed) && parsed.length > 0 ? parsed.slice(0, 3) : [] });
    } catch (err) {
      console.error("Error generating clarification questions:", err);
      // Return safe standard questions
      res.json({
        questions: [
          { id: "q1", question: "Did they ask you to click a link or send money?", options: ["Yes", "No", "Not sure"] },
          { id: "q2", question: "Did they mention OTP, KYC update, or account blocked?", options: ["Yes", "No", "Not sure"] },
          { id: "q3", question: "Did you initiate this transaction yourself?", options: ["Yes", "No", "Not sure"] },
        ],
      });
    }
  });

  // API 2: Scam Verdict
  app.post("/api/check/verdict", async (req, res) => {
    const { inputContent, answers = [], language = "en" } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      const fallback = fallbackScamCheck(inputContent, language);
      return res.json({ verdict: fallback });
    }

    try {
      const prompt = PROMPTS.scamVerdict(inputContent, answers, language);
      const response = await ai.models.generateContent({
        model: GEMINI_CONFIG.model,
        contents: prompt,
        config: {
          systemInstruction: PROMPTS.systemPersona,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              verdict: { type: Type.STRING, enum: ["STOP", "BE_CAREFUL", "SAFE"] },
              headline: { type: Type.STRING },
              reason: { type: Type.STRING },
              red_flags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              what_to_do_now: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              never_do: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ["verdict", "headline", "reason", "red_flags", "what_to_do_now", "never_do"],
          },
        },
      });

      const text = response.text || "{}";
      const parsed = JSON.parse(text);
      return res.json({ verdict: parsed });
    } catch (err) {
      console.error("Gemini scam verdict error, using local heuristic fallback:", err);
      const fallback = fallbackScamCheck(inputContent, language);
      return res.json({ verdict: fallback });
    }
  });

  // API 3: Paperwork translator & prescription extractor
  app.post("/api/paper/translate", async (req, res) => {
    try {
      const { imageBase64, mimeType = "image/jpeg", textContent = "", language = "en" } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        // Fallback for sample bank letter or text
        return res.json({
          paper: {
            document_type: "bank_letter",
            title: "State Bank of India - Annual KYC Verification Notice",
            plain_summary:
              language === "hi"
                ? "यह भारतीय स्टेट बैंक का आधिकारिक पत्र है। इसमें आपको अपनी नज़दीकी शाखा में जाकर KYC अपडेट कराने का अनुरोध किया गया है।"
                : "This is a letter from State Bank of India requesting you to visit your nearest branch to refresh your account KYC records.",
            action_required: {
              required: true,
              what:
                language === "hi"
                  ? "शाखा में जाकर पहचान पत्र (Aadhaar / Voter ID) की प्रति जमा करें।"
                  : "Visit your local branch with a photo ID proof copy.",
            },
            deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            amount: null,
            who_to_contact: "SBI Customer Care 1800 1234 / Local Branch Manager",
            documents_to_keep_ready: ["Bank Passbook", "Aadhaar Card Copy", "Two Passport Photos"],
            call_script: [
              "Namaste, my name is Kamla. I received a KYC update letter.",
              "Can I visit tomorrow morning to submit the photocopies?",
              "Is there any form I need to fill before coming?",
            ],
            warning_if_suspicious: null,
            extracted_medicines: [],
          },
        });
      }

      const prompt = PROMPTS.paperworkTranslator(language, textContent);
      const contentsParts: any[] = [];

      if (imageBase64) {
        contentsParts.push({
          inlineData: {
            mimeType,
            data: imageBase64,
          },
        });
      }

      contentsParts.push({
        text: prompt,
      });

      const response = await ai.models.generateContent({
        model: GEMINI_CONFIG.model,
        contents: { parts: contentsParts },
        config: {
          systemInstruction: PROMPTS.systemPersona,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              document_type: {
                type: Type.STRING,
                enum: [
                  "bank_letter",
                  "insurance",
                  "pension",
                  "electricity_bill",
                  "gov_form",
                  "medical_report",
                  "prescription",
                  "other",
                ],
              },
              title: { type: Type.STRING },
              plain_summary: { type: Type.STRING },
              action_required: {
                type: Type.OBJECT,
                properties: {
                  required: { type: Type.BOOLEAN },
                  what: { type: Type.STRING },
                },
                required: ["required", "what"],
              },
              deadline: { type: Type.STRING, nullable: true },
              amount: { type: Type.STRING, nullable: true },
              who_to_contact: { type: Type.STRING, nullable: true },
              documents_to_keep_ready: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              call_script: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              warning_if_suspicious: { type: Type.STRING, nullable: true },
              extracted_medicines: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    dose: { type: Type.STRING },
                    morning: { type: Type.BOOLEAN },
                    afternoon: { type: Type.BOOLEAN },
                    night: { type: Type.BOOLEAN },
                    duration: { type: Type.STRING },
                    instructions: { type: Type.STRING },
                  },
                  required: ["name", "dose", "morning", "afternoon", "night", "duration"],
                },
              },
            },
            required: [
              "document_type",
              "title",
              "plain_summary",
              "action_required",
              "documents_to_keep_ready",
              "call_script",
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({ paper: parsed });
    } catch (err: any) {
      console.error("Paper translation error:", err);
      res.status(500).json({ error: "Could not process document. Please try again." });
    }
  });

  // API 4: Ask about saved papers
  app.post("/api/paper/ask", async (req, res) => {
    try {
      const { userQuery, papersSummary, language = "en" } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          answer:
            language === "hi"
              ? "आपके सहेजे गए दस्तावेज़ों के अनुसार, आपके पास SBI KYC पत्र है जिसकी अंतिम तिथि अगले 5 दिनों में है।"
              : "According to your saved papers, you have an SBI KYC renewal due in the next 5 days.",
        });
      }

      const prompt = PROMPTS.askPapers(userQuery, papersSummary, language);
      const response = await ai.models.generateContent({
        model: GEMINI_CONFIG.model,
        contents: prompt,
        config: {
          systemInstruction: PROMPTS.systemPersona,
        },
      });

      return res.json({ answer: response.text || "No details found." });
    } catch (err) {
      console.error("Ask paper error:", err);
      res.json({ answer: "I checked your papers, but couldn't find an exact answer. Please open My Papers to view details." });
    }
  });

  // API 5: Simplify screen text
  app.post("/api/simplify", async (req, res) => {
    try {
      const { text, language = "en" } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          simplified:
            language === "hi"
              ? "सरल शब्दों में: यह एक सुरक्षित और शांत स्क्रीन है। आप जो विकल्प चाहें बड़े बटन दबाकर चुन सकते हैं।"
              : "In simple words: Take your time. You can tap any of the large buttons below to continue safely.",
        });
      }

      const prompt = PROMPTS.simplifyText(text, language);
      const response = await ai.models.generateContent({
        model: GEMINI_CONFIG.model,
        contents: prompt,
        config: {
          systemInstruction: PROMPTS.systemPersona,
        },
      });

      return res.json({ simplified: response.text });
    } catch (err) {
      console.error("Simplify error:", err);
      res.json({ simplified: "Everything is safe. Please take your time and tap the button you need." });
    }
  });

  // API 6: Companion chat
  app.post("/api/chat", async (req, res) => {
    const language = req.body?.language || "en";
    try {
      const { message, history = [] } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        const fallbackReplies: Record<string, string> = {
          en: "Namaste ji! I am right here with you. How are you feeling today? Did you have your warm tea?",
          hi: "नमस्ते जी! मैं हमेशा आपके साथ हूँ। आज आपकी तबीयत कैसी है? क्या आपने सुबह की चाय पी ली?",
          hinglish: "Namaste ji! Main hamesha aapke saath hoon. Aaj aapki tabiyat kaisi hai? Chai pee li aapne?",
        };
        return res.json({ reply: fallbackReplies[language] || fallbackReplies.en });
      }

      const prompt = PROMPTS.companionChat(message, history, language);
      const response = await ai.models.generateContent({
        model: GEMINI_CONFIG.model,
        contents: prompt,
        config: {
          systemInstruction: PROMPTS.systemPersona,
        },
      });

      return res.json({ reply: response.text });
    } catch (err) {
      console.error("Chat error:", err);
      res.json({
        reply: language === "hi" ? "नमस्ते जी, मैं आपकी बात सुन रही हूँ। कृपया दोबारा बताएं।" : "Namaste ji, I am listening. Please take your time and tell me again.",
      });
    }
  });

  // API 7: "Show me how" step-by-step
  app.post("/api/how-to", async (req, res) => {
    try {
      const { task, language = "en" } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          taskTitle: task,
          steps: [
            {
              stepNumber: 1,
              instruction:
                language === "hi"
                  ? "अपने फोन की होम स्क्रीन पर जाएं और ऐप (Google Pay या PhonePe) को ढूंढकर उस पर टैप करें।"
                  : "Go to your phone home screen and gently tap on your payment app icon.",
              tip: "The icon looks like a colorful G or purple icon.",
            },
            {
              stepNumber: 2,
              instruction:
                language === "hi"
                  ? "स्क्रीन पर 'Pay Bills' या 'Electricity' लिखा हुआ बटन देखें और उस पर दबाएं।"
                  : "Look for 'Electricity' or 'Pay Bills' on the screen and tap it.",
              tip: "It often has a small lightbulb or lightning bolt picture.",
            },
            {
              stepNumber: 3,
              instruction:
                language === "hi"
                  ? "अपनी बिजली कंपनी का नाम चुनें और अपने बिल पर लिखा हुआ उपभोक्ता नंबर (Consumer Number) टाइप करें।"
                  : "Choose your electricity board and enter your consumer number from your paper bill.",
              tip: "Consumer number is usually printed at the top of your paper bill.",
            },
            {
              stepNumber: 4,
              instruction:
                language === "hi"
                  ? "बिल की राशि जांचें और अपने बैंक खाते से सुरक्षित भुगतान करने के लिए अपना गोपनीय UPI पिन दर्ज करें।"
                  : "Check the bill amount and enter your UPI PIN to finish the payment safely.",
              tip: "Never tell your UPI PIN to anyone on phone.",
            },
          ],
        });
      }

      const prompt = PROMPTS.showMeHow(task, language);
      const response = await ai.models.generateContent({
        model: GEMINI_CONFIG.model,
        contents: prompt,
        config: {
          systemInstruction: PROMPTS.systemPersona,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              taskTitle: { type: Type.STRING },
              steps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    stepNumber: { type: Type.INTEGER },
                    instruction: { type: Type.STRING },
                    tip: { type: Type.STRING },
                  },
                  required: ["stepNumber", "instruction"],
                },
              },
            },
            required: ["taskTitle", "steps"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json(parsed);
    } catch (err) {
      console.error("How-to error:", err);
      res.status(500).json({ error: "Could not generate steps." });
    }
  });

  // API 8: "I'm stuck" step assistance
  app.post("/api/how-to/stuck", async (req, res) => {
    try {
      const { taskTitle, currentStep, userObservation, language = "en" } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          guidance:
            language === "hi"
              ? "कोई चिंता की बात नहीं है। आप स्क्रीन के नीचे दिए गए बैक (वापस) बटन को धीरे से दबाएं। आप सुरक्षित हैं।"
              : "No need to worry at all. You can gently press the back button at the bottom. Nothing is lost.",
        });
      }

      const prompt = PROMPTS.imStuckHelp(taskTitle, currentStep, userObservation, language);
      const response = await ai.models.generateContent({
        model: GEMINI_CONFIG.model,
        contents: prompt,
        config: {
          systemInstruction: PROMPTS.systemPersona,
        },
      });

      return res.json({ guidance: response.text });
    } catch (err) {
      console.error("Stuck guidance error:", err);
      res.json({ guidance: "Please take a deep breath. You can tap 'Go back' and we can try together again slowly." });
    }
  });

  // API 9: Weekly family summary
  app.post("/api/family/weekly-summary", async (req, res) => {
    try {
      const {
        userName = "Kamla",
        activityCount = 0,
        scamsChecked = 0,
        medicinesTakenCount = 0,
        moods = [],
        deadlinesUpcoming = [],
        language = "en",
      } = req.body;

      const ai = getGeminiClient();
      if (!ai) {
        const defaultMsg =
          language === "hi"
            ? `नमस्ते! यह ${userName} जी का इस हफ्ते का Sandhya साथी सारांश है:\n- इस हफ्ते दवाइयाँ समय पर ली गईं: ${medicinesTakenCount}\n- संदिग्ध संदेशों की जाँच: ${scamsChecked} (सभी सुरक्षित)\n- आने वाले महत्वपूर्ण काम: ${deadlinesUpcoming.join(", ") || "कोई लंबित बिल नहीं"}\n- मूड: सामान्य और शांत।\nसब कुछ ठीक चल रहा है!`
            : `Namaste! Here is a short weekly update for ${userName} ji from Sandhya:\n- Medicine doses taken on time: ${medicinesTakenCount}\n- Safety checks performed: ${scamsChecked} (handled safely)\n- Upcoming paperwork deadlines: ${deadlinesUpcoming.join(", ") || "All clear"}\n- Mood: Peaceful and comfortable.\nAll is well at home!`;
        return res.json({ summaryText: defaultMsg });
      }

      const prompt = PROMPTS.weeklyFamilySummary(
        userName,
        activityCount,
        scamsChecked,
        medicinesTakenCount,
        moods,
        deadlinesUpcoming,
        language
      );

      const response = await ai.models.generateContent({
        model: GEMINI_CONFIG.model,
        contents: prompt,
        config: {
          systemInstruction: PROMPTS.systemPersona,
        },
      });

      return res.json({ summaryText: response.text });
    } catch (err) {
      console.error("Family summary error:", err);
      res.json({
        summaryText: `Namaste! Weekly update for family: Sandhya has been monitoring medicines and official papers. Everything is calm and safe.`,
      });
    }
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sandhya server running on http://localhost:${PORT}`);
  });
}

startServer();
