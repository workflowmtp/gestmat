'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Badge, { StatusBadge, StateBadge, ConformityBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/stores/app-store';
import { hasPermission } from '@/lib/permissions';
import { formatDate, formatDateTime, formatNumber, formatCurrency, computeItemStatus, getMovementColor, daysFromNow } from '@/lib/utils';

export default function ItemDetailClient({ itemId }: { itemId: string }) {
  const router = useRouter();
  const { showToast, currentUser } = useAppStore();
  const perms = currentUser?.permissions || [];
  const canEdit = hasPermission(perms, 'items.edit');
  const canViewCost = hasPermission(perms, 'items.view_cost');
  const canMove = hasPermission(perms, 'movements.create');
  const canDelete = hasPermission(perms, 'items.delete');

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('general');

  useEffect(() => {
    fetch('/api/items/' + itemId)
      .then((r) => r.json())
      .then((d) => { setItem(d.item); setLoading(false); })
      .catch(() => setLoading(false));
  }, [itemId]);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;
  if (!item) return <div className="text-center py-20 text-danger">Article introuvable</div>;

  const status = computeItemStatus({
    state: item.state, returnDate: item.returnDate, purchaseDate: item.purchaseDate,
    serviceDate: item.serviceDate, lifespanDays: item.lifespanDays,
    lifespanAlertDays: item.lifespanAlertDays, nextControlDate: item.nextControlDate,
    location: item.location, qtyAvailable: item.qtyAvailable, qty: item.qty,
  });

  // Lifespan bar
  let lifePercent = 0;
  if (item.purchaseDate && item.lifespanDays) {
    const svc = item.serviceDate || item.purchaseDate;
    const used = Math.round((Date.now() - new Date(svc).getTime()) / 86400000);
    lifePercent = Math.min(100, Math.round((used / item.lifespanDays) * 100));
  }

  async function handleArchive() {
    if (!confirm('Archiver cet article ?')) return;
    const res = await fetch('/api/items/' + itemId, { method: 'DELETE' });
    if (res.ok) { showToast('Article archivé', 'success'); router.push('/inventory'); }
    else showToast('Erreur archivage', 'error');
  }

  const tabs = [
    { key: 'general', label: 'Général' },
    { key: 'technical', label: 'Technique' },
    { key: 'financial', label: 'Financier' },
    { key: 'history', label: 'Historique' },
    { key: 'photo', label: 'Photo & Docs' },
  ];

  function Field({ label, value, mono }: { label: string; value: any; mono?: boolean }) {
    return (
      <div className="py-2">
        <div className="text-xs text-txt-muted uppercase tracking-wide mb-0.5">{label}</div>
        <div className={mono ? 'font-mono text-sm' : 'text-sm'}>{value || '-'}</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start gap-5 mb-6">
        {/* Photo thumbnail */}
        <div className="w-[120px] h-[90px] bg-gm-input border border-gm-border rounded-gm-sm flex items-center justify-center overflow-hidden flex-shrink-0">
          {item.photo ? (
            <img src={item.photo} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl text-txt-muted opacity-50">📷</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-accent font-bold text-lg">{item.code}</span>
            <Badge variant={item.type?.name === 'EPI' ? 'purple' : 'info'}>{item.type?.name}</Badge>
            <StatusBadge status={status} />
          </div>
          <h2 className="text-xl font-bold mb-1">{item.designation}</h2>
          <div className="flex flex-wrap gap-3 text-sm text-txt-secondary">
            {item.brand && <span>{item.brand} {item.model || ''}</span>}
            {item.serialNumber && <span className="font-mono">S/N: {item.serialNumber}</span>}
            {item.location && <span>📍 {item.location.name}</span>}
            {item.responsible && <span>👤 {item.responsible}</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-shrink-0">
          {canEdit && <Button variant="secondary" size="sm" onClick={() => router.push('/inventory/' + itemId + '?edit=1')}>✏ Modifier</Button>}
          {canMove && <Button variant="info" size="sm" onClick={() => router.push('/movements?item=' + itemId)}>↗ Mouvement</Button>}
          {canDelete && <Button variant="danger" size="sm" onClick={handleArchive}>🗑 Archiver</Button>}
        </div>
      </div>

      {/* Life bar */}
      {item.lifespanDays > 0 && (
        <div className="mb-6 bg-gm-card border border-gm-border rounded-gm-sm p-4">
          <div className="flex justify-between text-xs text-txt-secondary mb-1.5">
            <span>Durée de vie</span>
            <span className="font-mono">{lifePercent}% ({Math.round(lifePercent * item.lifespanDays / 100)} / {item.lifespanDays} jours)</span>
          </div>
          <div className="h-2 bg-gm-border rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: lifePercent + '%', background: lifePercent >= 90 ? '#ef4444' : lifePercent >= 70 ? '#f59e0b' : '#10b981' }} />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gm-border mb-5">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              tab === t.key ? 'text-accent border-accent' : 'text-txt-secondary border-transparent hover:text-txt-primary'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-fade">
        {tab === 'general' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-1">
            <Field label="Code" value={item.code} mono />
            <Field label="Désignation" value={item.designation} />
            <Field label="Type" value={item.type?.name} />
            <Field label="Famille" value={item.family?.name} />
            <Field label="Sous-famille" value={item.subFamily} />
            <Field label="Unité" value={item.unit} />
            <Field label="Quantité totale" value={item.qty} mono />
            <Field label="Qté disponible" value={item.qtyAvailable} mono />
            <Field label="Qté affectée" value={item.qtyAffected} mono />
            <Field label="Stock mini" value={item.minStock} mono />
            <Field label="État" value={<StateBadge state={item.state} />} />
            <Field label="Conformité" value={<ConformityBadge value={item.conformity} />} />
            <Field label="Localisation" value={item.location?.name} />
            <Field label="Responsable" value={item.responsible} />
            <Field label="Projet en cours" value={item.currentProject} />
            {item.safetyNote && <Field label="⚠ Note sécurité" value={<span className="text-warning">{item.safetyNote}</span>} />}
            {item.comment && <Field label="Commentaire" value={item.comment} />}
          </div>
        )}

        {tab === 'technical' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-1">
            <Field label="Marque" value={item.brand} />
            <Field label="Modèle" value={item.model} />
            <Field label="Réf. fabricant" value={item.manufacturerRef} />
            <Field label="N° de série" value={item.serialNumber} mono />
            <Field label="Code-barres" value={item.barcode} mono />
            <Field label="Date achat" value={formatDate(item.purchaseDate)} />
            <Field label="Mise en service" value={formatDate(item.serviceDate)} />
            <Field label="Durée de vie (j)" value={item.lifespanDays} mono />
            <Field label="Alerte fin vie (j)" value={item.lifespanAlertDays} mono />
            <Field label="Freq. contrôle (j)" value={item.controlFrequency} mono />
            <Field label="Prochain contrôle" value={
              item.nextControlDate ? (
                <span className={daysFromNow(item.nextControlDate) <= 0 ? 'text-danger font-bold' : ''}>
                  {formatDate(item.nextControlDate)} ({daysFromNow(item.nextControlDate)}j)
                </span>
              ) : '-'
            } />
            <Field label="Date retour" value={
              item.returnDate ? (
                <span className={daysFromNow(item.returnDate) < 0 ? 'text-danger font-bold' : ''}>
                  {formatDate(item.returnDate)} ({daysFromNow(item.returnDate)}j)
                </span>
              ) : '-'
            } />
            <Field label="Fournisseur" value={item.supplier} />
            <Field label="Garantie" value={item.warranty} />
          </div>
        )}

        {tab === 'financial' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-1">
            <Field label="Coût unitaire" value={canViewCost ? formatCurrency(item.unitCost) : '•••'} mono />
            <Field label="Valeur stock" value={canViewCost ? formatCurrency((item.unitCost || 0) * (item.qty || 1)) : '•••'} mono />
            <Field label="Quantité" value={item.qty} mono />
            <Field label="Fournisseur" value={item.supplier} />
            <Field label="Garantie" value={item.warranty} />
            <Field label="Date achat" value={formatDate(item.purchaseDate)} />
          </div>
        )}

        {tab === 'history' && (
          <div>
            <h4 className="text-sm font-semibold mb-3">Derniers mouvements ({item.movements?.length || 0})</h4>
            {!item.movements?.length ? (
              <p className="text-txt-muted text-sm py-4">Aucun mouvement</p>
            ) : (
              <div className="space-y-2">
                {item.movements.map((mv: any) => (
                  <div key={mv.id} className="flex items-center gap-3 p-3 bg-gm-input border border-gm-border rounded-gm-sm text-sm">
                    <Badge variant={getMovementColor(mv.type) as any}>{mv.type}</Badge>
                    <span className="font-mono text-xs text-txt-muted">{formatDateTime(mv.timestamp)}</span>
                    <span className="text-txt-secondary flex-1">{mv.origin || '?'} → {mv.destination || '?'}</span>
                    <span className="text-xs text-accent">{mv.user?.fullname}</span>
                  </div>
                ))}
              </div>
            )}

            {item.inspections?.length > 0 && (
              <>
                <h4 className="text-sm font-semibold mt-6 mb-3">Contrôles ({item.inspections.length})</h4>
                <div className="space-y-2">
                  {item.inspections.map((insp: any) => (
                    <div key={insp.id} className="flex items-center gap-3 p-3 bg-gm-input border border-gm-border rounded-gm-sm text-sm">
                      <Badge variant={insp.result === 'conforme' ? 'success' : insp.result === 'non conforme' ? 'danger' : 'warning'}>{insp.result}</Badge>
                      <span className="font-mono text-xs text-txt-muted">{formatDate(insp.date)}</span>
                      <span className="text-txt-secondary flex-1">{insp.inspType}</span>
                      <span className="text-xs text-accent">{insp.inspector?.fullname || '-'}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'photo' && (
          <div className="text-center">
            <div className="w-full max-w-[400px] mx-auto aspect-[4/3] bg-gm-input border-2 border-dashed border-gm-border rounded-gm flex items-center justify-center overflow-hidden mb-4">
              {item.photo ? (
                <img src={item.photo} alt={item.designation} className="w-full h-full object-cover" />
              ) : (
                <div className="text-txt-muted text-center">
                  <div className="text-5xl mb-2 opacity-40">📷</div>
                  <p className="text-sm">Aucune photo</p>
                </div>
              )}
            </div>
            {canEdit && (
              <p className="text-sm text-txt-muted">
                L&apos;upload photo est disponible via le formulaire de modification.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
