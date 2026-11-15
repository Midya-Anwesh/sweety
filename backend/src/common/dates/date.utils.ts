import { BadRequestError } from 'routing-controllers';
import { env } from '../../config/env';

export function todayInAppTimezone(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: env.APP_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find((entry) => entry.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function validateDate(date: string, allowFuture = false): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < '0001-01-01') {
    throw new BadRequestError('Date must be a valid calendar date in YYYY-MM-DD format.');
  }
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new BadRequestError('Date must be a valid calendar date in YYYY-MM-DD format.');
  }
  if (!allowFuture && date > todayInAppTimezone()) {
    throw new BadRequestError('Date cannot be in the future.');
  }
}

export type ReportType = 'daily' | 'month-to-date' | 'monthly';

export function reportRange(type: ReportType, date: string) {
  validateDate(date);
  if (type === 'daily') return { from: date, to: date };
  if (type === 'month-to-date') return { from: `${date.slice(0, 7)}-01`, to: date };

  // Calendar strings are UTC here; user timezone is only needed to determine today.
  const firstOfMonth = new Date(`${date.slice(0, 7)}-01T00:00:00.000Z`);
  const lastOfPreviousMonth = new Date(firstOfMonth.getTime() - 86400000);
  const to = lastOfPreviousMonth.toISOString().slice(0, 10);
  return { from: `${to.slice(0, 7)}-01`, to };
}
