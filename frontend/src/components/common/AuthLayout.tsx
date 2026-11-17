import type { ReactNode } from 'react';
import { Brand } from './Brand';

const SLOT_STRIP = ['Fasting', 'Breakfast', 'Lunch', 'Dinner'];

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <aside className="auth-side">
        <Brand />
        <div className="auth-side-copy">
          <p className="eyebrow">A glucose journal</p>
          <h1 className="display">Four moments a day.<br /><em>One calm page.</em></h1>
          <p className="lede">Write down your number, close the app, get on with your day. Sweety keeps the record tidy and the summaries plain.</p>
        </div>
        <ol className="auth-strip" aria-hidden>
          {SLOT_STRIP.map((s, i) => (
            <li key={s} style={{ animationDelay: `${200 + i * 90}ms` }}>
              <span className="strip-n">0{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </aside>
      <main className="auth-main">{children}</main>
    </div>
  );
}
