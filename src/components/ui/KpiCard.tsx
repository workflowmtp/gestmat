// EmptyState
export function EmptyState({ icon, title, description, children }: {
  icon: string; title: string; description?: string; children?: React.ReactNode;
}) {
  return (
    <div className="text-center py-16 px-5 text-txt-muted">
      <div className="text-5xl mb-4 opacity-50">{icon}</div>
      <h4 className="text-lg text-txt-secondary mb-2">{title}</h4>
      {description && <p className="text-sm max-w-[400px] mx-auto">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

// KpiCard
export function KpiCard({ label, value, icon, color, bgColor, percentage, isText }: {
  label: string; value: string | number; icon: string;
  color: string; bgColor: string; percentage: number; isText?: boolean;
}) {
  return (
    <div className="bg-gm-card border border-gm-border rounded-gm p-5 transition-all hover:border-gm-border-l hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-lg"
          style={{ background: bgColor, color }}>
          {icon}
        </div>
        {!isText && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-xl" style={{ background: bgColor, color }}>
            {percentage}%
          </span>
        )}
      </div>
      <div className="text-3xl font-bold font-mono leading-tight mb-1">{value}</div>
      <div className="text-sm text-txt-secondary">{label}</div>
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gm-border">
        <div className="h-full rounded-r transition-all duration-700" style={{ width: percentage + '%', background: color }} />
      </div>
    </div>
  );
}

// StatMini (for movement/audit pages)
export function StatMini({ icon, value, label, color }: {
  icon: string; value: number | string; label: string; color?: string;
}) {
  return (
    <div className="bg-gm-card border border-gm-border rounded-gm-sm px-4 py-3 flex items-center gap-2.5">
      <span className="text-xl">{icon}</span>
      <div>
        <div className="font-mono text-xl font-bold" style={color ? { color } : undefined}>{value}</div>
        <div className="text-xs text-txt-secondary">{label}</div>
      </div>
    </div>
  );
}
