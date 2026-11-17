import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { cx } from '@/lib/utils';

interface Props { tone: 'error' | 'success' | 'info'; children: ReactNode; testId?: string; action?: ReactNode }

export function Notice({ tone, children, testId, action }: Props) {
  const Icon = tone === 'error' ? AlertCircle : tone === 'success' ? CheckCircle2 : Clock;
  return (
    <div className={cx('notice', `notice-${tone}`)} role={tone === 'error' ? 'alert' : 'status'} data-testid={testId}>
      <Icon size={18} aria-hidden />
      <div className="notice-body">{children}</div>
      {action}
    </div>
  );
}

export function SlowNotice({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <Notice tone="info" testId="status-slow-server">
      The server is waking up - this can take up to a few minutes on the first visit. Hang tight.
    </Notice>
  );
}
