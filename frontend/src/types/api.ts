import type { Reading, Role, Slot, User } from './models';

export interface RegisterPayload { name: string; email: string; password: string; role: Role }
export interface LoginPayload { email: string; password: string }
export interface LoginResponse { token: string; tokenType: string; expiresIn: string; user: User }
export interface UserResponse { user: User }

export interface PaginationButton {
  type: 'previous' | 'first' | 'last' | 'page' | 'ellipsis' | 'next';
  label: string;
  page: number | null;
  active: boolean;
  disabled: boolean;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  first: number;
  last: number;
  previous: number | null;
  next: number | null;
  current: number;
}

export interface ReadingsResponse {
  data: Reading[];
  readings: Reading[];
  pagination: PaginationMeta;
  linked: PaginationButton[];
  links?: {
    first: number;
    last: number;
    previous: number | null;
    next: number | null;
    current: number;
    buttons: PaginationButton[];
  };
}

export interface ReadingResponse { reading: Reading }
export interface CreateReadingPayload { date: string; slot: Slot; value: number }
export interface ApiErrorBody { message?: string; errors?: { field: string; message: string }[] }
