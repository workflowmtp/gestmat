'use client';

import { useState, useEffect } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/stores/app-store';
import { LOCATION_TYPES } from '@/lib/utils';

const LOC_ICONS: Record<string, string> = {
  'magasin':'🏠','dépôt':'📦','chantier':'🏗','atelier':'🔧','véhicule':'🚛',
  'utilisateur':'👤','sous-traitant':'🤝','zone quarantaine':'⚠','rebut':'🗑',
};

export default function LocationsManager() {
  const { showToast, openModal, closeModal } = useAppStore();
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchLocations() {
    const res = await fetch('/api/locations');
    const data = await res.json();
    setLocations(data.locations || []);
    setLoading(false);
  }

  useEffect(() => { fetchLocations(); }, []);

  function openForm(loc?: any) {
    const isEdit = !!loc;
    openModal({
      title: isEdit ? 'Modifier : ' + loc.name : 'Nouvelle localisation',
      body: <LocationForm location={loc} onSuccess={() => { closeModal(); fetchLocations(); showToast(isEdit ? 'Localisation modifiée' : 'Localisation créée', 'success'); }} />,
    });
  }

  async function handleDelete(loc: any) {
    if (!confirm('Supprimer la localisation "' + loc.name + '" ?')) return;
    const res = await fetch('/api/locations?id=' + loc.id, { method: 'DELETE' });
    if (res.ok) { showToast('Supprimée', 'success'); fetchLocations(); }
    else { const err = await res.json(); showToast(err.error || 'Erreur', 'error'); }
  }

  if (loading) return <div className="text-center py-8"><div className="inline-block w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-txt-secondary">{locations.length} localisation(s)</span>
        <Button size="sm" onClick={() => openForm()}>+ Nouvelle localisation</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {locations.map((loc) => (
          <div key={loc.id} className="bg-gm-card border border-gm-border rounded-gm p-4 hover:border-gm-border-l transition-all">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">{LOC_ICONS[loc.type] || '📍'}</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">{loc.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="info">{loc.type}</Badge>
                  <span className="font-mono text-xs text-txt-muted">{loc.code}</span>
                </div>
              </div>
              <span className="font-mono text-lg font-bold text-accent">{loc.itemCount || 0}</span>
            </div>
            {loc.responsible && <div className="text-xs text-txt-secondary mb-1">👤 {loc.responsible}</div>}
            {loc.phone && <div className="text-xs text-txt-muted mb-1">📞 {loc.phone}</div>}
            {loc.comment && <div className="text-xs text-txt-muted italic">{loc.comment}</div>}
            <div className="flex gap-2 mt-3 pt-3 border-t border-gm-border">
              <Button variant="secondary" size="sm" onClick={() => openForm(loc)}>Modifier</Button>
              {(loc.itemCount || 0) === 0 && (
                <Button variant="danger" size="sm" onClick={() => handleDelete(loc)}>Supprimer</Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Location Form (inline) ─────────────────────
function LocationForm({ location, onSuccess }: { location?: any; onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: location?.name || '',
    code: location?.code || '',
    type: location?.type || 'chantier',
    responsible: location?.responsible || '',
    phone: location?.phone || '',
    comment: location?.comment || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function update(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); setError(''); }

  async function handleSubmit() {
    if (!form.name || !form.type) { setError('Nom et type obligatoires'); return; }
    setSaving(true);
    const method = location ? 'PUT' : 'POST';
    const body = location ? { id: location.id, ...form } : form;
    const res = await fetch('/api/locations', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) onSuccess();
    else { const err = await res.json(); setError(err.error || 'Erreur'); }
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-danger-bg border border-danger/30 rounded-gm-sm px-4 py-2 text-sm text-danger">{error}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div><label className="gm-label">Nom *</label><input className="gm-input text-sm" value={form.name} onChange={(e) => update('name', e.target.value)} /></div>
        <div><label className="gm-label">Code</label><input className="gm-input text-sm" value={form.code} onChange={(e) => update('code', e.target.value)} placeholder="Auto" /></div>
      </div>
      <div>
        <label className="gm-label">Type *</label>
        <select className="gm-input text-sm" value={form.type} onChange={(e) => update('type', e.target.value)}>
          {LOCATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="gm-label">Responsable</label><input className="gm-input text-sm" value={form.responsible} onChange={(e) => update('responsible', e.target.value)} /></div>
        <div><label className="gm-label">Téléphone</label><input className="gm-input text-sm" value={form.phone} onChange={(e) => update('phone', e.target.value)} /></div>
      </div>
      <div><label className="gm-label">Commentaire</label><textarea className="gm-input text-sm min-h-[60px]" value={form.comment} onChange={(e) => update('comment', e.target.value)} /></div>
      <div className="flex justify-end pt-3 border-t border-gm-border">
        <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Enregistrement...' : location ? 'Modifier' : 'Créer'}</Button>
      </div>
    </div>
  );
}
