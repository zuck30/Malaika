import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Message {
  role: 'user' | 'elysia';
  content: string;
}

interface ElysiaState {
  messages: Message[];
  emotion: string;
  isSpeaking: boolean;
  isListening: boolean;
  isTyping: boolean;
  cameraActive: boolean;
  visionAnalysis: string | null;
}

const initialState: ElysiaState = {
  messages: [
    { role: 'elysia', content: "Hello. I'm Elysia. I'm an AI Companion, made in Tanzania. Nice to meet you." }
  ],
  emotion: 'neutral',
  isSpeaking: false,
  isListening: false,
  isTyping: false,
  cameraActive: false,
  visionAnalysis: null,
};

const elysiaSlice = createSlice({
  name: 'elysia',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    setEmotion: (state, action: PayloadAction<string>) => {
      state.emotion = action.payload;
    },
    setSpeaking: (state, action: PayloadAction<boolean>) => {
      state.isSpeaking = action.payload;
    },
    setListening: (state, action: PayloadAction<boolean>) => {
      state.isListening = action.payload;
    },
    setTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
    setCameraActive: (state, action: PayloadAction<boolean>) => {
      state.cameraActive = action.payload;
    },
    setVisionAnalysis: (state, action: PayloadAction<string | null>) => {
      state.visionAnalysis = action.payload;
    }
  },
});

export const { 
  addMessage, 
  setEmotion, 
  setSpeaking, 
  setListening, 
  setTyping,
  setCameraActive,
  setVisionAnalysis
} = elysiaSlice.actions;

export default elysiaSlice.reducer;
