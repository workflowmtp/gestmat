'use client';

import { useState, useEffect } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/stores/app-store';
import { hasPermission } from '@/lib/permissions';
import { formatDate, formatDateTime } from '@/lib/utils';

export default function CampaignsClient() {
  const { showToast, openModal, closeModal, currentUser } = useAppStore();
  const perms = currentUser?.permissions || [];
  const canCreate = hasPermission(perms, 'campaigns.create');
  const canCount = hasPermission(perms, 'campaigns.count');
  const canValidate = hasPermission(perms, 'campaigns.validate');

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCampaign, setActiveCampaign] = useState<any>(null);

  async function fetchCampaigns() {
    const res = await fetch('/api/campaigns');
    const data = await res.json();
    setCampaigns(data.campaigns || []);
    setLoading(false);
  }

  useEffect(() => { fetchCampaigns(); }, []);

  function openCreateForm() {
    openModal({
      title: 'Nouvelle campagne d\'inventaire',
      body: <CampaignForm onSuccess={() => { closeModal(); fetchCampaigns(); showToast('Campagne créée', 'success'); }} />,
    });
  }

  async function openCounting(campaignId: string) {
    const res = await fetch('/api/campaigns/' + campaignId);
    const data = await res.json();
    setActiveCampaign(data.campaign);
  }

  async function saveCounting(lines: any[]) {
    if (!activeCampaign) return;
    const res = await fetch('/api/campaigns/' + activeCampaign.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines }),
    });
    if (res.ok) {
      showToast('Comptages sauvegardés', 'success');
      // Refresh
      const r2 = await fetch('/api/campaigns/' + activeCampaign.id);
      const d2 = await r2.json();
      setActiveCampaign(d2.campaign);
      fetchCampaigns();
    } else showToast('Erreur sauvegarde', 'error');
  }

  async function validateCampaign() {
    if (!activeCampaign) return;
    if (!confirm('Valider et corriger les stocks ? Cette action est irréversible.')) return;
    const res = await fetch('/api/campaigns/' + activeCampaign.id + '/validate', { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      showToast('Inventaire validé — ' + data.corrections + ' correction(s)', 'success');
      setActiveCampaign(null);
      fetchCampaigns();
    } else showToast(data.error || 'Erreur', 'error');
  }

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  // ── Counting view ──
  if (activeCampaign) {
    const lines = activeCampaign.lines || [];
    const counted = lines.filter((l: any) => l.physicalQty !== null).length;
    const ecarts = lines.filter((l: any) => l.ecart && l.ecart !== 0).length;
    const progress = lines.length ? Math.round((counted / lines.length) * 100) : 0;
    const isValidated = activeCampaign.status === 'validé';

    return (
      <div>
        <Button variant="secondary" size="sm" onClick={() => setActiveCampaign(null)} className="mb-4">← Retour aux campagnes</Button>

        <div className="bg-gm-card border border-gm-border rounded-gm p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">{activeCampaign.name}</h3>
            <Badge variant={isValidated ? 'success' : 'warning'}>{activeCampaign.status}</Badge>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-txt-secondary mb-3">
            {activeCampaign.responsible && <span>👤 {activeCampaign.responsible}</span>}
            <span>📦 {lines.length} articles</span>
            <span>✅ {counted} comptés</span>
            {ecarts > 0 && <span className="text-danger">⚠ {ecarts} écarts</span>}
          </div>
          {/* Progress bar */}
          <div className="h-2 bg-gm-border rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: progress + '%', background: progress === 100 ? '#10b981' : '#f59e0b' }} />
          </div>
          <div className="text-xs text-txt-muted mt-1">{progress}% complété</div>
        </div>

        {/* Counting table */}
        <div className="bg-gm-card border border-gm-border rounded-gm overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gm-border">
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-txt-label uppercase">Code</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-txt-label uppercase">Désignation</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-txt-label uppercase w-[80px]">Théorique</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-txt-label uppercase w-[100px]">Physique</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-txt-label uppercase w-[80px]">Écart</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-txt-label uppercase">Justification</th>
            </tr></thead>
            <tbody>
              {lines.map((line: any) => {
                const ecart = line.ecart || 0;
                return (
                  <tr key={line.id} className="border-b border-gm-border">
                    <td className="px-3 py-2 font-mono text-accent text-xs">{line.item?.code}</td>
                    <td className="px-3 py-2 text-xs">{line.item?.designation}</td>
                    <td className="px-3 py-2 text-center font-mono">{line.theoreticalQty}</td>
                    <td className="px-3 py-2 text-center">
                      {isValidated ? (
                        <span className="font-mono">{line.physicalQty ?? '-'}</span>
                      ) : (
                        <input type="number" min={0}
                          className="gm-input text-sm text-center py-1 w-[70px]"
                          defaultValue={line.physicalQty ?? ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : Number(e.target.value);
                            line._physicalQty = val;
                          }} />
                      )}
                    </td>
                    <td className="px-3 py-2 text-center font-mono font-bold">
                      {ecart !== 0 ? (
                        <span className={ecart > 0 ? 'text-success' : 'text-danger'}>
                          {ecart > 0 ? '+' : ''}{ecart}
                        </span>
                      ) : line.physicalQty !== null ? <span className="text-success">0</span> : '-'}
                    </td>
                    <td className="px-3 py-2">
                      {isValidated ? (
                        <span className="text-xs text-txt-muted">{line.justification || '-'}</span>
                      ) : (
                        <input type="text" className="gm-input text-xs py-1"
                          defaultValue={line.justification || ''} placeholder="Justification..."
                          onChange={(e) => { line._justification = e.target.value; }} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        {!isValidated && (
          <div className="flex gap-3 mt-4">
            {canCount && (
              <Button variant="secondary" onClick={() => {
                const updates = lines.filter((l: any) => l._physicalQty !== undefined || l._justification !== undefined).map((l: any) => ({
                  lineId: l.id,
                  physicalQty: l._physicalQty !== undefined ? l._physicalQty : l.physicalQty,
                  justification: l._justification !== undefined ? l._justification : l.justification,
                }));
                if (updates.length) saveCounting(updates);
                else showToast('Aucune modification', 'info');
              }}>💾 Sauvegarder les comptages</Button>
            )}
            {canValidate && counted === lines.length && (
              <Button onClick={validateCampaign}>✅ Valider l&apos;inventaire et corriger les stocks</Button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Campaign list ──
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm text-txt-secondary">{campaigns.length} campagne(s)</span>
        {canCreate && <Button onClick={openCreateForm}>+ Nouvelle campagne</Button>}
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-12 text-txt-muted">Aucune campagne d&apos;inventaire</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {campaigns.map((c) => {
            const progress = c.lineCount ? Math.round((c.countedCount / c.lineCount) * 100) : 0;
            return (
              <div key={c.id} className="bg-gm-card border border-gm-border rounded-gm p-5 hover:border-gm-border-l transition-all">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{c.name}</h4>
                  <Badge variant={c.status === 'validé' ? 'success' : 'warning'}>{c.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-txt-secondary mb-3">
                  {c.responsible && <span>👤 {c.responsible}</span>}
                  <span>📦 {c.lineCount} articles</span>
                  <span>✅ {c.countedCount} comptés</span>
                  {c.ecartCount > 0 && <span className="text-danger">⚠ {c.ecartCount} écarts</span>}
                  <span className="font-mono">{formatDate(c.createdAt)}</span>
                </div>
                {/* Progress */}
                <div className="h-1.5 bg-gm-border rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full transition-all" style={{ width: progress + '%', background: progress === 100 ? '#10b981' : '#f59e0b' }} />
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => openCounting(c.id)}>
                    {c.status === 'validé' ? 'Voir' : '📋 Saisie comptage'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Campaign Creation Form ─────────────────────
function CampaignForm({ onSuccess }: { onSuccess: () => void }) {
  const [locations, setLocations] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', locationFilter: '', typeFilter: '', responsible: '', comment: '' });

  useEffect(() => { fetch('/api/locations').then((r) => r.json()).then((d) => setLocations(d.locations || [])); }, []);
  function update(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); setError(''); }

  async function handleSubmit() {
    if (!form.name) { setError('Nom obligatoire'); return; }
    setSaving(true);
    const body = { ...form };
    if (!body.locationFilter) delete (body as any).locationFilter;
    if (!body.typeFilter) delete (body as any).typeFilter;
    const res = await fetch('/api/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) onSuccess();
    else { const err = await res.json(); setError(err.error || 'Erreur'); }
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-danger-bg border border-danger/30 rounded-gm-sm px-4 py-2 text-sm text-danger">{error}</div>}
      <div><label className="gm-label">Nom de la campagne *</label><input className="gm-input text-sm" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Ex: Inventaire Mars 2026" /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="gm-label">Filtre localisation (optionnel)</label>
          <select className="gm-input text-sm" value={form.locationFilter} onChange={(e) => update('locationFilter', e.target.value)}>
            <option value="">Toutes localisations</option>
            {locations.map((l) => <option key={l.id} value={l.name}>{l.name}</option>)}
          </select>
        </div>
        <div><label className="gm-label">Filtre type (optionnel)</label>
          <select className="gm-input text-sm" value={form.typeFilter} onChange={(e) => update('typeFilter', e.target.value)}>
            <option value="">Tous types</option>
            <option value="Outillage">Outillage</option>
            <option value="EPI">EPI</option>
            <option value="Consommable traçable">Consommable</option>
          </select>
        </div>
      </div>
      <div><label className="gm-label">Responsable</label><input className="gm-input text-sm" value={form.responsible} onChange={(e) => update('responsible', e.target.value)} /></div>
      <div><label className="gm-label">Commentaire</label><textarea className="gm-input text-sm min-h-[50px]" value={form.comment} onChange={(e) => update('comment', e.target.value)} /></div>
      <div className="flex justify-end pt-3 border-t border-gm-border">
        <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Création...' : 'Créer la campagne'}</Button>
      </div>
    </div>
  );
}
