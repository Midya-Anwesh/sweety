import type { Reading, Slot } from '@/types/models';

export interface DayGroup { date: string; latest: string; bySlot: Partial<Record<Slot, Reading>>; count: number }

export function groupByDay(readings: Reading[]): DayGroup[] {
  const map = new Map<string, DayGroup>();
  for (const r of readings) {
    let g = map.get(r.date);
    if (!g) {
      g = { date: r.date, latest: r.createdAt, bySlot: {}, count: 0 };
      map.set(r.date, g);
    }
    g.bySlot[r.slot] = r;
    g.count += 1;
    if (Date.parse(r.createdAt) > Date.parse(g.latest)) g.latest = r.createdAt;
  }
  return [...map.values()];
}

export function usedSlotsFor(readings: Reading[], date: string): Set<Slot> {
  return new Set(readings.filter((r) => r.date === date).map((r) => r.slot));
}
