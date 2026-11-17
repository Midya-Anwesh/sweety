import { axiosInstance } from '../axiosInstance';
import { API_ENDPOINTS } from '@/constants/endPoints';
import type { LoginPayload, LoginResponse, RegisterPayload, UserResponse } from '@/types/api';

export async function register(payload: RegisterPayload) {
  const { data } = await axiosInstance.post<UserResponse>(API_ENDPOINTS.auth.register, payload);
  return data.user;
}

export async function login(payload: LoginPayload) {
  const { data } = await axiosInstance.post<LoginResponse>(API_ENDPOINTS.auth.login, payload);
  return data;
}

export async function getMe(signal?: AbortSignal) {
  const { data } = await axiosInstance.get<UserResponse>(API_ENDPOINTS.auth.me, { signal });
  return data.user;
}
