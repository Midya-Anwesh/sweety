import type { Slot } from '@/types/models';

export const SLOTS: { id: Slot; label: string; short: string }[] = [
  { id: 'morning_fasting', label: 'Morning fasting', short: 'Fasting' },
  { id: 'after_breakfast', label: 'After breakfast', short: 'Breakfast' },
  { id: 'after_lunch', label: 'After lunch', short: 'Lunch' },
  { id: 'after_dinner', label: 'After dinner', short: 'Dinner' },
];
export const SLOT_IDS = SLOTS.map((s) => s.id);
export const slotLabel = (slot: Slot) => SLOTS.find((s) => s.id === slot)?.label ?? slot;
export const VALUE_MIN = 40;
export const VALUE_MAX = 600;
export const UNIT = 'mg/dL';
