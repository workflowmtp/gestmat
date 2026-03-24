'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DataTable from '@/components/ui/DataTable';
import QuickFilters from '@/components/ui/QuickFilters';
import Badge, { StatusBadge, StateBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { hasPermission } from '@/lib/permissions';
import { useAppStore } from '@/stores/app-store';
import { formatNumber, formatCurrency, computeItemStatus } from '@/lib/utils';

export default function InventoryClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUser = useAppStore((s) => s.currentUser);
  const perms = currentUser?.permissions || [];
  const canCreate = hasPermission(perms, 'items.create');
  const canViewCost = hasPermission(perms, 'items.view_cost');

  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [typeFilter, setTypeFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [familyFilter, setFamilyFilter] = useState('');
  const [quickFilter, setQuickFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [sortCol, setSortCol] = useState('code');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Quick filter counts
  const [counts, setCounts] = useState<Record<string, number>>({});

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    params.set('sortCol', sortCol);
    params.set('sortDir', sortDir);
    if (search) params.set('search', search);
    if (typeFilter) params.set('type', typeFilter);
    if (stateFilter) params.set('state', stateFilter);
    if (familyFilter) params.set('family', familyFilter);

    try {
      const res = await fetch('/api/items?' + params.toString());
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch { setItems([]); }
    setLoading(false);
  }, [page, pageSize, sortCol, sortDir, search, typeFilter, stateFilter, familyFilter]);

  // Fetch quick filter counts
  useEffect(() => {
    fetch('/api/items?pageSize=9999').then((r) => r.json()).then((data) => {
      const all = data.items || [];
      const c: Record<string, number> = { all: all.length };
      for (const it of all) {
        const st = computeItemStatus({
          state: it.state,
          returnDate: it.returnDate,
          purchaseDate: it.purchaseDate,
          serviceDate: it.serviceDate,
          lifespanDays: it.lifespanDays,
          lifespanAlertDays: it.lifespanAlertDays,
          nextControlDate: it.nextControlDate,
          location: it.location,
          qtyAvailable: it.qtyAvailable,
          qty: it.qty,
        });
        c[st] = (c[st] || 0) + 1;
        const typeName = it.type?.name;
        if (typeName) c['type_' + typeName] = (c['type_' + typeName] || 0) + 1;
      }
      setCounts(c);
    });
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  function handleSort(col: string) {
    if (sortCol === col) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
    setPage(1);
  }

  function handleSearch(v: string) {
    setSearch(v);
    setPage(1);
  }

  const quickFilters = [
    { key: '', label: 'Tous', count: counts.all || 0 },
    { key: 'disponible', label: 'Disponibles', count: counts['disponible'] || 0 },
    { key: 'affecté', label: 'Affectés', count: (counts['affecté'] || 0) + (counts['en prêt'] || 0) },
    { key: 'en retard', label: 'En retard', count: counts['en retard'] || 0 },
    { key: 'en fin de vie', label: 'Fin de vie', count: counts['en fin de vie'] || 0 },
    { key: 'à inspection', label: 'À inspecter', count: counts['à inspection'] || 0 },
    { key: 'hors service', label: 'Hors service', count: counts['hors service'] || 0 },
    { key: 'perdu / volé', label: 'Perdus', count: counts['perdu / volé'] || 0 },
    { key: 'type_Outillage', label: 'Outillage', count: counts['type_Outillage'] || 0 },
    { key: 'type_EPI', label: 'EPI', count: counts['type_EPI'] || 0 },
  ];

  const columns = [
    { key: 'code', label: 'Code', sortable: true, width: '120px',
      render: (r: any) => <span className="font-mono text-accent font-semibold">{r.code}</span> },
    { key: 'designation', label: 'Désignation', sortable: true,
      render: (r: any) => (
        <div>
          <div className="font-medium text-txt-primary">{r.designation}</div>
          {r.brand && <span className="text-xs text-txt-muted">{r.brand} {r.model || ''}</span>}
        </div>
      ) },
    { key: 'type', label: 'Type', width: '100px',
      render: (r: any) => <Badge variant={r.type?.name === 'EPI' ? 'purple' : 'info'}>{r.type?.name}</Badge> },
    { key: 'state', label: 'État', sortable: true, width: '110px',
      render: (r: any) => <StateBadge state={r.state} /> },
    { key: 'status', label: 'Statut', width: '120px',
      render: (r: any) => {
        const st = computeItemStatus({
          state: r.state, returnDate: r.returnDate, purchaseDate: r.purchaseDate,
          serviceDate: r.serviceDate, lifespanDays: r.lifespanDays,
          lifespanAlertDays: r.lifespanAlertDays, nextControlDate: r.nextControlDate,
          location: r.location, qtyAvailable: r.qtyAvailable, qty: r.qty,
        });
        return <StatusBadge status={st} />;
      } },
    { key: 'qty', label: 'Qté', sortable: true, width: '70px',
      render: (r: any) => <span className="font-mono">{r.qtyAvailable ?? r.qty}/{r.qty}</span> },
    { key: 'unitCost', label: 'Coût', sortable: true, width: '100px',
      render: (r: any) => canViewCost
        ? <span className="font-mono text-xs">{formatNumber(r.unitCost || 0)}</span>
        : <span className="text-txt-muted">•••</span> },
    { key: 'location', label: 'Localisation', width: '140px',
      render: (r: any) => <span className="text-xs">{r.location?.name || '-'}</span> },
    { key: 'responsible', label: 'Responsable', width: '120px',
      render: (r: any) => <span className="text-xs text-txt-secondary">{r.responsible || '-'}</span> },
  ];

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-[360px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted text-sm">🔍</span>
          <input type="text" placeholder="Rechercher code, désignation, marque, série..."
            className="gm-input pl-9 py-2 text-sm" value={search}
            onChange={(e) => handleSearch(e.target.value)} />
        </div>
        <select className="gm-input w-auto py-2 text-sm" value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="">Tous types</option>
          <option value="Outillage">Outillage</option>
          <option value="EPI">EPI</option>
          <option value="Consommable traçable">Consommable</option>
          <option value="Accessoire">Accessoire</option>
        </select>
        <select className="gm-input w-auto py-2 text-sm" value={stateFilter}
          onChange={(e) => { setStateFilter(e.target.value); setPage(1); }}>
          <option value="">Tous états</option>
          {['neuf','bon','moyen','usé','à contrôler','à réparer','hors service'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div className="flex-1" />
        {canCreate && (
          <Button onClick={() => router.push('/inventory/new')}>+ Nouvel article</Button>
        )}
      </div>

      {/* Quick filters */}
      <QuickFilters filters={quickFilters} active={quickFilter}
        onChange={(k) => {
          setQuickFilter(k);
          // Apply quick filter as state filter or type filter
          if (k.startsWith('type_')) { setTypeFilter(k.replace('type_','')); setStateFilter(''); }
          else if (k) {
            // Use state filter for matching states
            const stateMap: Record<string, string> = {
              'disponible':'bon','en retard':'','en fin de vie':'','hors service':'hors service',
              'perdu / volé':'perdu','à inspection':'à contrôler','affecté':'',
            };
            if (stateMap[k] !== undefined) { setStateFilter(stateMap[k]); setTypeFilter(''); }
          } else { setStateFilter(''); setTypeFilter(''); }
          setPage(1);
        }} />

      {/* Table */}
      <DataTable
        columns={columns} data={items} total={total}
        page={page} pageSize={pageSize} sortCol={sortCol} sortDir={sortDir}
        onSort={handleSort} onPageChange={setPage}
        onRowClick={(row) => router.push('/inventory/' + row.id)}
        loading={loading} />
    </div>
  );
}
