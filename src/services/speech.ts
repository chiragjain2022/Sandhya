import { Language } from '../types';

// Speech synthesis and recognition service tailored for seniors
class SpeechService {
  private isSpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private recognitionInstance: any = null;

  // Gentle audio chime using Web Audio API for reassuring sound feedback
  public playChime(type: 'start' | 'success' | 'alert' | 'neutral') {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'start') {
        // Soft ascending chime
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.15);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'success') {
        // Comforting double tone
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.12); // E5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'neutral') {
        // Gentle single bell chime
        osc.frequency.setValueAtTime(440, now); // A4
        gain.gain.setValueAtTime(0.10, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else {
        // Soft alert tone (not harsh)
        osc.frequency.setValueAtTime(349.23, now); // F4
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      }
    } catch (e) {
      // AudioContext might be blocked before first interaction
    }
  }

  // Voice Output
  public speak(
    text: string,
    language: Language = 'en',
    rate: number = 0.85,
    onEnd?: () => void
  ): void {
    if (!('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel();

      // Clean markdown stars and raw symbols for clean speech
      const cleaned = text
        .replace(/[*_#`~[\]]/g, '')
        .replace(/https?:\/\/\S+/g, 'link')
        .replace(/₹/g, 'Rupees ')
        .trim();

      if (!cleaned) {
        if (onEnd) onEnd();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.rate = rate; // Slow rate ~0.85 for elderly comprehension
      utterance.pitch = 1.0;

      // Match voice language
      const voices = window.speechSynthesis.getVoices();
      const targetLang = language === 'hi' ? 'hi-IN' : 'en-IN';
      const voice =
        voices.find((v) => v.lang.toLowerCase().startsWith(targetLang.toLowerCase())) ||
        voices.find((v) => v.lang.toLowerCase().includes('en-in') || v.lang.toLowerCase().includes('hi')) ||
        voices[0];

      if (voice) {
        utterance.voice = voice;
      }
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

      this.isSpeaking = true;
      this.currentUtterance = utterance;

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        this.isSpeaking = false;
        this.currentUtterance = null;
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech error:', err);
      this.isSpeaking = false;
      if (onEnd) onEnd();
    }
  }

  public stopSpeaking(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  // Voice Input (Speech Recognition)
  public startListening(
    language: Language,
    onResult: (text: string) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ): () => void {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onError('Speech recognition is not supported in this browser. You can also type easily.');
      onEnd();
      return () => {};
    }

    try {
      this.playChime('start');
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

      this.recognitionInstance = recognition;

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        if (transcript) {
          onResult(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          onError(
            language === 'hi'
              ? 'आवाज़ साफ नहीं सुनाई दी। कृपया दोबारा बोलें।'
              : 'I could not hear clearly. Please try speaking once more, no rush.'
          );
        }
        onEnd();
      };

      recognition.onend = () => {
        this.recognitionInstance = null;
        onEnd();
      };

      recognition.start();

      return () => {
        try {
          recognition.stop();
        } catch (e) {}
      };
    } catch (e: any) {
      onError('Could not start microphone. Please check permissions.');
      onEnd();
      return () => {};
    }
  }

  public stopListening(): void {
    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.stop();
      } catch (e) {}
      this.recognitionInstance = null;
    }
  }
}

export const speechService = new SpeechService();
