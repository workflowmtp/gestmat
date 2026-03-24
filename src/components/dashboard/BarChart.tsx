'use client';

const COLORS = ['#f59e0b','#3b82f6','#8b5cf6','#06b6d4','#10b981','#f97316','#ec4899'];

interface BarChartProps {
  data: Record<string, number>;
  title: string;
}

export default function BarChart({ data, title }: BarChartProps) {
  const keys = Object.keys(data);
  const max = Math.max(...keys.map((k) => data[k]), 1);
  if (!keys.length) return <p className="text-txt-muted text-sm text-center py-8">Aucune donnée</p>;

  return (
    <div className="bg-gm-card border border-gm-border rounded-gm p-5">
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      <div className="flex items-end gap-3 h-[180px]">
        {keys.map((k, i) => {
          const pct = Math.round((data[k] / max) * 100);
          return (
            <div key={k} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
              <span className="text-xs font-mono font-bold text-txt-primary">{data[k]}</span>
              <div className="w-full max-w-[48px] rounded-t-md transition-all duration-700"
                style={{ height: pct + '%', minHeight: '4px', background: COLORS[i % COLORS.length] }} />
              <span className="text-[0.65rem] text-txt-muted text-center truncate w-full">{k}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
