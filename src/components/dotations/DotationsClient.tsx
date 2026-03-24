'use client';

import { useState, useEffect } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/stores/app-store';
import { hasPermission } from '@/lib/permissions';
import { formatDate, daysFromNow, EPI_TYPES } from '@/lib/utils';

export default function DotationsClient() {
  const { showToast, openModal, closeModal, currentUser } = useAppStore();
  const perms = currentUser?.permissions || [];
  const canCreate = hasPermission(perms, 'dotations.create');

  const [dotations, setDotations] = useState<any[]>([]);
  const [byEmployee, setByEmployee] = useState<Record<string, any[]>>({});
  const [employees, setEmployees] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  async function fetchDotations() {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const res = await fetch('/api/dotations?' + params.toString());
    const data = await res.json();
    setDotations(data.dotations || []);
    setByEmployee(data.byEmployee || {});
    setEmployees(data.employees || []);
    setLoading(false);
  }

  useEffect(() => { fetchDotations(); }, [search]);

  function openForm() {
    openModal({
      title: 'Nouvelle dotation EPI',
      body: <DotationForm onSuccess={() => { closeModal(); fetchDotations(); showToast('Dotation créée', 'success'); }} />,
    });
  }

  function exportCSV() {
    let csv = 'Employé;Type EPI;Libellé;Date;Qté;Durée(j);Renouvellement;Taille;Remis par\n';
    for (const d of dotations) {
      csv += [d.employeeName, d.epiType, d.epiLabel, formatDate(d.givenDate), d.qty, d.durationDays, formatDate(d.renewalDate), d.size || '', d.givenBy?.fullname || ''].join(';') + '\n';
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'dotations_epi.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      {/* Stats */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="bg-gm-card border border-gm-border rounded-gm-sm px-4 py-3 flex items-center gap-2">
          <span className="text-xl">🦺</span>
          <div><div className="font-mono text-xl font-bold text-accent">{dotations.length}</div><div className="text-xs text-txt-secondary">Dotations</div></div>
        </div>
        <div className="bg-gm-card border border-gm-border rounded-gm-sm px-4 py-3 flex items-center gap-2">
          <span className="text-xl">👥</span>
          <div><div className="font-mono text-xl font-bold text-info">{employees.length}</div><div className="text-xs text-txt-secondary">Employés dotés</div></div>
        </div>
        <div className="bg-gm-card border border-gm-border rounded-gm-sm px-4 py-3 flex items-center gap-2">
          <span className="text-xl">⏰</span>
          <div>
            <div className="font-mono text-xl font-bold text-danger">
              {dotations.filter((d) => d.renewalDate && daysFromNow(d.renewalDate) <= 0).length}
            </div>
            <div className="text-xs text-txt-secondary">À renouveler</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted text-sm">🔍</span>
          <input type="text" placeholder="Rechercher employé, EPI..." className="gm-input pl-9 py-2 text-sm"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex-1" />
        <Button variant="secondary" size="sm" onClick={exportCSV}>💾 Export CSV</Button>
        {canCreate && <Button onClick={openForm}>+ Nouvelle dotation</Button>}
      </div>

      {/* Cards by employee */}
      {employees.length === 0 ? (
        <div className="text-center py-12 text-txt-muted">Aucune dotation enregistrée</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {employees.map((emp) => {
            const dots = byEmployee[emp] || [];
            const expired = dots.filter((d) => d.renewalDate && daysFromNow(d.renewalDate) <= 0).length;
            return (
              <div key={emp} className="bg-gm-card border border-gm-border rounded-gm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-accent-light flex items-center justify-center text-accent font-bold text-sm">
                      {emp.split(' ').map((w) => w[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{emp}</h4>
                      <span className="text-xs text-txt-muted">{dots.length} dotation(s)</span>
                    </div>
                  </div>
                  {expired > 0 && <Badge variant="danger">{expired} à renouveler</Badge>}
                </div>
                <div className="space-y-2">
                  {dots.map((d) => {
                    const epiDef = EPI_TYPES.find((e) => e.key === d.epiType);
                    const isExpired = d.renewalDate && daysFromNow(d.renewalDate) <= 0;
                    return (
                      <div key={d.id} className={`flex items-center gap-2 p-2.5 rounded-gm-sm border text-sm ${isExpired ? 'border-danger/30 bg-danger-bg' : 'border-gm-border bg-gm-input'}`}>
                        <span className="text-lg">{epiDef?.icon || '🦺'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs truncate">{d.epiLabel}</div>
                          <div className="text-[0.7rem] text-txt-muted">{formatDate(d.givenDate)} {d.size ? '• T.' + d.size : ''}</div>
                        </div>
                        <span className="font-mono text-xs">{d.qty}</span>
                        {d.renewalDate && (
                          <span className={`text-xs font-mono ${isExpired ? 'text-danger font-bold' : 'text-txt-muted'}`}>
                            {isExpired ? 'EXPIRÉ' : daysFromNow(d.renewalDate) + 'j'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Dotation Form ─────────────────────
function DotationForm({ onSuccess }: { onSuccess: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    employeeName: '', epiType: '', epiLabel: '', itemId: '',
    givenDate: new Date().toISOString().split('T')[0], qty: 1, durationDays: 180, size: '', comment: '',
  });

  useEffect(() => {
    fetch('/api/items?type=EPI&pageSize=9999').then((r) => r.json()).then((d) => setItems(d.items || []));
  }, []);

  function update(k: string, v: any) { setForm((f) => ({ ...f, [k]: v })); setError(''); }

  // Auto-fill label when EPI type selected
  useEffect(() => {
    const epi = EPI_TYPES.find((e) => e.key === form.epiType);
    if (epi && !form.epiLabel) update('epiLabel', epi.label);
  }, [form.epiType]);

  async function handleSubmit() {
    if (!form.employeeName || !form.epiType || !form.epiLabel) { setError('Champs obligatoires manquants'); return; }
    setSaving(true);
    const body = { ...form, qty: Number(form.qty), durationDays: Number(form.durationDays) };
    if (!body.itemId) delete (body as any).itemId;
    const res = await fetch('/api/dotations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) onSuccess();
    else { const err = await res.json(); setError(err.error || 'Erreur'); }
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-danger-bg border border-danger/30 rounded-gm-sm px-4 py-2 text-sm text-danger">{error}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div><label className="gm-label">Employé *</label><input className="gm-input text-sm" value={form.employeeName} onChange={(e) => update('employeeName', e.target.value)} placeholder="Nom complet" /></div>
        <div><label className="gm-label">Type EPI *</label>
          <select className="gm-input text-sm" value={form.epiType} onChange={(e) => update('epiType', e.target.value)}>
            <option value="">— Sélectionner —</option>
            {EPI_TYPES.map((e) => <option key={e.key} value={e.key}>{e.icon} {e.label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="gm-label">Libellé EPI *</label><input className="gm-input text-sm" value={form.epiLabel} onChange={(e) => update('epiLabel', e.target.value)} /></div>
        <div><label className="gm-label">Article lié (optionnel)</label>
          <select className="gm-input text-sm" value={form.itemId} onChange={(e) => update('itemId', e.target.value)}>
            <option value="">— Aucun —</option>
            {items.map((it) => <option key={it.id} value={it.id}>{it.code} — {it.designation}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div><label className="gm-label">Date</label><input type="date" className="gm-input text-sm" value={form.givenDate} onChange={(e) => update('givenDate', e.target.value)} /></div>
        <div><label className="gm-label">Qté</label><input type="number" min={1} className="gm-input text-sm" value={form.qty} onChange={(e) => update('qty', e.target.value)} /></div>
        <div><label className="gm-label">Durée (jours)</label><input type="number" min={1} className="gm-input text-sm" value={form.durationDays} onChange={(e) => update('durationDays', e.target.value)} /></div>
        <div><label className="gm-label">Taille</label><input className="gm-input text-sm" value={form.size} onChange={(e) => update('size', e.target.value)} placeholder="S/M/L/42..." /></div>
      </div>
      <div><label className="gm-label">Commentaire</label><textarea className="gm-input text-sm min-h-[50px]" value={form.comment} onChange={(e) => update('comment', e.target.value)} /></div>
      <div className="flex justify-end pt-3 border-t border-gm-border">
        <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Enregistrement...' : 'Créer la dotation'}</Button>
      </div>
    </div>
  );
}
