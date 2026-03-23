import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Message {
  role: 'user' | 'Malaika';
  content: string;
}

interface MalaikaState {
  messages: Message[];
  emotion: string;
  isSpeaking: boolean;
  isListening: boolean;
  isTyping: boolean;
  cameraActive: boolean;
  visionAnalysis: string | null;
  wsConnected: boolean;
}

const initialState: MalaikaState = {
  messages: [
    { role: 'Malaika', content: "Hello. I'm Malaika. I'm an AI Companion, made in Tanzania. Nice to meet you." }
  ],
  emotion: 'neutral',
  isSpeaking: false,
  isListening: false,
  isTyping: false,
  cameraActive: false,
  visionAnalysis: null,
  wsConnected: false,
};

const MalaikaSlice = createSlice({
  name: 'Malaika',
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
    },
    setWsConnected: (state, action: PayloadAction<boolean>) => {
      state.wsConnected = action.payload;
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
  setVisionAnalysis,
  setWsConnected
} = MalaikaSlice.actions;

export default MalaikaSlice.reducer;
