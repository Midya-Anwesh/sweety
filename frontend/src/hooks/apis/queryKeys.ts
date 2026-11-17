import type { ReportType } from '@/types/models';

export const queryKeys = {
  user: (userId: string) => ['user', userId] as const,
  me: (token: string) => ['me', token] as const,
  readings: (userId: string) => ['user', userId, 'readings'] as const,
  report: (userId: string, type: ReportType, date: string) => ['user', userId, 'reports', type, date] as const,
};
