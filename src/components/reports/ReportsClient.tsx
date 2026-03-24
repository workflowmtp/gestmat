'use client';

import { useState, useEffect } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { hasPermission } from '@/lib/permissions';
import { useAppStore } from '@/stores/app-store';
import { formatNumber, formatDate } from '@/lib/utils';

const REPORT_TYPES = [
  { key: 'by-family', icon: '🏷', title: 'Par famille', desc: 'Articles et valorisation par famille' },
  { key: 'by-location', icon: '🏗', title: 'Par chantier', desc: 'Répartition par localisation' },
  { key: 'by-user', icon: '👤', title: 'Par utilisateur', desc: 'Articles par responsable' },
  { key: 'overdue', icon: '⏰', title: 'Retards de retour', desc: 'Articles en dépassement' },
  { key: 'end-of-life', icon: '⚠', title: 'Fin de vie', desc: 'Articles en fin de vie ou proches' },
  { key: 'epi', icon: '🦺', title: 'Dotations EPI', desc: 'Suivi des dotations par employé' },
  { key: 'valuation', icon: '💰', title: 'Valorisation', desc: 'Valeur du stock par type' },
  { key: 'alerts', icon: '🔔', title: 'Alertes', desc: 'Rapport complet des alertes actives' },
];

const EXPORT_FORMATS = [
  { key: 'items-csv', label: 'Inventaire CSV', icon: '📦' },
  { key: 'movements-csv', label: 'Mouvements CSV', icon: '⇄' },
  { key: 'dotations-csv', label: 'Dotations CSV', icon: '🦺' },
  { key: 'full-json', label: 'Backup JSON', icon: '💾', perm: 'reports.backup' },
];

