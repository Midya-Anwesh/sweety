import { useForm, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Link, useNavigate } from 'react-router';
import { Stethoscope, UserRound } from 'lucide-react';
import { AuthLayout } from '@/components/common/AuthLayout';
import { CustomInput, type RadioOption } from '@/components/common/CustomInput';
import { Notice, SlowNotice } from '@/components/common/Notice';
import { signupSchema } from '@/validation/schemas';
import useAuthMutation from '@/hooks/apis/auth/useAuthMutation';
import { useDelayed } from '@/hooks/useDelayed';
import { describeError, fieldErrors } from '@/lib/errors';
import { ROUTES } from '@/constants/routes';
import type { Role } from '@/types/models';

interface SignupValues { name: string; email: string; password: string; role: Role }
const FIELDS = ['name', 'email', 'password', 'role'] as const;

const roleOptions: RadioOption[] = [
  { value: 'patient', label: 'Patient', icon: UserRound, testId: 'radio-role-patient' },
  { value: 'doctor', label: 'Doctor', icon: Stethoscope, testId: 'radio-role-doctor' },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const { signupMutation } = useAuthMutation();
  const slow = useDelayed(signupMutation.isPending);
  const { control, handleSubmit, setError } = useForm<SignupValues>({
    resolver: yupResolver(signupSchema) as unknown as Resolver<SignupValues>,
    defaultValues: { name: '', email: '', password: '', role: 'patient' },
  });

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
          <CustomInput
            control={control}
            name="name"
            fieldName="name"
            id="signup-name"
            inptType="text"
            label="Name"
            autoComplete="name"
            maxLength={255}
            testId="input-name"
          />
          <CustomInput
            control={control}
            name="email"
            fieldName="email"
            id="signup-email"
            inptType="email"
            label="Email"
            autoComplete="email"
            testId="input-email"
          />
          <CustomInput
            control={control}
            name="password"
            fieldName="password"
            id="signup-password"
            inptType="password"
            label="Password"
            hint="8 to 128 characters. Spaces count."
            autoComplete="new-password"
            testId="input-password"
          />
          <CustomInput
            control={control}
            name="role"
            fieldName="role"
            id="signup-role"
            inptType="radio"
            label="I am a"
            radioOptions={roleOptions}
            className="role-picker"
            hint="Either way, your journal holds only your own readings."
          />
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
