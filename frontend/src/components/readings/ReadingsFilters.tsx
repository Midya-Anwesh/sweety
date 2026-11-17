import { X } from 'lucide-react';
import { todayInAppTz } from '@/lib/date';
import { cx } from '@/lib/utils';

export type FilterMode = 'all' | 'date' | 'range';
export interface FilterState { mode: FilterMode; date: string; from: string; to: string }
export const EMPTY_FILTER: FilterState = { mode: 'all', date: '', from: '', to: '' };

interface Props { value: FilterState; onChange: (v: FilterState) => void; rangeError: string | null }

const MODES: { id: FilterMode; label: string }[] = [
  { id: 'all', label: 'All days' },
  { id: 'date', label: 'One day' },
  { id: 'range', label: 'Date range' },
];

export function ReadingsFilters({ value, onChange, rangeError }: Props) {
  const today = todayInAppTz();
  const active = value.mode !== 'all';
  return (
    <div className="filters" role="group" aria-label="Filter readings">
      <div className="segmented" role="radiogroup" aria-label="Filter type">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={value.mode === m.id}
            className={cx('seg', value.mode === m.id && 'is-on')}
            onClick={() => onChange({ ...value, mode: m.id })}
            data-testid={`filter-mode-${m.id}`}
          >
            {m.label}
          </button>
        ))}
      </div>
      {value.mode === 'date' && (
        <label className="inline-field">
          <span>Day</span>
          <input type="date" className="input input-sm" max={today} value={value.date} onChange={(e) => onChange({ ...value, date: e.target.value })} data-testid="input-filter-date" />
        </label>
      )}
      {value.mode === 'range' && (
        <>
          <label className="inline-field">
            <span>From</span>
            <input type="date" className="input input-sm" max={value.to || today} value={value.from} onChange={(e) => onChange({ ...value, from: e.target.value })} data-testid="input-filter-from" aria-invalid={!!rangeError || undefined} />
          </label>
          <label className="inline-field">
            <span>To</span>
            <input type="date" className="input input-sm" min={value.from || undefined} max={today} value={value.to} onChange={(e) => onChange({ ...value, to: e.target.value })} data-testid="input-filter-to" aria-invalid={!!rangeError || undefined} />
          </label>
        </>
      )}
      {active && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(EMPTY_FILTER)} data-testid="button-clear-filters">
          <X size={14} aria-hidden /> Clear
        </button>
      )}
      {rangeError && <p className="field-error filter-error" role="alert" data-testid="error-filter-range">{rangeError}</p>}
    </div>
  );
}
