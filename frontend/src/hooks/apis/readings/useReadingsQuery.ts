import { useQuery } from '@tanstack/react-query';
import { listReadings } from '@/api/services/readings.api';
import { useAppSelector } from '@/redux/store';
import { queryKeys } from '../queryKeys';

export default function useReadingsQuery() {
  const userId = useAppSelector((s) => s.auth.user?.id ?? '');
  return useQuery({
    queryKey: queryKeys.readings(userId),
    queryFn: ({ signal }) => listReadings(signal),
    enabled: Boolean(userId),
  });
}
