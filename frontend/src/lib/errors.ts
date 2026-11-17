import { isAxiosError } from 'axios';
import type { ApiErrorBody } from '@/types/api';

export function getStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}

export function isCanceled(error: unknown): boolean {
  return isAxiosError(error) && error.code === 'ERR_CANCELED';
}

function bodyOf(error: unknown): ApiErrorBody | undefined {
  if (!isAxiosError(error)) return undefined;
  const data = error.response?.data;
  return data && typeof data === 'object' ? (data as ApiErrorBody) : undefined;
}

export function fieldErrors(error: unknown): { field: string; message: string }[] {
  const list = bodyOf(error)?.errors;
  return Array.isArray(list) ? list.filter((e) => e && typeof e.field === 'string' && typeof e.message === 'string') : [];
}

export function describeError(error: unknown, context: 'login' | 'default' = 'default'): string {
  if (isAxiosError(error)) {
    if (error.code === 'ERR_CANCELED') return 'The request was cancelled.';
    const res = error.response;
    if (!res) {
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return `The server did not answer within 3 minutes (${error.message}). It may still be waking up. If you were saving, check your journal before trying again - the change may already be stored.`;
      }
      return `Could not reach the Sweety server (${error.message}). Check your connection. If it keeps happening the server may be starting up or refusing this site (CORS). Please try again.`;
    }
    const msg = bodyOf(error)?.message;
    switch (res.status) {
      case 401:
        return context === 'login' ? 'Invalid email or password.' : 'Your session has expired. Please log in again.';
      case 413:
        return 'That request was too large for the server.';
      case 429:
        return msg ?? 'Too many attempts. Please wait a few minutes before trying again.';
      case 500:
        return 'Something went wrong on the server. Please try again.';
      default:
        return msg ?? `Request failed (status ${res.status}).`;
    }
  }
  return error instanceof Error ? error.message : 'Something went wrong.';
}
