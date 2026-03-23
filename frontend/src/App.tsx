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
  setWsConnected,
} from './store/MalaikaSlice';
import MalaikaCharacter from './components/Character/Malaika3D';
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
  const { messages, emotion, isSpeaking, isListening, isTyping, cameraActive, visionAnalysis, wsConnected } =
    useSelector((state: RootState) => state.Malaika);

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const webcamRef = React.useRef<Webcam>(null);

  const lastAnalysisRef = useRef<string>('');
  const isProcessingVisionRef = useRef<boolean>(false);

  const handleSpeak = React.useCallback(async (text: string) => {
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
  }, [dispatch]);

  const handleVoiceInput = React.useCallback(async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice.wav');

    try {
      dispatch(setTyping(true));
      const response = await axios.post(`${API_BASE}/api/chat/voice`, formData);
      const { user_text, response: Malaika_response } = response.data;

      dispatch(addMessage({ role: 'user', content: user_text }));
      dispatch(addMessage({ role: 'Malaika', content: Malaika_response }));
      dispatch(setTyping(false));
      handleSpeak(Malaika_response);
    } catch (err) {
      console.error('Voice processing failed', err);
      dispatch(setTyping(false));
    }
  }, [dispatch, handleSpeak]);

  const { toggleRecording } = useVoiceRecorder((blob) => {
    dispatch(setListening(false));
    handleVoiceInput(blob);
  });

  const handleToggleListening = React.useCallback(() => {
    const nextState = !isListening;
    dispatch(setListening(nextState));
    toggleRecording();
  }, [dispatch, isListening, toggleRecording]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      ws = new WebSocket(`${WS_BASE}/ws/chat`);

      ws.onopen = () => {
        console.log('WebSocket Connected');
        dispatch(setWsConnected(true));
      };

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_response') {
          dispatch(setTyping(false));
          dispatch(addMessage({ role: 'Malaika', content: data.text }));
          dispatch(setEmotion(data.emotion));
          handleSpeak(data.text);
        }
      };

      ws.onclose = (e) => {
        console.log('WebSocket Disconnected', e.reason);
        dispatch(setWsConnected(false));
        setSocket(null);
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket Error', err);
        ws?.close();
      };

      setSocket(ws);
    };

    connect();

    return () => {
      if (ws) {
        ws.onclose = null; // Prevent reconnection on cleanup
        ws.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [dispatch, handleSpeak]);

  const sendMessage = React.useCallback(async (text: string) => {
    dispatch(addMessage({ role: 'user', content: text }));
    dispatch(setTyping(true));

    if (cameraActive && webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        try {
          // Extract base64 data properly
          const base64Data = imageSrc.split(',')[1];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'image/jpeg' });

          const formData = new FormData();
          formData.append('message', text);
          formData.append('file', blob, 'vision.jpg');

          const response = await axios.post(`${API_BASE}/api/chat/vision-chat`, formData);
          const { response: Malaika_response, emotion: new_emotion } = response.data;

          dispatch(setTyping(false));
          dispatch(addMessage({ role: 'Malaika', content: Malaika_response }));
          if (new_emotion) dispatch(setEmotion(new_emotion));
          handleSpeak(Malaika_response);
          return;
        } catch (err) {
          console.error('Vision chat failed, falling back to standard chat', err);
        }
      }
    }

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'chat', text }));
    } else {
      console.error('WebSocket is not connected');
      dispatch(setTyping(false));
      dispatch(addMessage({ role: 'Malaika', content: 'Connection lost. Retrying...' }));
    }
  }, [cameraActive, dispatch, handleSpeak, socket]);

  const handleFrame = React.useCallback(async (imageSrc: string) => {
    if (isProcessingVisionRef.current || isSpeaking) return;

    isProcessingVisionRef.current = true;

    try {
      const base64Data = imageSrc; // CameraFeed already stripped the prefix
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('message', '[VISION_ONLY]');
      formData.append('file', blob, 'frame.jpg');

      const response = await axios.post(`${API_BASE}/api/chat/vision-chat`, formData);
      const { response: Malaika_response, emotion: new_emotion, visual_description } = response.data;

      // Only respond if the description changed or enough time has passed (to avoid chatter)
      // Here we trust the backend's specific descriptions to drive spontaneity
      if (visual_description && visual_description !== lastAnalysisRef.current) {
        lastAnalysisRef.current = visual_description;

        // Only actually "say" something if Malaika is not already talking
        if (!isSpeaking) {
          dispatch(setVisionAnalysis(visual_description));
          dispatch(addMessage({ role: 'Malaika', content: Malaika_response }));
          if (new_emotion) dispatch(setEmotion(new_emotion));
          handleSpeak(Malaika_response);
        }
      }
    } catch (err) {
      console.error('Vision frame processing failed', err);
    } finally {
      // Add a cool-down for proactive vision
      setTimeout(() => {
        isProcessingVisionRef.current = false;
      }, 10000); // 10 second cooldown between proactive comments
    }
  }, [dispatch, handleSpeak, isSpeaking]);

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

      {/* Character Visualization */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="w-full h-full transition-opacity duration-700 pointer-events-auto">
          <MalaikaCharacter
            emotion={emotion}
            isSpeaking={isSpeaking}
            isListening={isListening || isTyping}
          />
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
          isWsConnected={wsConnected}
        />
      </main>
    </div>
  );
};

export default App;