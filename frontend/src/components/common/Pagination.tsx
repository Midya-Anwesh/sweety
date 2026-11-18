import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationButton, PaginationMeta } from '@/types/api';

interface Props {
  linked: PaginationButton[];
  onPageChange: (page: number) => void;
  pagination?: PaginationMeta;
  limit?: number;
  onLimitChange?: (limit: number) => void;
}

export function Pagination({ linked, onPageChange, pagination, limit, onLimitChange }: Props) {
  if (!linked || linked.length === 0) return null;

  return (
    <nav className="pagination" aria-label="Pagination navigation" data-testid="pagination-nav">
      <div className="pagination-meta-row">
        {pagination && (
          <p className="pagination-info" data-testid="text-pagination-info">
            Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong>
            {pagination.total > 0 && <span className="pagination-total"> ({pagination.total} total)</span>}
          </p>
        )}
        {onLimitChange && (
          <label className="inline-field pagination-limit-control">
            <span>Show:</span>
            <select
              className="input input-sm select-pagination-limit"
              value={limit ?? 20}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              data-testid="select-pagination-limit"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </label>
        )}
      </div>
      <div className="pagination-list" role="list">
        {linked.map((btn, index) => {
          if (btn.type === 'ellipsis' || btn.label === 'ellipces') {
            return (
              <span key={`ellipsis-${index}`} className="pagination-ellipsis" aria-hidden>
                &hellip;
              </span>
            );
          }

          if (btn.type === 'previous') {
            return (
              <button
                key="btn-previous"
                type="button"
                className="btn btn-ghost btn-sm pagination-nav-btn"
                disabled={btn.disabled || !btn.page}
                onClick={() => btn.page && onPageChange(btn.page)}
                aria-label="Previous page"
                data-testid="button-pagination-previous"
              >
                <ChevronLeft size={16} aria-hidden />
                <span>Previous</span>
              </button>
            );
          }

          if (btn.type === 'next') {
            return (
              <button
                key="btn-next"
                type="button"
                className="btn btn-ghost btn-sm pagination-nav-btn"
                disabled={btn.disabled || !btn.page}
                onClick={() => btn.page && onPageChange(btn.page)}
                aria-label="Next page"
                data-testid="button-pagination-next"
              >
                <span>Next</span>
                <ChevronRight size={16} aria-hidden />
              </button>
            );
          }

          const isActive = btn.active;

          return (
            <button
              key={`page-${btn.label}-${index}`}
              type="button"
              className={`pagination-page-btn ${isActive ? 'is-active' : ''}`}
              disabled={btn.disabled || isActive}
              onClick={() => btn.page && onPageChange(btn.page)}
              aria-label={`Page ${btn.label}`}
              aria-current={isActive ? 'page' : undefined}
              data-testid={`button-pagination-page-${btn.label}`}
            >
              {btn.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
