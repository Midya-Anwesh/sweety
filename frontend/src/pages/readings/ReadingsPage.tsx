import { useMemo, useState } from 'react';
import { Plus, RotateCw } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ReadingsTable, ReadingsTableSkeleton } from '@/components/readings/ReadingsTable';
import { ReadingFormDialog } from '@/components/readings/ReadingFormDialog';
import { EditReadingDialog } from '@/components/readings/EditReadingDialog';
import { EMPTY_FILTER, ReadingsFilters, type FilterState } from '@/components/readings/ReadingsFilters';
import { ReportsPanel } from '@/components/readings/ReportsPanel';
import { Notice, SlowNotice } from '@/components/common/Notice';
import { Pagination } from '@/components/common/Pagination';
import useReadingsQuery from '@/hooks/apis/readings/useReadingsQuery';
import { useDelayed } from '@/hooks/useDelayed';
import { groupByDay } from '@/lib/readings';
import { describeError } from '@/lib/errors';
import { useAppSelector } from '@/redux/store';
import type { Reading, Slot } from '@/types/models';

export default function ReadingsPage() {
  const name = useAppSelector((s) => s.auth.user?.name ?? '');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER);
  const [addState, setAddState] = useState<{ open: boolean; date?: string; slot?: Slot }>({ open: false });
  const [editing, setEditing] = useState<Reading | null>(null);

  const rangeError =
    filter.mode === 'range' && filter.from && filter.to && filter.from > filter.to
      ? '"From" must be on or before "To".'
      : null;

  const queryParams = {
    page,
    limit,
    date: filter.mode === 'date' && filter.date ? filter.date : undefined,
    from: filter.mode === 'range' && filter.from && !rangeError ? filter.from : undefined,
    to: filter.mode === 'range' && filter.to && !rangeError ? filter.to : undefined,
  };

  const q = useReadingsQuery(queryParams);
  const slow = useDelayed(q.isFetching && !q.data);

  const handleFilterChange = (nextFilter: FilterState) => {
    setFilter(nextFilter);
    setPage(1);
  };

  const handleLimitChange = (nextLimit: number) => {
    setLimit(nextLimit);
    setPage(1);
  };

  const all = useMemo(() => q.data?.data ?? q.data?.readings ?? [], [q.data]);
  const pagination = q.data?.pagination;
  const linked = q.data?.linked ?? [];
  const total = pagination?.total ?? all.length;

  const groups = useMemo(() => groupByDay(all), [all]);
  const firstName = name.trim().split(/\s+/)[0] ?? '';

  return (
    <AppShell>
      <div className="page">
        <header className="page-head">
          <button className="btn btn-primary btn-add" onClick={() => setAddState({ open: true })} data-testid="button-add-reading">
            <Plus size={17} aria-hidden /> Add reading
          </button>
          <div className="page-title-wrap">
            <p className="eyebrow">Hello{firstName ? `, ${firstName}` : ''}</p>
            <h1 className="page-title">Your readings</h1>
          </div>
        </header>

        <section className="journal" aria-labelledby="journal-title">
          <div className="journal-head">
            <h2 id="journal-title" className="section-title">Journal</h2>
            <span className="count-pill" data-testid="text-readings-count">
              {total} {total === 1 ? 'reading' : 'readings'}
            </span>
          </div>
          <ReadingsFilters value={filter} onChange={handleFilterChange} rangeError={rangeError} />

          {q.isError && !q.data ? (
            <Notice
              tone="error"
              testId="error-readings"
              action={
                <button className="btn btn-ghost btn-sm" onClick={() => q.refetch()} data-testid="button-retry-readings">
                  <RotateCw size={14} aria-hidden /> Retry
                </button>
              }
            >
              {describeError(q.error)}
            </Notice>
          ) : !q.data ? (
            <>
              <ReadingsTableSkeleton />
              <SlowNotice show={slow} />
            </>
          ) : total === 0 ? (
            <div className="empty" data-testid="status-empty-readings">
              <div className="empty-art" aria-hidden><span /><span /><span /><span /></div>
              <h3>A clean first page</h3>
              <p>Your first number goes here. Fasting, after a meal - whichever moment comes next.</p>
              <button className="btn btn-primary" onClick={() => setAddState({ open: true })} data-testid="button-add-first-reading">
                <Plus size={16} aria-hidden /> Add your first reading
              </button>
            </div>
          ) : groups.length === 0 ? (
            <div className="empty empty-sm" data-testid="status-empty-filter">
              <h3>Nothing logged for these dates</h3>
              <p>Try another day or clear the filter.</p>
              <button className="btn btn-ghost" onClick={() => handleFilterChange(EMPTY_FILTER)} data-testid="button-clear-filters-empty">
                Clear filter
              </button>
            </div>
          ) : (
            <>
              {q.isError && <Notice tone="error" testId="error-readings-refresh">Showing saved data; refresh failed: {describeError(q.error)}</Notice>}
              <ReadingsTable
                groups={groups}
                onAdd={(date, slot) => setAddState({ open: true, date, slot })}
                onEdit={setEditing}
                limit={limit}
                onLimitChange={handleLimitChange}
              />
              <Pagination
                linked={linked}
                onPageChange={setPage}
                pagination={pagination}
                limit={limit}
                onLimitChange={handleLimitChange}
              />
            </>
          )}
        </section>

        <ReportsPanel />
      </div>

      <ReadingFormDialog
        open={addState.open}
        onOpenChange={(o) => setAddState((s) => ({ ...s, open: o }))}
        readings={all}
        initialDate={addState.date}
        initialSlot={addState.slot}
      />
      <EditReadingDialog reading={editing} onClose={() => setEditing(null)} />
    </AppShell>
  );
}
