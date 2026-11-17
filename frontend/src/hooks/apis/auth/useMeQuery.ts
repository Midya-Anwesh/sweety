import { useQuery } from '@tanstack/react-query';
import { getMe } from '@/api/services/auth.api';
import { queryKeys } from '../queryKeys';

export default function useMeQuery(token: string | null, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.me(token ?? 'none'),
    queryFn: ({ signal }) => getMe(signal),
    enabled: Boolean(token) && enabled,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
}
