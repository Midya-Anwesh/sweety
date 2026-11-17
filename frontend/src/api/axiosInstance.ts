import axios, { isAxiosError } from 'axios';
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '@/constants/env';
import { PUBLIC_AUTH_ENDPOINTS } from '@/constants/endPoints';
import { store } from '@/redux/store';
import { endSession, getSessionSignal } from '@/lib/session';

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  withCredentials: false,
  headers: { Accept: 'application/json' },
});

axiosInstance.interceptors.request.use((config) => {
  const isPublic = PUBLIC_AUTH_ENDPOINTS.includes(config.url ?? '');
  const token = store.getState().auth.token;
  if (!isPublic && token) {
    config.headers.Authorization = `Bearer ${token}`;
    const sessionSignal = getSessionSignal();
    const own = config.signal as AbortSignal | undefined;
    if (own && typeof AbortSignal.any === 'function') config.signal = AbortSignal.any([own, sessionSignal]);
    else if (!own) config.signal = sessionSignal;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? '';
      const sent = String(error.config?.headers?.Authorization ?? '');
      const current = store.getState().auth.token;
      // Only expire the session that issued this request; a stale request must not end a newer session.
      if (!PUBLIC_AUTH_ENDPOINTS.includes(url) && current && sent === `Bearer ${current}`) {
        endSession('expired');
      }
    }
    return Promise.reject(error);
  },
);
