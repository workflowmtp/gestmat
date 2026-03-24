'use client';

import { useState, useEffect } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/DataTable';
import { useAppStore } from '@/stores/app-store';
import { hasPermission } from '@/lib/permissions';
import { formatDate, daysFromNow, INSPECTION_TYPES } from '@/lib/utils';

export default function ControlsClient() {
  const { showToast, openModal, closeModal, currentUser } = useAppStore();
  const perms = currentUser?.permissions || [];
  const canCreate = hasPermission(perms, 'controls.create');

  const [tab, setTab] = useState('planned');
  const [planned, setPlanned] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  async function fetchPlanned() {
    const res = await fetch('/api/inspections?tab=planned');
    const data = await res.json();
    setPlanned(data.planned || []);
  }

  async function fetchHistory() {
    const res = await fetch('/api/inspections?tab=history&page=' + page + '&pageSize=20');
    const data = await res.json();
    setInspections(data.inspections || []);
    setTotal(data.total || 0);
  }

  useEffect(() => { fetchPlanned().then(() => setLoading(false)); }, []);
  useEffect(() => { if (tab === 'history') fetchHistory(); }, [tab, page]);

  function openInspForm(prefillItemId?: string) {
    openModal({
      title: 'Nouveau contrôle / Maintenance',
      body: <InspectionForm prefillItemId={prefillItemId} onSuccess={() => {
        closeModal(); fetchPlanned(); fetchHistory(); showToast('Contrôle enregistré', 'success');
      }} />,
    });
  }

  const tabs = [
    { key: 'planned', label: 'Planifiés', count: planned.length },
    { key: 'history', label: 'Historique', count: total },
    { key: 'new', label: '+ Nouveau', perm: 'controls.create' },
  ];

  const historyColumns = [
    { key: 'date', label: 'Date', width: '100px', render: (r: any) => <span className="font-mono text-xs">{formatDate(r.date)}</span> },
    { key: 'item', label: 'Article', render: (r: any) => <div><span className="font-mono text-accent text-xs">{r.item?.code}</span> <span className="text-xs text-txt-secondary">{r.item?.designation}</span></div> },
    { key: 'inspType', label: 'Type', width: '160px', render: (r: any) => <span className="text-xs">{r.inspType}</span> },
    { key: 'result', label: 'Résultat', width: '120px', render: (r: any) => <Badge variant={r.result === 'conforme' ? 'success' : r.result === 'non conforme' ? 'danger' : 'warning'}>{r.result}</Badge> },
    { key: 'inspector', label: 'Inspecteur', width: '130px', render: (r: any) => <span className="text-xs text-accent">{r.inspector?.fullname || '-'}</span> },
    { key: 'notes', label: 'Notes', render: (r: any) => <span className="text-xs text-txt-muted truncate block max-w-[200px]">{r.notes || '-'}</span> },
  ];

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 border-b border-gm-border mb-5">
        {tabs.filter((t) => !t.perm || hasPermission(perms, t.perm)).map((t) => (
          <button key={t.key} onClick={() => { if (t.key === 'new') openInspForm(); else setTab(t.key); }}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              tab === t.key ? 'text-accent border-accent' : 'text-txt-secondary border-transparent hover:text-txt-primary'
            }`}>
            {t.label}
            {t.count !== undefined && <span className="text-xs bg-gm-input px-1.5 py-0.5 rounded-lg font-mono">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Planned */}
      {tab === 'planned' && (
        <div className="space-y-2">
          {planned.length === 0 ? (
            <div className="text-center py-12 text-txt-muted">Aucun contrôle planifié</div>
          ) : planned.map((item) => {
            const days = item.nextControlDate ? daysFromNow(item.nextControlDate) : 999;
            const isOverdue = days <= 0;
            return (
              <div key={item.id} className={`flex items-center gap-3 p-4 rounded-gm border ${isOverdue ? 'border-danger/30 bg-danger-bg' : 'border-gm-border bg-gm-card'}`}>
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${isOverdue ? 'bg-danger' : days <= 15 ? 'bg-warning' : 'bg-success'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-accent text-sm">{item.code}</span>
                    <span className="text-sm">{item.designation}</span>
                    {item.type && <Badge variant="info">{item.type}</Badge>}
                  </div>
                  <div className="text-xs text-txt-muted mt-0.5">
                    {item.location && '📍 ' + item.location + ' • '}
                    Fréq: {item.controlFrequency}j
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`font-mono text-sm font-bold ${isOverdue ? 'text-danger' : 'text-txt-primary'}`}>
                    {formatDate(item.nextControlDate)}
                  </div>
                  <div className={`text-xs ${isOverdue ? 'text-danger' : 'text-txt-muted'}`}>
                    {isOverdue ? Math.abs(days) + 'j de retard' : days + 'j restants'}
                  </div>
                </div>
                {canCreate && (
                  <Button variant="secondary" size="sm" onClick={() => openInspForm(item.id)}>Contrôler</Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* History */}
      {tab === 'history' && (
        <DataTable columns={historyColumns} data={inspections} total={total}
          page={page} pageSize={20} sortCol="date" sortDir="desc"
          onSort={() => {}} onPageChange={setPage} />
      )}
    </div>
  );
}

// ─── Inspection Form ─────────────────────
function InspectionForm({ prefillItemId, onSuccess }: { prefillItemId?: string; onSuccess: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    itemId: prefillItemId || '',
    inspType: '',
    date: new Date().toISOString().split('T')[0],
    result: 'conforme',
    notes: '',
    newState: '',
  });

  useEffect(() => {
    fetch('/api/items?pageSize=9999').then((r) => r.json()).then((d) => setItems(d.items || []));
  }, []);

  function update(k: string, v: any) { setForm((f) => ({ ...f, [k]: v })); setError(''); }

  async function handleSubmit() {
    if (!form.itemId || !form.inspType || !form.result) { setError('Champs obligatoires'); return; }
    setSaving(true);
    const body = { ...form };
    if (!body.newState) delete (body as any).newState;
    const res = await fetch('/api/inspections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) onSuccess();
    else { const err = await res.json(); setError(err.error || 'Erreur'); }
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-danger-bg border border-danger/30 rounded-gm-sm px-4 py-2 text-sm text-danger">{error}</div>}
      <div><label className="gm-label">Article *</label>
        <select className="gm-input text-sm" value={form.itemId} onChange={(e) => update('itemId', e.target.value)}>
          <option value="">— Sélectionner —</option>
          {items.map((it) => <option key={it.id} value={it.id}>{it.code} — {it.designation}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="gm-label">Type de contrôle *</label>
          <select className="gm-input text-sm" value={form.inspType} onChange={(e) => update('inspType', e.target.value)}>
            <option value="">— Sélectionner —</option>
            {INSPECTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div><label className="gm-label">Date</label><input type="date" className="gm-input text-sm" value={form.date} onChange={(e) => update('date', e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="gm-label">Résultat *</label>
          <select className="gm-input text-sm" value={form.result} onChange={(e) => update('result', e.target.value)}>
            <option value="conforme">Conforme</option>
            <option value="non conforme">Non conforme</option>
            <option value="à vérifier">À vérifier</option>
          </select>
        </div>
        <div><label className="gm-label">Nouvel état (optionnel)</label>
          <select className="gm-input text-sm" value={form.newState} onChange={(e) => update('newState', e.target.value)}>
            <option value="">— Inchangé —</option>
            {['bon','moyen','usé','à réparer','hors service'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div><label className="gm-label">Notes</label><textarea className="gm-input text-sm min-h-[60px]" value={form.notes} onChange={(e) => update('notes', e.target.value)} /></div>
      <div className="flex justify-end pt-3 border-t border-gm-border">
        <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer le contrôle'}</Button>
      </div>
    </div>
  );
}
