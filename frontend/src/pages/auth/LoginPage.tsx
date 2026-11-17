import { useForm, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Link, useLocation, useNavigate } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { AuthLayout } from '@/components/common/AuthLayout';
import { Field } from '@/components/common/Field';
import { PasswordInput } from '@/components/common/PasswordInput';
import { Notice, SlowNotice } from '@/components/common/Notice';
import { loginSchema } from '@/validation/schemas';
import useAuthMutation from '@/hooks/apis/auth/useAuthMutation';
import { useDelayed } from '@/hooks/useDelayed';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { noticeDismissed } from '@/redux/slices/auth.slice';
import { beginSession } from '@/lib/session';
import { describeError, fieldErrors } from '@/lib/errors';
import { ROUTES } from '@/constants/routes';

interface LoginValues { email: string; password: string }
interface LoginState { registered?: boolean; email?: string }

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const notice = useAppSelector((s) => s.auth.notice);
  const state = (location.state ?? null) as LoginState | null;
  const { loginMutation } = useAuthMutation();
  const slow = useDelayed(loginMutation.isPending);
  const { register, handleSubmit, setError, formState: { errors } } = useForm<LoginValues>({
    resolver: yupResolver(loginSchema) as unknown as Resolver<LoginValues>,
    defaultValues: { email: state?.email ?? '', password: '' },
  });

  const onSubmit = (v: LoginValues) => {
    dispatch(noticeDismissed());
    loginMutation.mutate(
      { email: v.email, password: v.password },
      {
        onSuccess: (res) => {
          beginSession(res.token, res.user);
          navigate(ROUTES.readings, { replace: true });
        },
        onError: (err) => {
          for (const fe of fieldErrors(err)) {
            if (fe.field === 'email' || fe.field === 'password') setError(fe.field, { message: fe.message });
          }
        },
      },
    );
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        <p className="eyebrow">Welcome back</p>
        <h2 className="auth-title">Log in to your journal</h2>
        {state?.registered && !loginMutation.isError && (
          <Notice tone="success" testId="status-registered">Your account is ready. Log in with your new password to start.</Notice>
        )}
        {notice === 'expired' && <Notice tone="info" testId="status-session-expired">Your session has expired. Please log in again.</Notice>}
        <form className="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Field id="login-email" label="Email" error={errors.email?.message}>
            <input id="login-email" type="email" autoComplete="email" className="input" {...register('email')} aria-invalid={!!errors.email || undefined} data-testid="input-email" />
          </Field>
          <Field id="login-password" label="Password" error={errors.password?.message}>
            <PasswordInput id="login-password" autoComplete="current-password" {...register('password')} invalid={!!errors.password} data-testid="input-password" autoFocus={Boolean(state?.email)} />
          </Field>
          {loginMutation.isError && <Notice tone="error" testId="error-login">{describeError(loginMutation.error, 'login')}</Notice>}
          <SlowNotice show={slow} />
          <button type="submit" className="btn btn-primary btn-block" disabled={loginMutation.isPending} data-testid="button-login">
            {loginMutation.isPending ? 'Logging in...' : <>Log in <ArrowRight size={16} aria-hidden /></>}
          </button>
        </form>
        <p className="auth-switch">New here? <Link to={ROUTES.signup} data-testid="link-signup">Create an account</Link></p>
      </div>
    </AuthLayout>
  );
}
