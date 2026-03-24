'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/stores/app-store';

export default function FamiliesManager() {
  const { showToast, openModal, closeModal } = useAppStore();
  const [families, setFamilies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchFamilies() {
    const res = await fetch('/api/families');
    const data = await res.json();
    setFamilies(data.families || []);
    setLoading(false);
  }

  useEffect(() => { fetchFamilies(); }, []);

  function openForm(fam?: any) {
    const isEdit = !!fam;
    const defaultName = fam?.name || '';

    openModal({
      title: isEdit ? 'Modifier famille' : 'Nouvelle famille',
      body: (
        <FamilyForm defaultName={defaultName} onSuccess={(name: string) => {
          const method = isEdit ? 'PUT' : 'POST';
          const body = isEdit ? { id: fam.id, name } : { name };
          fetch('/api/families', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
            .then((r) => { if (r.ok) { closeModal(); fetchFamilies(); showToast(isEdit ? 'Famille modifiée' : 'Famille créée', 'success'); } else r.json().then((d) => showToast(d.error || 'Erreur', 'error')); });
        }} />
      ),
    });
  }

  async function handleDelete(fam: any) {
    if (!confirm('Supprimer "' + fam.name + '" ?')) return;
    const res = await fetch('/api/families?id=' + fam.id, { method: 'DELETE' });
    if (res.ok) { showToast('Supprimée', 'success'); fetchFamilies(); }
    else { const err = await res.json(); showToast(err.error || 'Erreur', 'error'); }
  }

  if (loading) return <div className="text-center py-8"><div className="inline-block w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-txt-secondary">{families.length} famille(s)</span>
        <Button size="sm" onClick={() => openForm()}>+ Nouvelle famille</Button>
      </div>
      <div className="bg-gm-card border border-gm-border rounded-gm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gm-border">
            <th className="px-4 py-3 text-left text-xs font-semibold text-txt-label uppercase">Nom</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-txt-label uppercase w-[100px]">Articles</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-txt-label uppercase w-[160px]">Actions</th>
          </tr></thead>
          <tbody>
            {families.map((f) => (
              <tr key={f.id} className="border-b border-gm-border hover:bg-gm-card-h transition-colors">
                <td className="px-4 py-3 font-medium">{f.name}</td>
                <td className="px-4 py-3 text-center font-mono text-accent">{f.itemCount}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="secondary" size="sm" onClick={() => openForm(f)} className="mr-2">Modifier</Button>
                  {f.itemCount === 0 && <Button variant="danger" size="sm" onClick={() => handleDelete(f)}>Supprimer</Button>}
                </td>
              </tr>
            ))}
            {!families.length && <tr><td colSpan={3} className="text-center py-8 text-txt-muted">Aucune famille</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FamilyForm({ defaultName, onSuccess }: { defaultName: string; onSuccess: (name: string) => void }) {
  const [name, setName] = useState(defaultName);
  return (
    <div className="space-y-4">
      <div><label className="gm-label">Nom de la famille *</label>
        <input className="gm-input text-sm" value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && onSuccess(name.trim())} autoFocus /></div>
      <div className="flex justify-end pt-3 border-t border-gm-border">
        <Button onClick={() => name.trim() && onSuccess(name.trim())} disabled={!name.trim()}>Enregistrer</Button>
      </div>
    </div>
  );
}
