import { axiosInstance } from '../axiosInstance';
import { API_ENDPOINTS } from '@/constants/endPoints';
import type { Report, ReportType } from '@/types/models';

export async function getReport(type: ReportType, date: string, signal?: AbortSignal) {
  const { data } = await axiosInstance.get<Report>(API_ENDPOINTS.reports.byType(type), { params: { date }, signal });
  return data;
}
