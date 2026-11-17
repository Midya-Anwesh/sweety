import { queryClient } from './queryClient';
import { store } from '@/redux/store';
import { loginSucceeded, sessionCleared, type AuthNotice } from '@/redux/slices/auth.slice';
import type { User } from '@/types/models';

let controller = new AbortController();

export function getSessionSignal(): AbortSignal {
  return controller.signal;
}

function resetRequests() {
  controller.abort();
  controller = new AbortController();
  void queryClient.cancelQueries();
  queryClient.clear();
}

export function beginSession(token: string, user: User) {
  resetRequests();
  store.dispatch(loginSucceeded({ token, user }));
}

export function endSession(notice: AuthNotice = null) {
  resetRequests();
  store.dispatch(sessionCleared(notice));
}
