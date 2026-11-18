import { useForm, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Link, useLocation, useNavigate } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { AuthLayout } from '@/components/common/AuthLayout';
import { CustomInput } from '@/components/common/CustomInput';
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
  const { control, handleSubmit, setError } = useForm<LoginValues>({
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
          const destination = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
          const to = destination?.pathname ? `${destination.pathname}${destination.search ?? ''}` : ROUTES.readings;
          navigate(to, { replace: true });
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
          <CustomInput
            control={control}
            name="email"
            fieldName="email"
            id="login-email"
            inptType="email"
            label="Email"
            autoComplete="email"
            testId="input-email"
          />
          <CustomInput
            control={control}
            name="password"
            fieldName="password"
            id="login-password"
            inptType="password"
            label="Password"
            autoComplete="current-password"
            autoFocus={Boolean(state?.email)}
            testId="input-password"
          />
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
