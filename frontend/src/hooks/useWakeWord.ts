import { useEffect } from 'react';

export const useWakeWord = (wakeWord: string, onDetect: () => void, enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript.trim().toLowerCase();

      if (transcript.includes(wakeWord.toLowerCase())) {
        onDetect();
      }
    };

    recognition.onend = () => {
      if (enabled) {
        try {
          recognition.start();
        } catch (e) {
          // Already started or other error
        }
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start wake word recognition:', e);
    }

    return () => {
      recognition.onend = null;
      recognition.stop();
    };
  }, [wakeWord, onDetect, enabled]);
};
