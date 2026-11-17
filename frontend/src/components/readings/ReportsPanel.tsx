import { useState } from 'react';
import { RotateCw } from 'lucide-react';
import useReportQuery from '@/hooks/apis/reports/useReportQuery';
import { useDelayed } from '@/hooks/useDelayed';
import { Notice, SlowNotice } from '@/components/common/Notice';
import { SLOTS, UNIT, slotLabel } from '@/constants/slots';
import { formatDay, isNotFuture, isRealDate, todayInAppTz } from '@/lib/date';
import { describeError } from '@/lib/errors';
import { cx, formatAverage } from '@/lib/utils';
import type { ReportType } from '@/types/models';

const TYPES: { id: ReportType; label: string; blurb: string }[] = [
  { id: 'daily', label: 'Daily', blurb: 'Just the selected day' },
  { id: 'month-to-date', label: 'Month to date', blurb: 'From the 1st up to the selected day' },
  { id: 'monthly', label: 'Monthly', blurb: 'The whole month before the selected day' },
];

export function ReportsPanel() {
  const [type, setType] = useState<ReportType>('daily');
  const [date, setDate] = useState(todayInAppTz());
  const valid = isRealDate(date) && isNotFuture(date);
  const q = useReportQuery(type, date);
  const slow = useDelayed(q.isFetching && !q.data);
  const r = q.data;
  const blurb = TYPES.find((t) => t.id === type)?.blurb;

  return (
    <section className="reports" aria-labelledby="reports-title" data-testid="section-reports">
      <div className="reports-head">
        <div>
          <p className="eyebrow">Summary</p>
          <h2 id="reports-title" className="section-title">Reports</h2>
        </div>
        <div className="reports-controls">
          <div className="segmented" role="radiogroup" aria-label="Report type">
            {TYPES.map((t) => (
              <button key={t.id} type="button" role="radio" aria-checked={type === t.id} className={cx('seg', type === t.id && 'is-on')} onClick={() => setType(t.id)} data-testid={`button-report-${t.id}`}>
                {t.label}
              </button>
            ))}
          </div>
          <label className="inline-field">
            <span>Selected date</span>
            <input type="date" className="input input-sm" max={todayInAppTz()} value={date} onChange={(e) => setDate(e.target.value)} data-testid="input-report-date" aria-invalid={!valid || undefined} />
          </label>
        </div>
      </div>
      <p className="reports-blurb">{blurb}{r ? <> &middot; <span data-testid="text-report-range">{r.from === r.to ? formatDay(r.from) : `${formatDay(r.from)} - ${formatDay(r.to)}`}</span></> : null}</p>

      {!valid ? (
        <Notice tone="error" testId="error-report-date">Choose a real date that is not in the future.</Notice>
      ) : q.isError ? (
        <Notice tone="error" testId="error-report" action={<button className="btn btn-ghost btn-sm" onClick={() => q.refetch()} data-testid="button-retry-report"><RotateCw size={14} aria-hidden /> Retry</button>}>
          {describeError(q.error)}
        </Notice>
      ) : !r ? (
        <>
          <div className="stats" aria-busy="true" data-testid="status-report-loading">
            {Array.from({ length: 4 }).map((_, i) => <div className="stat" key={i}><span className="sk sk-w1" /><span className="sk sk-big" /></div>)}
          </div>
          <SlowNotice show={slow} />
        </>
      ) : (
        <div className={cx('report-body', q.isFetching && 'is-refreshing')}>
          <div className="stats">
            <Stat label="Average" value={formatAverage(r.average)} unit={r.average === null ? undefined : UNIT} testId="text-report-average" feature />
            <Stat label="Highest" value={r.highest === null ? '-' : String(r.highest)} unit={r.highest === null ? undefined : UNIT} testId="text-report-highest" />
            <Stat label="Lowest" value={r.lowest === null ? '-' : String(r.lowest)} unit={r.lowest === null ? undefined : UNIT} testId="text-report-lowest" />
            <Stat label="Readings" value={String(r.count)} testId="text-report-count" />
          </div>
          {r.message && <p className="report-empty" data-testid="text-report-message">{r.message}</p>}
          {r.type === 'daily' && r.readings && r.readings.length > 0 && (
            <ul className="daily-list" data-testid="list-report-daily">
              {SLOTS.map((s) => {
                const row = r.readings?.find((x) => x.slot === s.id);
                return (
                  <li key={s.id} className={row ? '' : 'is-empty'} data-testid={`row-report-${s.id}`}>
                    <span>{slotLabel(s.id)}</span>
                    <span className="dl-val">{row ? <>{row.value} <small>{UNIT}</small></> : 'not logged'}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, unit, testId, feature }: { label: string; value: string; unit?: string; testId: string; feature?: boolean }) {
  return (
    <div className={cx('stat', feature && 'is-feature')}>
      <span className="stat-label">{label}</span>
      <span className="stat-value"><span data-testid={testId}>{value}</span>{unit && <small> {unit}</small>}</span>
    </div>
  );
}
