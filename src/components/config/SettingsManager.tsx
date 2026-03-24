'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/stores/app-store';
import { hasPermission } from '@/lib/permissions';

export default function SettingsManager() {
  const { showToast, currentUser } = useAppStore();
  const perms = currentUser?.permissions || [];
  const canBackup = hasPermission(perms, 'reports.backup');

  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json()).then((d) => { setSettings(d.settings || {}); setLoading(false); });
  }, []);

  function update(key: string, value: string) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    if (res.ok) showToast('Paramètres sauvegardés', 'success');
    else showToast('Erreur sauvegarde', 'error');
  }

  function doBackup() {
    window.open('/api/export/full-json', '_blank');
  }

  function doRestore() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data.version || !data.items) { showToast('Fichier invalide', 'error'); return; }
        if (!confirm('Remplacer TOUTES les données par cette sauvegarde ?\n\nCette action est irréversible.')) return;
        showToast('Restauration en cours... Cette fonctionnalité nécessite un endpoint dédié côté serveur.', 'info');
      } catch { showToast('Fichier JSON invalide', 'error'); }
    };
    input.click();
  }

  async function handleResetDemo() {
    if (!confirm('⚠ ATTENTION : Ceci va SUPPRIMER toutes les données et réinitialiser avec les données de démonstration.\n\nÊtes-vous sûr ?')) return;
    if (!confirm('Dernière confirmation : toutes les données seront perdues.')) return;
    showToast('Pour réinitialiser, exécutez : npx prisma db seed', 'info');
  }

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-[700px]">
      {/* General settings */}
      <div className="bg-gm-card border border-gm-border rounded-gm p-6 mb-5">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">🏢 Informations entreprise</h4>
        <div className="space-y-4">
          <div>
            <label className="gm-label">Nom de l&apos;entreprise</label>
            <input className="gm-input text-sm" value={settings.companyName || ''} onChange={(e) => update('companyName', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="gm-label">Devise</label>
              <input className="gm-input text-sm" value={settings.currency || 'FCFA'} onChange={(e) => update('currency', e.target.value)} />
            </div>
            <div>
              <label className="gm-label">Langue</label>
              <select className="gm-input text-sm" value={settings.language || 'fr'} onChange={(e) => update('language', e.target.value)}>
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-5 pt-4 border-t border-gm-border">
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Enregistrement...' : '💾 Sauvegarder'}</Button>
        </div>
      </div>

      {/* Backup / Restore */}
      {canBackup && (
        <div className="bg-gm-card border border-gm-border rounded-gm p-6 mb-5">
          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">💾 Sauvegarde & Restauration</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-gm-input border border-gm-border rounded-gm-sm p-4 text-center cursor-pointer hover:border-success transition-all" onClick={doBackup}>
              <div className="text-2xl mb-2">📥</div>
              <div className="text-sm font-semibold">Exporter JSON</div>
              <div className="text-xs text-txt-muted">Sauvegarde complète</div>
            </div>
            <div className="bg-gm-input border border-gm-border rounded-gm-sm p-4 text-center cursor-pointer hover:border-info transition-all" onClick={doRestore}>
              <div className="text-2xl mb-2">📤</div>
              <div className="text-sm font-semibold">Restaurer JSON</div>
              <div className="text-xs text-txt-muted">Importer une sauvegarde</div>
            </div>
            <div className="bg-gm-input border border-danger/30 rounded-gm-sm p-4 text-center cursor-pointer hover:border-danger transition-all" onClick={handleResetDemo}>
              <div className="text-2xl mb-2">🔄</div>
              <div className="text-sm font-semibold text-danger">Réinitialiser</div>
              <div className="text-xs text-txt-muted">Données de démonstration</div>
            </div>
          </div>
        </div>
      )}

      {/* Technical info */}
      <div className="bg-gm-card border border-gm-border rounded-gm p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">ℹ Informations techniques</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="text-txt-secondary">Version</div><div className="font-mono">5.0 (Next.js)</div>
          <div className="text-txt-secondary">Framework</div><div className="font-mono">Next.js 15 + TypeScript</div>
          <div className="text-txt-secondary">Base de données</div><div className="font-mono">PostgreSQL + Prisma</div>
          <div className="text-txt-secondary">Auth</div><div className="font-mono">NextAuth v5 (JWT)</div>
          <div className="text-txt-secondary">Agent IA</div><div className="font-mono">n8n Webhook</div>
          <div className="text-txt-secondary">Déploiement</div><div className="font-mono">Vercel</div>
        </div>
      </div>
    </div>
  );
}
