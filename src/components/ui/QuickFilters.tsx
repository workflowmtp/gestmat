'use client';

interface Filter {
  key: string;
  label: string;
  count: number;
  color?: string;
}

interface QuickFiltersProps {
  filters: Filter[];
  active: string;
  onChange: (key: string) => void;
}

export default function QuickFilters({ filters, active, onChange }: QuickFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {filters.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key === active ? '' : f.key)}
          className={`
            inline-flex items-center gap-1.5 px-3.5 py-2 rounded-gm-sm text-xs font-semibold
            border transition-all
            ${f.key === active
              ? 'bg-accent text-white border-accent'
              : 'bg-gm-input text-txt-secondary border-gm-border hover:border-txt-muted hover:text-txt-primary'
            }
          `}>
          {f.label}
          <span className={`
            inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-lg text-[10px] font-bold
            ${f.key === active ? 'bg-white/20 text-white' : 'bg-gm-card text-txt-muted'}
          `}>{f.count}</span>
        </button>
      ))}
    </div>
  );
}