export default function ReportsClient() {
  const currentUser = useAppStore((s) => s.currentUser);
  const perms = currentUser?.permissions || [];
  const canExport = hasPermission(perms, 'reports.export');
  const canViewCost = hasPermission(perms, 'items.view_cost');

  const [activeReport, setActiveReport] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function loadReport(type: string) {
    setActiveReport(type);
    setLoading(true);
    const res = await fetch('/api/reports/' + type);
    const data = await res.json();
    setReportData(data);
    setLoading(false);
  }

  function doExport(format: string) {
    window.open('/api/export/' + format, '_blank');
  }

  return (
    <div>
      {/* Report grid */}
      {!activeReport && (
        <>
          <h3 className="text-sm font-semibold text-txt-secondary mb-4">Rapports métier</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {REPORT_TYPES.map((r) => (
              <div key={r.key} onClick={() => loadReport(r.key)}
                className="bg-gm-card border border-gm-border rounded-gm p-5 cursor-pointer hover:border-accent hover:-translate-y-0.5 transition-all text-center">
                <div className="text-3xl mb-2">{r.icon}</div>
                <h4 className="font-semibold text-sm mb-1">{r.title}</h4>
                <p className="text-xs text-txt-muted">{r.desc}</p>
              </div>
            ))}
          </div>

          {/* Export section */}
          {canExport && (
            <>
              <h3 className="text-sm font-semibold text-txt-secondary mb-4">Exports de données</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {EXPORT_FORMATS.filter((e) => !e.perm || hasPermission(perms, e.perm)).map((e) => (
                  <div key={e.key} onClick={() => doExport(e.key)}
                    className="bg-gm-card border border-gm-border rounded-gm p-5 cursor-pointer hover:border-success hover:-translate-y-0.5 transition-all text-center">
                    <div className="text-3xl mb-2">{e.icon}</div>
                    <h4 className="font-semibold text-sm">{e.label}</h4>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Active report view */}
      {activeReport && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <Button variant="secondary" size="sm" onClick={() => { setActiveReport(''); setReportData(null); }}>← Retour</Button>
            <h3 className="text-lg font-semibold flex-1">{reportData?.title || 'Rapport'}</h3>
            <Button variant="secondary" size="sm" onClick={() => window.print()}>🖨 Imprimer</Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
          ) : reportData?.report ? (
            <ReportContent type={activeReport} data={reportData} canViewCost={canViewCost} />
          ) : (
            <div className="text-center py-12 text-txt-muted">Aucune donnée</div>
          )}
        </div>
      )}
    </div>
  );
}

function ReportContent({ type, data, canViewCost }: { type: string; data: any; canViewCost: boolean }) {
  const report = data.report;

  if (['by-family', 'by-location', 'by-user'].includes(type)) {
    const entries = Object.entries(report) as [string, any][];
    entries.sort((a, b) => b[1].count - a[1].count);
    return (
      <div className="bg-gm-card border border-gm-border rounded-gm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gm-border">
            <th className="px-4 py-3 text-left text-xs font-semibold text-txt-label uppercase">Nom</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-txt-label uppercase w-[100px]">Articles</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-txt-label uppercase w-[140px]">Valeur</th>
          </tr></thead>
          <tbody>
            {entries.map(([name, vals]) => (
              <tr key={name} className="border-b border-gm-border hover:bg-gm-card-h">
                <td className="px-4 py-3 font-medium">{name}</td>
                <td className="px-4 py-3 text-center font-mono text-accent">{vals.count}</td>
                <td className="px-4 py-3 text-right font-mono text-xs">{canViewCost ? formatNumber(Math.round(vals.value)) + ' FCFA' : '•••'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr className="bg-gm-input">
            <td className="px-4 py-3 font-bold">Total</td>
            <td className="px-4 py-3 text-center font-mono font-bold">{entries.reduce((s, [, v]) => s + v.count, 0)}</td>
            <td className="px-4 py-3 text-right font-mono font-bold">{canViewCost ? formatNumber(Math.round(entries.reduce((s, [, v]) => s + v.value, 0))) + ' FCFA' : '•••'}</td>
          </tr></tfoot>
        </table>
      </div>
    );
  }

  if (type === 'overdue') {
    return (
      <div className="bg-gm-card border border-gm-border rounded-gm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gm-border">
            <th className="px-4 py-3 text-left text-xs font-semibold text-txt-label uppercase">Code</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-txt-label uppercase">Désignation</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-txt-label uppercase">Responsable</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-txt-label uppercase">Retard</th>
          </tr></thead>
          <tbody>
            {(report as any[]).map((it) => (
              <tr key={it.id} className="border-b border-gm-border">
                <td className="px-4 py-3 font-mono text-accent text-xs">{it.code}</td>
                <td className="px-4 py-3">{it.designation}</td>
                <td className="px-4 py-3 text-txt-secondary text-xs">{it.responsible || '-'}</td>
                <td className="px-4 py-3 text-center font-mono text-danger font-bold">{it.daysOverdue}j</td>
              </tr>
            ))}
            {!(report as any[]).length && <tr><td colSpan={4} className="text-center py-8 text-txt-muted">Aucun retard !</td></tr>}
          </tbody>
        </table>
      </div>
    );
  }

  if (type === 'valuation') {
    const entries = Object.entries(report) as [string, any][];
    return (
      <div className="bg-gm-card border border-gm-border rounded-gm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gm-border">
            <th className="px-4 py-3 text-left text-xs font-semibold text-txt-label uppercase">Type</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-txt-label uppercase">Réf.</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-txt-label uppercase">Qté totale</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-txt-label uppercase">Valeur</th>
          </tr></thead>
          <tbody>
            {entries.map(([name, vals]) => (
              <tr key={name} className="border-b border-gm-border">
                <td className="px-4 py-3 font-medium">{name}</td>
                <td className="px-4 py-3 text-center font-mono">{vals.count}</td>
                <td className="px-4 py-3 text-center font-mono">{vals.totalQty}</td>
                <td className="px-4 py-3 text-right font-mono">{canViewCost ? formatNumber(Math.round(vals.totalValue)) + ' FCFA' : '•••'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr className="bg-gm-input">
            <td className="px-4 py-3 font-bold" colSpan={3}>Grand total</td>
            <td className="px-4 py-3 text-right font-mono font-bold text-accent">{canViewCost ? formatNumber(Math.round(data.grandTotal)) + ' FCFA' : '•••'}</td>
          </tr></tfoot>
        </table>
      </div>
    );
  }

  // Fallback: JSON display
  return <pre className="bg-gm-input p-4 rounded-gm text-xs overflow-auto max-h-[500px]">{JSON.stringify(report, null, 2)}</pre>;
}
