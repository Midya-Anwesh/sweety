import { QueryClient } from '@tanstack/react-query';
import { getStatus } from './errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      retry: (count, error) => {
        const status = getStatus(error);
        if (status !== undefined && status < 500) return false;
        return count < 2;
      },
    },
    mutations: { retry: false },
  },
});
