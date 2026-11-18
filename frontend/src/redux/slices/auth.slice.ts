import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { loadSession } from '@/lib/localStorage';
import type { User } from '@/types/models';

export type AuthNotice = 'expired' | null;
export interface AuthState { token: string | null; user: User | null; verified: boolean; notice: AuthNotice }

const stored = loadSession();
const initialState: AuthState = { token: stored?.token ?? null, user: stored?.user ?? null, verified: false, notice: null };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSucceeded(state, action: PayloadAction<{ token: string; user: User }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.verified = true;
      state.notice = null;
    },
    userVerified(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.verified = true;
    },
    sessionCleared(state, action: PayloadAction<AuthNotice>) {
      state.token = null;
      state.user = null;
      state.verified = false;
      state.notice = action.payload;
    },
    noticeDismissed(state) {
      state.notice = null;
    },
  },
});

export const { loginSucceeded, userVerified, sessionCleared, noticeDismissed } = authSlice.actions;
export default authSlice.reducer;
