'use client';

import { useState, useEffect } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/stores/app-store';

export default function UsersManager() {
  const { showToast, openModal, closeModal, currentUser } = useAppStore();
  const currentUserId = currentUser?.id;

  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    const [uRes, rRes] = await Promise.all([
      fetch('/api/users').then((r) => r.json()),
      fetch('/api/roles').then((r) => r.json()),
    ]);
    setUsers(uRes.users || []);
    setRoles(rRes.roles || []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  function openForm(user?: any) {
    const isEdit = !!user;
    openModal({
      title: isEdit ? 'Modifier : ' + user.fullname : 'Nouvel utilisateur',
      body: <UserForm user={user} roles={roles} onSuccess={() => { closeModal(); fetchData(); showToast(isEdit ? 'Utilisateur modifié' : 'Utilisateur créé', 'success'); }} />,
    });
  }

  async function toggleActive(user: any) {
    await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, active: !user.active }),
    });
    showToast(user.active ? 'Désactivé' : 'Activé', 'success');
    fetchData();
  }

  async function handleDelete(user: any) {
    if (!confirm('Supprimer définitivement ' + user.fullname + ' ?')) return;
    const res = await fetch('/api/users?id=' + user.id, { method: 'DELETE' });
    if (res.ok) { showToast('Supprimé', 'success'); fetchData(); }
    else { const err = await res.json(); showToast(err.error || 'Erreur', 'error'); }
  }

  if (loading) return <div className="text-center py-8"><div className="inline-block w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-txt-secondary">{users.length} utilisateur(s)</span>
        <Button size="sm" onClick={() => openForm()}>+ Nouvel utilisateur</Button>
      </div>

      <div className="bg-gm-card border border-gm-border rounded-gm overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gm-border">
            <th className="px-4 py-3 text-left text-xs font-semibold text-txt-label uppercase">Nom</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-txt-label uppercase">Identifiant</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-txt-label uppercase">Rôle</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-txt-label uppercase">Email</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-txt-label uppercase">Statut</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-txt-label uppercase">Données</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-txt-label uppercase">Actions</th>
          </tr></thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              return (
                <tr key={u.id} className={`border-b border-gm-border transition-colors hover:bg-gm-card-h ${!u.active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-semibold">
                    {u.fullname} {isSelf && <span className="text-xs text-accent">(vous)</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{u.username}</td>
                  <td className="px-4 py-3"><Badge variant="info">{u.role?.label || u.role?.name}</Badge></td>
                  <td className="px-4 py-3 text-xs text-txt-secondary">{u.email || '-'}</td>
                  <td className="px-4 py-3 text-center"><Badge variant={u.active ? 'success' : 'muted'}>{u.active ? 'Actif' : 'Inactif'}</Badge></td>
                  <td className="px-4 py-3 text-center font-mono text-xs">{u.linkedData > 0 ? <span className="text-accent">{u.linkedData}</span> : '-'}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Button variant="secondary" size="sm" onClick={() => openForm(u)} className="mr-1">Modifier</Button>
                    {!isSelf && (
                      <>
                        <Button variant={u.active ? 'danger' : 'success'} size="sm" onClick={() => toggleActive(u)} className="mr-1">
                          {u.active ? 'Désactiver' : 'Activer'}
                        </Button>
                        {u.linkedData === 0 && <Button variant="danger" size="sm" onClick={() => handleDelete(u)}>🗑</Button>}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-txt-muted mt-3">* Un utilisateur avec des données liées ne peut pas être supprimé mais peut être désactivé.</p>
    </div>
  );
}

// ─── User Form ─────────────────────
function UserForm({ user, roles, onSuccess }: { user?: any; roles: any[]; onSuccess: () => void }) {
  const isEdit = !!user;
  const [form, setForm] = useState({
    username: user?.username || '',
    password: '',
    fullname: user?.fullname || '',
    email: user?.email || '',
    phone: user?.phone || '',
    roleId: user?.role?.id || '',
    active: user?.active !== false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function update(k: string, v: any) { setForm((f) => ({ ...f, [k]: v })); setError(''); }

  async function handleSubmit() {
    if (!form.fullname || !form.username || !form.roleId) { setError('Nom, identifiant et rôle obligatoires'); return; }
    if (!isEdit && !form.password) { setError('Mot de passe obligatoire pour un nouvel utilisateur'); return; }
    setSaving(true);
    const method = isEdit ? 'PUT' : 'POST';
    const body: any = { ...form };
    if (isEdit) { body.id = user.id; if (!body.password) delete body.password; }
    const res = await fetch('/api/users', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) onSuccess();
    else { const err = await res.json(); setError(err.error || 'Erreur'); }
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-danger-bg border border-danger/30 rounded-gm-sm px-4 py-2 text-sm text-danger">{error}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div><label className="gm-label">Nom complet *</label><input className="gm-input text-sm" value={form.fullname} onChange={(e) => update('fullname', e.target.value)} /></div>
        <div><label className="gm-label">Identifiant *</label><input className="gm-input text-sm" value={form.username} onChange={(e) => update('username', e.target.value)} readOnly={isEdit} style={isEdit ? { opacity: 0.6 } : undefined} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="gm-label">Mot de passe {isEdit ? '(laisser vide pour garder)' : '*'}</label><input type="password" className="gm-input text-sm" value={form.password} onChange={(e) => update('password', e.target.value)} /></div>
        <div><label className="gm-label">Rôle *</label>
          <select className="gm-input text-sm" value={form.roleId} onChange={(e) => update('roleId', e.target.value)}>
            <option value="">— Sélectionner —</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.label} ({r.userCount || 0} users)</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="gm-label">Email</label><input type="email" className="gm-input text-sm" value={form.email} onChange={(e) => update('email', e.target.value)} /></div>
        <div><label className="gm-label">Téléphone</label><input className="gm-input text-sm" value={form.phone} onChange={(e) => update('phone', e.target.value)} /></div>
      </div>
      <div className="flex justify-end pt-3 border-t border-gm-border">
        <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Enregistrement...' : isEdit ? 'Modifier' : 'Créer'}</Button>
      </div>
    </div>
  );
}
