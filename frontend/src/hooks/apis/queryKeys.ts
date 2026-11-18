import type { ReportType } from '@/types/models';
import type { ListReadingsParams } from '@/api/services/readings.api';

export const queryKeys = {
  user: (userId: string) => ['user', userId] as const,
  me: (token: string) => ['me', token] as const,
  readings: (userId: string, params?: ListReadingsParams) => ['user', userId, 'readings', params] as const,
  report: (userId: string, type: ReportType, date: string) => ['user', userId, 'reports', type, date] as const,
};
