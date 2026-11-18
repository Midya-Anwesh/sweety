import { axiosInstance } from '../axiosInstance';
import { API_ENDPOINTS } from '@/constants/endPoints';
import type { CreateReadingPayload, ReadingResponse, ReadingsResponse } from '@/types/api';

export interface ListReadingsParams {
  page?: number;
  limit?: number;
  date?: string;
  from?: string;
  to?: string;
}

export async function listReadings(params?: ListReadingsParams, signal?: AbortSignal) {
  const { data } = await axiosInstance.get<ReadingsResponse>(API_ENDPOINTS.readings.list, {
    params,
    signal,
  });
  return data;
}

export async function createReading(payload: CreateReadingPayload) {
  const { data } = await axiosInstance.post<ReadingResponse>(API_ENDPOINTS.readings.list, payload);
  return data.reading;
}

export async function updateReading(id: string, value: number) {
  const { data } = await axiosInstance.patch<ReadingResponse>(API_ENDPOINTS.readings.one(id), { value });
  return data.reading;
}

export async function deleteReading(id: string): Promise<void> {
  await axiosInstance.delete(API_ENDPOINTS.readings.one(id));
}
