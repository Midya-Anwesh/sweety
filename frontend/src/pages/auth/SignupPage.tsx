import { useForm, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Link, useNavigate } from 'react-router';
import { Stethoscope, UserRound } from 'lucide-react';
import { AuthLayout } from '@/components/common/AuthLayout';
import { Field } from '@/components/common/Field';
import { PasswordInput } from '@/components/common/PasswordInput';
import { Notice, SlowNotice } from '@/components/common/Notice';
import { signupSchema } from '@/validation/schemas';
import useAuthMutation from '@/hooks/apis/auth/useAuthMutation';
import { useDelayed } from '@/hooks/useDelayed';
import { describeError, fieldErrors } from '@/lib/errors';
import { ROUTES } from '@/constants/routes';
import type { Role } from '@/types/models';

interface SignupValues { name: string; email: string; password: string; role: Role }
const FIELDS = ['name', 'email', 'password', 'role'] as const;

export default function SignupPage() {
  const navigate = useNavigate();
  const { signupMutation } = useAuthMutation();
  const slow = useDelayed(signupMutation.isPending);
  const { register, handleSubmit, setError, watch, formState: { errors } } = useForm<SignupValues>({
    resolver: yupResolver(signupSchema) as unknown as Resolver<SignupValues>,
    defaultValues: { name: '', email: '', password: '', role: 'patient' },
  });
  const role = watch('role');

  const onSubmit = (v: SignupValues) => {
    signupMutation.mutate(v, {
      onSuccess: (user) => navigate(ROUTES.login, { state: { registered: true, email: user.email } }),
      onError: (err) => {
        for (const fe of fieldErrors(err)) {
          const f = FIELDS.find((x) => x === fe.field);
          if (f) setError(f, { message: fe.message });
        }
      },
    });
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        <p className="eyebrow">Start a journal</p>
        <h2 className="auth-title">Create your account</h2>
        <form className="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Field id="signup-name" label="Name" error={errors.name?.message}>
            <input id="signup-name" autoComplete="name" className="input" maxLength={255} {...register('name')} aria-invalid={!!errors.name || undefined} data-testid="input-name" />
          </Field>
          <Field id="signup-email" label="Email" error={errors.email?.message}>
            <input id="signup-email" type="email" autoComplete="email" className="input" {...register('email')} aria-invalid={!!errors.email || undefined} data-testid="input-email" />
          </Field>
          <Field id="signup-password" label="Password" error={errors.password?.message} hint="8 to 128 characters. Spaces count.">
            <PasswordInput id="signup-password" autoComplete="new-password" {...register('password')} invalid={!!errors.password} data-testid="input-password" />
          </Field>
          <fieldset className="field">
            <legend className="field-label">I am a</legend>
            <div className="role-picker">
              <label className={'role-option' + (role === 'patient' ? ' is-on' : '')}>
                <input type="radio" value="patient" {...register('role')} data-testid="radio-role-patient" />
                <UserRound size={18} aria-hidden /> <span>Patient</span>
              </label>
              <label className={'role-option' + (role === 'doctor' ? ' is-on' : '')}>
                <input type="radio" value="doctor" {...register('role')} data-testid="radio-role-doctor" />
                <Stethoscope size={18} aria-hidden /> <span>Doctor</span>
              </label>
            </div>
            <p className="field-hint">Either way, your journal holds only your own readings.</p>
            {errors.role?.message && <p className="field-error" role="alert">{errors.role.message}</p>}
          </fieldset>
          {signupMutation.isError && <Notice tone="error" testId="error-signup">{describeError(signupMutation.error)}</Notice>}
          <SlowNotice show={slow} />
          <button type="submit" className="btn btn-primary btn-block" disabled={signupMutation.isPending} data-testid="button-signup">
            {signupMutation.isPending ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="auth-switch">Already have one? <Link to={ROUTES.login} data-testid="link-login">Log in</Link></p>
      </div>
    </AuthLayout>
  );
}
