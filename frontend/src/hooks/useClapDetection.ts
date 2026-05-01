import { useEffect, useRef } from 'react';

/**
 * useClapDetection
 * Detects a "clap" sound based on a sharp peak in audio volume.
 */
export const useClapDetection = (onClap: () => void, enabled: boolean) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastClapTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const startDetection = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const detect = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteTimeDomainData(dataArray);

          let maxVal = 0;
          for (let i = 0; i < bufferLength; i++) {
            const val = Math.abs(dataArray[i] - 128);
            if (val > maxVal) maxVal = val;
          }

          // Simple threshold for a clap (sharp loud sound)
          // Threshold might need adjustment based on environment
          const threshold = 60;
          const now = Date.now();

          if (maxVal > threshold && now - lastClapTimeRef.current > 1000) {
            console.log('Clap detected! Max value:', maxVal);
            lastClapTimeRef.current = now;
            onClap();
          }

          requestAnimationFrame(detect);
        };

        detect();
      } catch (err) {
        console.error('Error accessing microphone for clap detection:', err);
      }
    };

    startDetection();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [onClap, enabled]);
};
