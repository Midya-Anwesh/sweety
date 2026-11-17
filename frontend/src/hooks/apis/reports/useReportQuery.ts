import { useQuery } from '@tanstack/react-query';
import { getReport } from '@/api/services/reports.api';
import { useAppSelector } from '@/redux/store';
import { isNotFuture, isRealDate } from '@/lib/date';
import type { ReportType } from '@/types/models';
import { queryKeys } from '../queryKeys';

export default function useReportQuery(type: ReportType, date: string) {
  const userId = useAppSelector((s) => s.auth.user?.id ?? '');
  return useQuery({
    queryKey: queryKeys.report(userId, type, date),
    queryFn: ({ signal }) => getReport(type, date, signal),
    enabled: Boolean(userId) && isRealDate(date) && isNotFuture(date),
  });
}
