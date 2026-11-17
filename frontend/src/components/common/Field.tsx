import type { ReactNode } from 'react';

interface Props { id: string; label: string; error?: string; hint?: string; children: ReactNode }

export function Field({ id, label, error, hint, children }: Props) {
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">{label}</label>
      {children}
      {error ? (
        <p className="field-error" id={`${id}-error`} role="alert" data-testid={`error-${id}`}>{error}</p>
      ) : hint ? (
        <p className="field-hint" id={`${id}-hint`}>{hint}</p>
      ) : null}
    </div>
  );
}
