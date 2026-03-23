import { configureStore } from '@reduxjs/toolkit';
import MalaikaReducer from './MalaikaSlice';

export const store = configureStore({
  reducer: {
    Malaika: MalaikaReducer,
  },
} as const);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
