import { useMutation } from '@tanstack/react-query';
import { login, register } from '@/api/services/auth.api';
import type { LoginPayload, RegisterPayload } from '@/types/api';

export default function useAuthMutation() {
  const signupMutation = useMutation({ mutationKey: ['signup'], mutationFn: (p: RegisterPayload) => register(p) });
  const loginMutation = useMutation({ mutationKey: ['login'], mutationFn: (p: LoginPayload) => login(p) });
  return { signupMutation, loginMutation };
}
