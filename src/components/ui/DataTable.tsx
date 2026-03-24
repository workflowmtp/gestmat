'use client';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  total: number;
  page: number;
  pageSize: number;
  sortCol: string;
  sortDir: 'asc' | 'desc';
  onSort: (col: string) => void;
  onPageChange: (page: number) => void;
  onRowClick?: (row: any) => void;
  loading?: boolean;
}

export default function DataTable({
  columns, data, total, page, pageSize, sortCol, sortDir,
  onSort, onPageChange, onRowClick, loading,
}: DataTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="bg-gm-card border border-gm-border rounded-gm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gm-border">
              {columns.map((col) => (
                <th key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-txt-label uppercase tracking-wide ${col.sortable ? 'cursor-pointer hover:text-accent select-none' : ''}`}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => col.sortable && onSort(col.key)}>
                  {col.label}
                  {col.sortable && sortCol === col.key && (
                    <span className="ml-1 text-accent">{sortDir === 'asc' ? '▲' : '▼'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length} className="text-center py-12 text-txt-muted">
                <div className="inline-block w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={columns.length} className="text-center py-12 text-txt-muted">Aucun résultat</td></tr>
            ) : data.map((row, i) => (
              <tr key={row.id || i}
                className={`border-b border-gm-border transition-colors ${onRowClick ? 'cursor-pointer hover:bg-gm-card-h' : ''}`}
                onClick={() => onRowClick?.(row)}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    {col.render ? col.render(row) : row[col.key] ?? '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gm-border text-xs text-txt-secondary">
        <span>{total} résultat(s) — Page {page}/{totalPages}</span>
        <div className="flex gap-1">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="px-2.5 py-1.5 rounded-gm-sm border border-gm-border hover:border-accent disabled:opacity-30 transition-all">
            ‹
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let p: number;
            if (totalPages <= 7) p = i + 1;
            else if (page <= 4) p = i + 1;
            else if (page >= totalPages - 3) p = totalPages - 6 + i;
            else p = page - 3 + i;
            return (
              <button key={p} onClick={() => onPageChange(p)}
                className={`px-2.5 py-1.5 rounded-gm-sm border transition-all ${p === page ? 'bg-accent text-white border-accent' : 'border-gm-border hover:border-accent'}`}>
                {p}
              </button>
            );
          })}
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="px-2.5 py-1.5 rounded-gm-sm border border-gm-border hover:border-accent disabled:opacity-30 transition-all">
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
