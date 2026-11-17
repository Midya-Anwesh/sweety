import type { ReactNode } from 'react';
import { BrandMark } from './Brand';

export function FullScreenState({ children, testId }: { children: ReactNode; testId?: string }) {
  return (
    <div className="fullscreen" data-testid={testId}>
      <div className="fullscreen-card">
        <BrandMark size={44} />
        {children}
      </div>
    </div>
  );
}
