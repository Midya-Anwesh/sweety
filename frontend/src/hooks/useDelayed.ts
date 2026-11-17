import { useEffect, useState } from 'react';
import { SLOW_NOTICE_MS } from '@/constants/env';

export function useDelayed(active: boolean, ms = SLOW_NOTICE_MS): boolean {
  const [late, setLate] = useState(false);
  useEffect(() => {
    if (!active) {
      setLate(false);
      return;
    }
    const t = window.setTimeout(() => setLate(true), ms);
    return () => window.clearTimeout(t);
  }, [active, ms]);
  return late;
}
