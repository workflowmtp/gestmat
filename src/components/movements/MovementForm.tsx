'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { MOVEMENT_TYPES } from '@/lib/utils';

interface MovementFormProps {
  onSuccess: () => void;
  prefillItemId?: string;
}

export default function MovementForm({ onSuccess, prefillItemId }: MovementFormProps) {
  const [items, setItems] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    itemId: prefillItemId || '',
    type: '',
    origin: '',
    destination: '',
    beneficiary: '',
    qty: 1,
    reason: '',
    comment: '',
    returnDate: '',
  });

  useEffect(() => {
    fetch('/api/items?pageSize=9999').then((r) => r.json()).then((d) => setItems(d.items || []));
    fetch('/api/locations').then((r) => r.json()).then((d) => setLocations(d.locations || []));
  }, []);

  function update(key: string, value: any) {
    setForm((f) => ({ ...f, [key]: value }));
    setError('');
  }

  // Auto-fill origin when item selected
  useEffect(() => {
    if (form.itemId) {
      const item = items.find((i) => i.id === form.itemId);
      if (item?.location?.name) {
        setForm((f) => ({ ...f, origin: item.location.name }));
      }
    }
  }, [form.itemId, items]);

  // Auto-fill destination for return types
  useEffect(() => {
    if (['retour', 'restitution'].includes(form.type)) {
      const magasin = locations.find((l) => l.type === 'magasin');
      if (magasin) setForm((f) => ({ ...f, destination: magasin.name }));
    }
  }, [form.type, locations]);

  async function handleSubmit() {
    if (!form.itemId || !form.type) {
      setError('Article et type de mouvement obligatoires');
      return;
    }

    setSaving(true);
    setError('');

    const body: any = { ...form };
    if (body.returnDate) body.returnDate = new Date(body.returnDate).toISOString();
    else delete body.returnDate;
    body.qty = Number(body.qty) || 1;

    const res = await fetch('/api/movements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      onSuccess();
    } else {
      setError(data.error || 'Erreur lors de la création');
    }
  }

  const selectedItem = items.find((i) => i.id === form.itemId);
  const isReturn = ['retour', 'restitution'].includes(form.type);
  const needsDest = ['prêt', 'affectation', 'transfert', 'sortie'].includes(form.type);

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-danger-bg border border-danger/30 rounded-gm-sm px-4 py-3 text-sm text-danger">{error}</div>
      )}

      {/* Article select */}
      <div>
        <label className="gm-label">Article *</label>
        <select className="gm-input text-sm" value={form.itemId} onChange={(e) => update('itemId', e.target.value)}>
          <option value="">— Sélectionner un article —</option>
          {items.map((it) => (
            <option key={it.id} value={it.id}>
              {it.code} — {it.designation} [{it.state}] {it.location?.name ? '📍' + it.location.name : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Selected item info */}
      {selectedItem && (
        <div className="bg-gm-input border border-gm-border rounded-gm-sm p-3 text-sm flex flex-wrap gap-3">
          <span className="font-mono text-accent">{selectedItem.code}</span>
          <span className="text-txt-secondary">{selectedItem.designation}</span>
          <span className="badge badge-info">{selectedItem.state}</span>
          {selectedItem.location && <span className="text-xs">📍 {selectedItem.location.name}</span>}
        </div>
      )}

      {/* Type */}
      <div>
        <label className="gm-label">Type de mouvement *</label>
        <select className="gm-input text-sm" value={form.type} onChange={(e) => update('type', e.target.value)}>
          <option value="">— Sélectionner —</option>
          {MOVEMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Origin / Destination */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="gm-label">Origine</label>
          <input type="text" className="gm-input text-sm" value={form.origin}
            onChange={(e) => update('origin', e.target.value)} readOnly={isReturn} />
        </div>
        <div>
          <label className="gm-label">Destination {needsDest ? '*' : ''}</label>
          {isReturn ? (
            <input type="text" className="gm-input text-sm" value={form.destination} readOnly />
          ) : (
            <select className="gm-input text-sm" value={form.destination}
              onChange={(e) => update('destination', e.target.value)}>
              <option value="">— Sélectionner —</option>
              {locations.map((l) => <option key={l.id} value={l.name}>{l.name} ({l.type})</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Beneficiary & Qty */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="gm-label">Bénéficiaire</label>
          <input type="text" className="gm-input text-sm" value={form.beneficiary}
            onChange={(e) => update('beneficiary', e.target.value)} placeholder="Nom du bénéficiaire" />
        </div>
        <div>
          <label className="gm-label">Quantité</label>
          <input type="number" className="gm-input text-sm" min={1} value={form.qty}
            onChange={(e) => update('qty', e.target.value)} />
        </div>
      </div>

      {/* Return date (for prêt) */}
      {form.type === 'prêt' && (
        <div>
          <label className="gm-label">Date de retour prévue</label>
          <input type="date" className="gm-input text-sm" value={form.returnDate}
            onChange={(e) => update('returnDate', e.target.value)} />
        </div>
      )}

      {/* Reason & Comment */}
      <div>
        <label className="gm-label">Motif</label>
        <input type="text" className="gm-input text-sm" value={form.reason}
          onChange={(e) => update('reason', e.target.value)} placeholder="Motif du mouvement" />
      </div>
      <div>
        <label className="gm-label">Commentaire</label>
        <textarea className="gm-input text-sm min-h-[60px]" value={form.comment}
          onChange={(e) => update('comment', e.target.value)} placeholder="Remarques..." />
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-2 pt-3 border-t border-gm-border">
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? 'Enregistrement...' : 'Enregistrer le mouvement'}
        </Button>
      </div>
    </div>
  );
}
