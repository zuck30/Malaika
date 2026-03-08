import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from './store';
import {
  addMessage,
  setEmotion,
  setSpeaking,
  setListening,
  setTyping,
  setCameraActive,
  setVisionAnalysis,
} from './store/elysiaSlice';
import ElysiaCharacter from './components/Character/Elysia3D';
import ChatInterface from './components/Chat/ChatInterface';
import CameraFeed from './components/Camera/CameraFeed';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useVoiceRecorder } from './hooks/useVoiceRecorder';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const WS_BASE = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

const App: React.FC = () => {
  const dispatch = useDispatch();
  const { messages, emotion, isSpeaking, isListening, isTyping, cameraActive, visionAnalysis } =
    useSelector((state: RootState) => state.elysia);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const webcamRef = React.useRef<Webcam>(null);

  const lastAnalysisRef = useRef<string>('');
  const isProcessingVisionRef = useRef<boolean>(false);

  const handleSpeak = async (text: string) => {
    try {
      const response = await axios.get(`${API_BASE}/api/chat/tts`, {
        params: { text },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      const audio = new Audio(url);
      dispatch(setSpeaking(true));
      audio.onended = () => dispatch(setSpeaking(false));
      audio.play();
    } catch (err) {
      console.error('TTS failed', err);
    }
  };

  const handleVoiceInput = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice.wav');

    try {
      dispatch(setTyping(true));
      const response = await axios.post(`${API_BASE}/api/chat/voice`, formData);
      const { user_text, response: elysia_response } = response.data;

      dispatch(addMessage({ role: 'user', content: user_text }));
      dispatch(addMessage({ role: 'elysia', content: elysia_response }));
      dispatch(setTyping(false));
      handleSpeak(elysia_response);
    } catch (err) {
      console.error('Voice processing failed', err);
      dispatch(setTyping(false));
    }
  };

  const { toggleRecording } = useVoiceRecorder((blob) => {
    dispatch(setListening(false));
    handleVoiceInput(blob);
  });

  const handleToggleListening = () => {
    const nextState = !isListening;
    dispatch(setListening(nextState));
    toggleRecording();
  };

  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE}/ws/chat`);

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat_response') {
        dispatch(setTyping(false));
        dispatch(addMessage({ role: 'elysia', content: data.text }));
        dispatch(setEmotion(data.emotion));
        handleSpeak(data.text);
      }
    };

    setSocket(ws);
    return () => ws.close();
  }, [dispatch]);

  const sendMessage = async (text: string) => {
    dispatch(addMessage({ role: 'user', content: text }));
    dispatch(setTyping(true));

    if (cameraActive && webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        try {
          const blob = await fetch(imageSrc).then((r) => r.blob());
          const formData = new FormData();
          formData.append('message', text);
          formData.append('file', blob, 'vision.jpg');

          const response = await axios.post(`${API_BASE}/api/vision/vision-chat`, formData);
          const { response: elysia_response, emotion: new_emotion } = response.data;

          dispatch(setTyping(false));
          dispatch(addMessage({ role: 'elysia', content: elysia_response }));
          if (new_emotion) dispatch(setEmotion(new_emotion));
          handleSpeak(elysia_response);
          return;
        } catch (err) {
          console.error('Vision chat failed, falling back to standard chat', err);
        }
      }
    }

    socket?.send(JSON.stringify({ type: 'chat', text }));
  };

  const handleFrame = async (imageSrc: string) => {
    if (isProcessingVisionRef.current) return;

    const fetchRes = await fetch(imageSrc);
    const blob = await fetchRes.blob();

    isProcessingVisionRef.current = true;

    try {
      const formData = new FormData();
      formData.append('message', '[VISION_ONLY]');
      formData.append('file', blob, 'frame.jpg');

      const response = await axios.post(`${API_BASE}/api/chat/vision-chat`, formData);
      const { response: elysia_response, emotion: new_emotion, visual_description } = response.data;

      if (visual_description !== lastAnalysisRef.current) {
        lastAnalysisRef.current = visual_description;
        dispatch(setVisionAnalysis(visual_description));
        dispatch(addMessage({ role: 'elysia', content: elysia_response }));
        if (new_emotion) dispatch(setEmotion(new_emotion));
        handleSpeak(elysia_response);
      }
    } catch (err) {
      console.error('Vision frame processing failed', err);
    } finally {
      isProcessingVisionRef.current = false;
    }
  };

  return (
    <div
      className="h-screen w-full bg-gradient-to-br from-[#f0f3f8] via-[#f8faff] to-[#f0f5fa] text-[#1e2b3c] flex flex-col overflow-hidden font-avenir selection:bg-sky-300/30 relative"
      style={{ contain: 'content' }}
    >
      {/* Subtle noise overlay */}
      <div className="noise opacity-[0.015]" />

      {/* Cool blue animated glow */}
      <motion.div
        animate={{
          opacity: [0.1, 0.2, 0.1],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 10, repeat: Infinity }}
        className="fixed -top-1/4 -left-1/4 w-full h-full bg-sky-200/30 blur-[150px] rounded-full pointer-events-none"
      />

      {/* Character Visualization – slightly darkened to stand out on light background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="w-full h-full max-w-4xl opacity-70 mix-blend-multiply transition-opacity duration-700">
          <ElysiaCharacter emotion={emotion} isSpeaking={isSpeaking} isListening={isListening || isTyping} />
        </div>
      </div>

      {/* Main Content */}
      <main className="fixed inset-0 z-10 flex flex-col overflow-hidden">
        {/* Hidden Camera Feed */}
        <CameraFeed isActive={cameraActive} onFrame={handleFrame} isHidden={true} webcamRef={webcamRef} />

        {/* Vision Active Indicator */}
        <AnimatePresence>
          {cameraActive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute top-6 right-6 z-50 flex items-center space-x-2 bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/70 shadow-lg"
            >
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-sky-600">Vision Active</span>
            </motion.div>
          )}
        </AnimatePresence>

        <ChatInterface
          messages={messages}
          onSendMessage={sendMessage}
          isTyping={isTyping}
          isListening={isListening}
          setIsListening={handleToggleListening}
          isSpeaking={isSpeaking}
          onVoiceInput={handleVoiceInput}
          toggleCamera={() => dispatch(setCameraActive(!cameraActive))}
          isCameraActive={cameraActive}
        />
      </main>
    </div>
  );
};

export default App;