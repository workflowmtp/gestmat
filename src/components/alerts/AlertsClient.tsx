'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { hasPermission } from '@/lib/permissions';
import { useAppStore } from '@/stores/app-store';

const MODULE_LABELS: Record<string, string> = {
  movements: '⇄ Mouvements', controls: '🔧 Contrôles', inventory: '📦 Inventaire',
  dotations: '🦺 Dotations', campaigns: '📋 Inventaires',
};

export default function AlertsClient() {
  const router = useRouter();
  const currentUser = useAppStore((s) => s.currentUser);
  const perms = currentUser?.permissions || [];
  const canPrint = hasPermission(perms, 'alerts.print');

  const [alerts, setAlerts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [byModule, setByModule] = useState<Record<string, number>>({});
  const [bySeverity, setBySeverity] = useState<Record<number, number>>({});
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  async function fetchAlerts() {
    const params = new URLSearchParams();
    if (filter) params.set('category', filter);
    const res = await fetch('/api/alerts?' + params.toString());
    const data = await res.json();
    setAlerts(data.alerts || []);
    setTotal(data.total || 0);
    setByModule(data.byModule || {});
    setBySeverity(data.bySeverity || {});
    setLoading(false);
  }

  useEffect(() => { fetchAlerts(); }, [filter]);

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      {/* Stats row */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="bg-gm-card border border-gm-border rounded-gm-sm px-5 py-3 flex items-center gap-3">
          <span className="text-2xl">⚠</span>
          <div><div className="font-mono text-2xl font-bold text-accent">{total}</div><div className="text-xs text-txt-secondary">Alertes actives</div></div>
        </div>
        <div className="bg-danger-bg border border-danger/30 rounded-gm-sm px-5 py-3 flex items-center gap-3">
          <span className="text-xl">🔴</span>
          <div><div className="font-mono text-xl font-bold text-danger">{bySeverity[3] || 0}</div><div className="text-xs text-txt-secondary">Critiques</div></div>
        </div>
        <div className="bg-warning-bg border border-warning/30 rounded-gm-sm px-5 py-3 flex items-center gap-3">
          <span className="text-xl">🟡</span>
          <div><div className="font-mono text-xl font-bold text-warning">{bySeverity[2] || 0}</div><div className="text-xs text-txt-secondary">Warnings</div></div>
        </div>
        <div className="bg-info-bg border border-info/30 rounded-gm-sm px-5 py-3 flex items-center gap-3">
          <span className="text-xl">🔵</span>
          <div><div className="font-mono text-xl font-bold text-info">{bySeverity[1] || 0}</div><div className="text-xs text-txt-secondary">Info</div></div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => setFilter('')}
          className={`px-3.5 py-2 rounded-gm-sm text-xs font-semibold border transition-all ${!filter ? 'bg-accent text-white border-accent' : 'bg-gm-input text-txt-secondary border-gm-border hover:border-txt-muted'}`}>
          Toutes ({total})
        </button>
        {Object.entries(byModule).map(([mod, count]) => (
          <button key={mod} onClick={() => setFilter(mod === filter ? '' : mod)}
            className={`px-3.5 py-2 rounded-gm-sm text-xs font-semibold border transition-all ${filter === mod ? 'bg-accent text-white border-accent' : 'bg-gm-input text-txt-secondary border-gm-border hover:border-txt-muted'}`}>
            {MODULE_LABELS[mod] || mod} ({count})
          </button>
        ))}
        <div className="flex-1" />
        {canPrint && <Button variant="secondary" size="sm" onClick={() => window.print()}>🖨 Imprimer</Button>}
      </div>

      {/* Alert cards */}
      {alerts.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4 opacity-50">✅</div>
          <h4 className="text-lg text-txt-secondary">Aucune alerte</h4>
          <p className="text-sm text-txt-muted">Tout est en ordre !</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div key={a.id}
              className={`flex items-center gap-3 p-4 rounded-gm border cursor-pointer transition-all hover:border-gm-border-l ${
                a.severity === 3 ? 'border-danger/30 bg-danger-bg' :
                a.severity === 2 ? 'border-warning/30 bg-warning-bg' :
                'border-info/30 bg-info-bg'
              }`}
              onClick={() => {
                if (a.itemId) router.push('/inventory/' + a.itemId);
                else router.push('/' + a.module);
              }}>
              <span className="text-xl flex-shrink-0">{a.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-sm">{a.title}</span>
                  <Badge variant={a.severity === 3 ? 'danger' : a.severity === 2 ? 'warning' : 'info'}>
                    {a.severity === 3 ? 'Critique' : a.severity === 2 ? 'Warning' : 'Info'}
                  </Badge>
                  <span className="text-[0.65rem] text-txt-muted uppercase">{MODULE_LABELS[a.module] || a.module}</span>
                </div>
                <p className="text-sm text-txt-secondary">{a.text}</p>
              </div>
              {a.itemCode && <span className="font-mono text-xs text-accent flex-shrink-0">{a.itemCode}</span>}
              <span className="text-txt-muted text-xs">→</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
