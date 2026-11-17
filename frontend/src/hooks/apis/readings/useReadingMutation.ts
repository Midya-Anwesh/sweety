import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReading, deleteReading, updateReading } from '@/api/services/readings.api';
import { useAppSelector } from '@/redux/store';
import type { CreateReadingPayload } from '@/types/api';
import { queryKeys } from '../queryKeys';

export default function useReadingMutation() {
  const qc = useQueryClient();
  const userId = useAppSelector((s) => s.auth.user?.id ?? '');
  const refresh = () => qc.invalidateQueries({ queryKey: queryKeys.user(userId) });

  const createMutation = useMutation({
    mutationFn: (p: CreateReadingPayload) => createReading(p),
    onSuccess: refresh,
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: number }) => updateReading(id, value),
    onSuccess: refresh,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteReading(id),
    onSuccess: refresh,
  });
  return { createMutation, updateMutation, deleteMutation };
}
