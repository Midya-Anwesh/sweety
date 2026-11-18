import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import authReducer from './slices/auth.slice';
import { saveSession } from '@/lib/localStorage';

export const store = configureStore({ reducer: { auth: authReducer } });

let lastToken = store.getState().auth.token;
let lastUser = store.getState().auth.user;
store.subscribe(() => {
  const { token, user } = store.getState().auth;
  if (token === lastToken && user === lastUser) return;
  lastToken = token;
  lastUser = user;
  saveSession(token ? { token, user } : null);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppDispatch = () => useDispatch<AppDispatch>();
