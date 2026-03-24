'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { StatMini } from '@/components/ui/KpiCard';
import { useAppStore } from '@/stores/app-store';
import { hasPermission } from '@/lib/permissions';
import { formatDateTime, getMovementColor, MOVEMENT_TYPES } from '@/lib/utils';
import MovementForm from './MovementForm';
import QuickReturnBar from './QuickReturnBar';

export default function MovementsClient() {
  const router = useRouter();
  const { showToast, openModal, closeModal, currentUser } = useAppStore();
  const perms = currentUser?.permissions || [];
  const canCreate = hasPermission(perms, 'movements.create');
  const canQuickReturn = hasPermission(perms, 'movements.quick_return');

  const [movements, setMovements] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [sortCol, setSortCol] = useState('timestamp');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Items needing return (for quick return bar)
  const [overdueItems, setOverdueItems] = useState<any[]>([]);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (search) params.set('search', search);
    if (typeFilter) params.set('type', typeFilter);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);

    const res = await fetch('/api/movements?' + params.toString());
    const data = await res.json();
    setMovements(data.movements || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, pageSize, search, typeFilter, dateFrom, dateTo]);

  // Fetch overdue items
  useEffect(() => {
    fetch('/api/items?pageSize=9999').then((r) => r.json()).then((data) => {
      const items = (data.items || []).filter((it: any) => {
        if (!it.returnDate) return false;
        return new Date(it.returnDate) < new Date();
      });
      setOverdueItems(items);
    });
  }, []);

  useEffect(() => { fetchMovements(); }, [fetchMovements]);

  function handleSort(col: string) {
    if (sortCol === col) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
    setPage(1);
  }

  function openNewMovement() {
    openModal({
      title: 'Nouveau mouvement',
      body: <MovementForm onSuccess={() => { closeModal(); fetchMovements(); showToast('Mouvement enregistré', 'success'); }} />,
    });
  }

  async function doQuickReturn(itemId: string) {
    const res = await fetch('/api/movements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, type: 'retour', reason: 'Retour rapide' }),
    });
    if (res.ok) {
      showToast('Retour enregistré', 'success');
      fetchMovements();
      setOverdueItems((prev) => prev.filter((i) => i.id !== itemId));
    } else {
      const err = await res.json();
      showToast(err.error || 'Erreur', 'error');
    }
  }

  // Stats
  const typeCounts: Record<string, number> = {};
  movements.forEach((m) => { typeCounts[m.type] = (typeCounts[m.type] || 0) + 1; });

  const columns = [
    { key: 'timestamp', label: 'Date', sortable: true, width: '140px',
      render: (r: any) => <span className="font-mono text-xs">{formatDateTime(r.timestamp)}</span> },
    { key: 'type', label: 'Type', width: '140px',
      render: (r: any) => <Badge variant={getMovementColor(r.type) as any}>{r.type}</Badge> },
    { key: 'item', label: 'Article', render: (r: any) => (
      <div>
        <span className="font-mono text-accent text-xs">{r.item?.code}</span>
        <div className="text-xs text-txt-secondary truncate max-w-[200px]">{r.item?.designation}</div>
      </div>
    )},
    { key: 'origin', label: 'Origine', width: '130px',
      render: (r: any) => <span className="text-xs">{r.origin || '-'}</span> },
    { key: 'destination', label: 'Destination', width: '130px',
      render: (r: any) => <span className="text-xs">{r.destination || '-'}</span> },
    { key: 'qty', label: 'Qté', width: '60px',
      render: (r: any) => <span className="font-mono">{r.qty}</span> },
    { key: 'user', label: 'Par', width: '120px',
      render: (r: any) => <span className="text-xs text-accent">{r.user?.fullname}</span> },
    { key: 'beneficiary', label: 'Bénéficiaire', width: '120px',
      render: (r: any) => <span className="text-xs">{r.beneficiary || '-'}</span> },
    { key: 'reason', label: 'Motif', width: '120px',
      render: (r: any) => <span className="text-xs text-txt-muted truncate block max-w-[120px]">{r.reason || '-'}</span> },
  ];

  return (
    <div>
      {/* Quick return bar */}
      {canQuickReturn && overdueItems.length > 0 && (
        <QuickReturnBar items={overdueItems} onReturn={doQuickReturn} />
      )}

      {/* Stats */}
      <div className="flex flex-wrap gap-3 mb-5">
        <StatMini icon="📊" value={total} label="Total mouvements" color="#f59e0b" />
        {Object.entries(typeCounts).slice(0, 5).map(([type, count]) => (
          <StatMini key={type} icon="📋" value={count} label={type} color="#3b82f6" />
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted text-sm">🔍</span>
          <input type="text" placeholder="Rechercher..." className="gm-input pl-9 py-2 text-sm"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="gm-input w-auto py-2 text-sm" value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="">Tous types</option>
          {MOVEMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input type="date" className="gm-input w-auto py-2 text-sm" value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} title="Date début" />
        <input type="date" className="gm-input w-auto py-2 text-sm" value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }} title="Date fin" />
        <div className="flex-1" />
        {canCreate && <Button onClick={openNewMovement}>+ Nouveau mouvement</Button>}
      </div>

      {/* Table */}
      <DataTable
        columns={columns} data={movements} total={total}
        page={page} pageSize={pageSize} sortCol={sortCol} sortDir={sortDir}
        onSort={handleSort} onPageChange={setPage} loading={loading} />
    </div>
  );
}
