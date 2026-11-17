import { useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { invalid?: boolean };

export function PasswordInput({ invalid, ...rest }: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="pw-wrap">
      <input {...rest} type={visible ? 'text' : 'password'} className="input" aria-invalid={invalid || undefined} />
      <button
        type="button"
        className="pw-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        data-testid="button-toggle-password"
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}
