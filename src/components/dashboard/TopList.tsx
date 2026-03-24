'use client';

interface TopListProps {
  data: Record<string, number>;
  title: string;
  max?: number;
}

export default function TopList({ data, title, max = 5 }: TopListProps) {
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, max);

  return (
    <div className="bg-gm-card border border-gm-border rounded-gm p-5">
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      {sorted.length === 0 ? (
        <p className="text-txt-muted text-sm text-center py-4">Aucune donnée</p>
      ) : (
        <div className="space-y-2">
          {sorted.map(([name, count], i) => (
            <div key={name} className="flex items-center gap-3 py-1.5 border-b border-gm-border last:border-0">
              <span className="w-6 h-6 rounded-full bg-accent-light text-accent text-xs font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <span className="flex-1 text-sm text-txt-secondary truncate">{name}</span>
              <span className="font-mono text-sm font-bold text-txt-primary">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
