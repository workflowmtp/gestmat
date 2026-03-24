'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { StatMini } from '@/components/ui/KpiCard';
import { hasPermission } from '@/lib/permissions';
import { useAppStore } from '@/stores/app-store';
import { formatDateTime } from '@/lib/utils';

const ACTION_BADGES: Record<string, string> = {
  'connexion':'info','deconnexion':'info','creation':'success',
  'modification':'warning','mouvement':'warning','suppression':'danger',
  'archivage':'danger','config':'purple','retour':'cyan','ai':'purple','init':'muted',
};

export default function AuditClient() {
  const router = useRouter();
  const currentUser = useAppStore((s) => s.currentUser);
  const perms = currentUser?.permissions || [];
  const canExport = hasPermission(perms, 'audit.export');

  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionCounts, setActionCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(30);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (search) params.set('search', search);
    if (actionFilter) params.set('action', actionFilter);

    const res = await fetch('/api/audit?' + params.toString());
    const data = await res.json();
    setLogs(data.logs || []);
    setTotal(data.total || 0);
    setActionCounts(data.actionCounts || {});
    setLoading(false);
  }, [page, pageSize, search, actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  function exportCSV() {
    let csv = 'Date;Utilisateur;Action;Détail;ArticleID\n';
    // Fetch all logs for export
    fetch('/api/audit?pageSize=10000').then((r) => r.json()).then((data) => {
      for (const l of (data.logs || [])) {
        csv += [formatDateTime(l.timestamp), l.userName, l.action, l.detail, l.itemId || ''].join(';') + '\n';
      }
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'journal_audit_gestmat.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  const actionKeys = Object.keys(actionCounts).sort((a, b) => (actionCounts[b] || 0) - (actionCounts[a] || 0));

  const columns = [
    { key: 'timestamp', label: 'Date & Heure', width: '160px',
      render: (r: any) => <span className="font-mono text-xs whitespace-nowrap">{formatDateTime(r.timestamp)}</span> },
    { key: 'userName', label: 'Utilisateur', width: '140px',
      render: (r: any) => <span className="text-sm text-accent">{r.userName || 'Système'}</span> },
    { key: 'action', label: 'Action', width: '130px',
      render: (r: any) => <Badge variant={(ACTION_BADGES[r.action] || 'muted') as any}>{r.action}</Badge> },
    { key: 'detail', label: 'Détail',
      render: (r: any) => <span className="text-sm text-txt-secondary">{r.detail}</span> },
    { key: 'itemId', label: 'Article', width: '80px',
      render: (r: any) => r.itemId ? (
        <button onClick={() => router.push('/inventory/' + r.itemId)} className="text-xs text-accent hover:underline">Voir</button>
      ) : <span className="text-txt-muted">-</span>
    },
  ];

  return (
    <div>
      {/* Stats */}
      <div className="flex flex-wrap gap-3 mb-5">
        <StatMini icon="📊" value={total} label="Total entrées" color="#f59e0b" />
        {actionKeys.slice(0, 5).map((k) => (
          <StatMini key={k} icon="📋" value={actionCounts[k]} label={k} color="#3b82f6" />
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted text-sm">🔍</span>
          <input type="text" placeholder="Rechercher dans le journal..." className="gm-input pl-9 py-2 text-sm"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="gm-input w-auto py-2 text-sm" value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}>
          <option value="">Toutes actions</option>
          {actionKeys.map((k) => <option key={k} value={k}>{k} ({actionCounts[k]})</option>)}
        </select>
        <div className="flex-1" />
        {canExport && <Button variant="secondary" size="sm" onClick={exportCSV}>💾 Export CSV</Button>}
      </div>

      {/* Table */}
      <DataTable
        columns={columns} data={logs} total={total}
        page={page} pageSize={pageSize} sortCol="timestamp" sortDir="desc"
        onSort={() => {}} onPageChange={setPage} loading={loading} />
    </div>
  );
}
