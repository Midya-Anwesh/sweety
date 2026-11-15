export enum ReadingSlot {
  MORNING_FASTING = 'morning_fasting',
  AFTER_BREAKFAST = 'after_breakfast',
  AFTER_LUNCH = 'after_lunch',
  AFTER_DINNER = 'after_dinner',
}

export const slotLabels: Record<ReadingSlot, string> = {
  [ReadingSlot.MORNING_FASTING]: 'Morning (fasting)',
  [ReadingSlot.AFTER_BREAKFAST]: 'After breakfast',
  [ReadingSlot.AFTER_LUNCH]: 'After lunch',
  [ReadingSlot.AFTER_DINNER]: 'After dinner',
};
