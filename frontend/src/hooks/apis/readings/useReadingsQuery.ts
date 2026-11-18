import { useQuery } from '@tanstack/react-query';
import { listReadings, type ListReadingsParams } from '@/api/services/readings.api';
import { useAppSelector } from '@/redux/store';
import { queryKeys } from '../queryKeys';

export default function useReadingsQuery(params?: ListReadingsParams) {
  const userId = useAppSelector((s) => s.auth.user?.id ?? '');
  return useQuery({
    queryKey: queryKeys.readings(userId, params),
    queryFn: ({ signal }) => listReadings(params, signal),
    enabled: Boolean(userId),
  });
}
