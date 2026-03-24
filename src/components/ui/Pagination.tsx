'use client';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-xs text-txt-secondary">
      <span>{total} résultat(s) — Page {page}/{totalPages}</span>
      <div className="flex gap-1">
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}
          className="px-2.5 py-1.5 rounded-gm-sm border border-gm-border hover:border-accent disabled:opacity-30 transition-all">‹</button>
        <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}
          className="px-2.5 py-1.5 rounded-gm-sm border border-gm-border hover:border-accent disabled:opacity-30 transition-all">›</button>
      </div>
    </div>
  );
}
