import { Plus } from 'lucide-react';
import { SLOTS, UNIT } from '@/constants/slots';
import { formatDay, relativeDayLabel } from '@/lib/date';
import type { DayGroup } from '@/lib/readings';
import type { Reading, Slot } from '@/types/models';

interface Props {
  groups: DayGroup[];
  onAdd: (date: string, slot: Slot) => void;
  onEdit: (r: Reading) => void;
  limit?: number;
  onLimitChange?: (limit: number) => void;
}

export function ReadingsTable({ groups, onAdd, onEdit, limit, onLimitChange }: Props) {
  return (
    <div className="table-wrap">
      <table className="ledger" data-testid="table-readings">
        <caption className="sr-only">Daily glucose readings, most recently entered days first</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            {SLOTS.map((s) => <th scope="col" key={s.id}>{s.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {groups.map((g, i) => {
            const rel = relativeDayLabel(g.date);
            return (
              <tr key={g.date} data-testid={`row-day-${g.date}`} style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
                <th scope="row" className="day-cell">
                  <span className="day-main" data-testid={`text-day-${g.date}`}>{formatDay(g.date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span className="day-sub">{rel ?? formatDay(g.date, { weekday: 'long' })} <span className="dots" aria-label={`${g.count} of 4 logged`}>{SLOTS.map((s) => <i key={s.id} className={g.bySlot[s.id] ? 'on' : ''} />)}</span></span>
                </th>
                {SLOTS.map((s) => {
                  const r = g.bySlot[s.id];
                  return (
                    <td key={s.id} data-label={s.label}>
                      {r ? (
                        <button type="button" className="value-chip" onClick={() => onEdit(r)} aria-label={`${s.label} on ${formatDay(g.date)}: ${r.value} ${UNIT}. Edit or delete`} data-testid={`button-edit-reading-${r.id}`}>
                          <span className="v" data-testid={`text-value-${g.date}-${s.id}`}>{r.value}</span>
                          <span className="u">{UNIT}</span>
                        </button>
                      ) : (
                        <button type="button" className="add-chip" onClick={() => onAdd(g.date, s.id)} aria-label={`Add ${s.label} reading for ${formatDay(g.date)}`} data-testid={`button-add-slot-${g.date}-${s.id}`}>
                          <Plus size={14} aria-hidden /> Add
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {onLimitChange && (
        <div className="table-footer" data-testid="table-footer-pagination">
          <label className="inline-field table-limit-control">
            <span>Page limit:</span>
            <select
              className="input input-sm select-page-limit"
              value={limit ?? 20}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              data-testid="select-page-limit"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </label>
        </div>
      )}
    </div>
  );
}

export function ReadingsTableSkeleton() {
  return (
    <div className="table-wrap" aria-busy="true" data-testid="status-readings-loading">
      <div className="skeleton-row"><span className="sk sk-w1" /><span className="sk" /><span className="sk" /><span className="sk" /><span className="sk" /></div>
      <div className="skeleton-row"><span className="sk sk-w1" /><span className="sk" /><span className="sk" /><span className="sk" /><span className="sk" /></div>
      <div className="skeleton-row"><span className="sk sk-w1" /><span className="sk" /><span className="sk" /><span className="sk" /><span className="sk" /></div>
    </div>
  );
}
