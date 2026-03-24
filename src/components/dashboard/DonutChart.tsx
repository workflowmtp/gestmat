'use client';

const COLORS = ['#f59e0b','#10b981','#3b82f6','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899','#6b7280','#84cc16'];

interface DonutProps {
  data: Record<string, number>;
  title: string;
}

export default function DonutChart({ data, title }: DonutProps) {
  const keys = Object.keys(data);
  const total = keys.reduce((s, k) => s + data[k], 0);
  if (!total) return <p className="text-txt-muted text-sm text-center py-8">Aucune donnée</p>;

  const r = 52, cx = 70, cy = 70, circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="bg-gm-card border border-gm-border rounded-gm p-5">
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      <div className="flex items-center gap-6">
        <svg viewBox="0 0 140 140" className="w-[140px] h-[140px] flex-shrink-0">
          {keys.map((k, i) => {
            const pct = data[k] / total;
            const dashLen = pct * circ;
            const el = (
              <circle key={k} cx={cx} cy={cy} r={r} fill="none"
                stroke={COLORS[i % COLORS.length]} strokeWidth="16"
                strokeDasharray={dashLen + ' ' + (circ - dashLen)}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${cx} ${cy})`} />
            );
            offset += dashLen;
            return el;
          })}
          <text x={cx} y={cy} textAnchor="middle" dy="0.35em"
            fontSize="18" fontWeight="700" fill="var(--tw-text-opacity,1)"
            className="fill-txt-primary font-mono">{total}</text>
        </svg>
        <div className="flex-1 space-y-1.5">
          {keys.map((k, i) => (
            <div key={k} className="flex items-center gap-2 text-sm">
              <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-txt-secondary flex-1 truncate">{k}</span>
              <strong className="text-txt-primary font-mono">{data[k]}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
