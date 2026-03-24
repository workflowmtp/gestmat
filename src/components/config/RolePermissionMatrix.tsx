'use client';

import { useState, useEffect } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/stores/app-store';
import { PERMISSION_MODULES } from '@/lib/permissions';

interface Role {
  id: string; name: string; label: string; level: number;
  builtIn: boolean; userCount: number; permissions: string[];
}

interface Permission {
  id: string; code: string; label: string; module: string; description?: string;
}

export default function RolePermissionMatrix() {
  const { showToast, openModal, closeModal } = useAppStore();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editPerms, setEditPerms] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  async function fetchData() {
    const [rRes, pRes] = await Promise.all([
      fetch('/api/roles').then((r) => r.json()),
      fetch('/api/permissions').then((r) => r.json()),
    ]);
    setRoles(rRes.roles || []);
    setPermissions(pRes.permissions || []);
    setGrouped(pRes.grouped || {});
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  function startEdit(role: Role) {
    setEditingRole(role);
    setEditPerms(new Set(role.permissions));
  }

  function cancelEdit() {
    setEditingRole(null);
    setEditPerms(new Set());
  }

  function togglePerm(code: string) {
    setEditPerms((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function toggleModule(module: string) {
    const moduleCodes = (grouped[module] || []).map((p) => p.code);
    const allChecked = moduleCodes.every((c) => editPerms.has(c));
    setEditPerms((prev) => {
      const next = new Set(prev);
      for (const c of moduleCodes) {
        if (allChecked) next.delete(c);
        else next.add(c);
      }
      return next;
    });
  }

  async function savePermissions() {
    if (!editingRole) return;
    setSaving(true);
    const res = await fetch('/api/roles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingRole.id, permissionCodes: Array.from(editPerms) }),
    });
    setSaving(false);
    if (res.ok) {
      showToast('Permissions mises à jour', 'success');
      cancelEdit();
      fetchData();
    } else {
      const err = await res.json();
      showToast(err.error || 'Erreur', 'error');
    }
  }

  function openCreateRole() {
    openModal({
      title: 'Nouveau rôle',
      body: <RoleForm onSuccess={() => { closeModal(); fetchData(); showToast('Rôle créé', 'success'); }} />,
    });
  }

  function openEditRole(role: Role) {
    openModal({
      title: 'Modifier : ' + role.label,
      body: <RoleForm role={role} onSuccess={() => { closeModal(); fetchData(); showToast('Rôle modifié', 'success'); }} />,
    });
  }

  async function deleteRole(role: Role) {
    if (!confirm('Supprimer le rôle "' + role.label + '" ?\nCette action est irréversible.')) return;
    const res = await fetch('/api/roles?id=' + role.id, { method: 'DELETE' });
    if (res.ok) { showToast('Rôle supprimé', 'success'); fetchData(); }
    else { const err = await res.json(); showToast(err.error || 'Erreur', 'error'); }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  const modules = PERMISSION_MODULES.filter((m) => grouped[m.code]?.length > 0);

  return (
    <div>
      {/* Roles list */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-txt-secondary">{roles.length} rôle(s) — {permissions.length} permissions disponibles</span>
        <Button size="sm" onClick={openCreateRole}>+ Nouveau rôle</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
        {roles.map((role) => {
          const isEditing = editingRole?.id === role.id;
          return (
            <div key={role.id} className={`bg-gm-card border rounded-gm p-4 transition-all ${isEditing ? 'border-accent shadow-lg' : 'border-gm-border hover:border-gm-border-l'}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm">{role.label}</h4>
                {role.builtIn && <Badge variant="muted">Système</Badge>}
              </div>
              <div className="flex items-center gap-2 text-xs text-txt-muted mb-3">
                <span className="font-mono">{role.name}</span>
                <span>•</span>
                <span>Niveau {role.level}</span>
                <span>•</span>
                <span className="text-accent">{role.userCount} user(s)</span>
              </div>
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-xs text-txt-secondary">{role.permissions.length}/{permissions.length} permissions</span>
                <div className="flex-1 h-1.5 bg-gm-border rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all" style={{ width: Math.round((role.permissions.length / Math.max(permissions.length, 1)) * 100) + '%' }} />
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button variant={isEditing ? 'primary' : 'secondary'} size="sm" onClick={() => isEditing ? cancelEdit() : startEdit(role)}>
                  {isEditing ? '✕ Annuler' : '🔐 Permissions'}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => openEditRole(role)}>✏</Button>
                {!role.builtIn && role.userCount === 0 && (
                  <Button variant="danger" size="sm" onClick={() => deleteRole(role)}>🗑</Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Permission matrix */}
      {editingRole && (
        <div className="bg-gm-card border border-accent rounded-gm p-5 animate-fade">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-lg">Permissions : {editingRole.label}</h3>
              <p className="text-xs text-txt-muted mt-1">
                {editPerms.size} permission(s) sélectionnée(s) sur {permissions.length}
                {editingRole.builtIn && ' — Rôle système (modifications autorisées)'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setEditPerms(new Set())}>Tout décocher</Button>
              <Button variant="secondary" size="sm" onClick={() => setEditPerms(new Set(permissions.map((p) => p.code)))}>Tout cocher</Button>
              <Button onClick={savePermissions} disabled={saving} size="sm">
                {saving ? 'Enregistrement...' : '💾 Sauvegarder'}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {modules.map((mod) => {
              const modPerms = grouped[mod.code] || [];
              const checkedCount = modPerms.filter((p) => editPerms.has(p.code)).length;
              const allChecked = checkedCount === modPerms.length;
              const someChecked = checkedCount > 0 && !allChecked;

              return (
                <div key={mod.code} className="border border-gm-border rounded-gm-sm overflow-hidden">
                  {/* Module header */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-gm-input cursor-pointer hover:bg-gm-card-h transition-colors"
                    onClick={() => toggleModule(mod.code)}>
                    <input type="checkbox" checked={allChecked} readOnly
                      className="w-4 h-4 accent-accent"
                      ref={(el) => { if (el) el.indeterminate = someChecked; }} />
                    <span className="text-lg">{mod.icon}</span>
                    <span className="font-semibold text-sm flex-1">{mod.label}</span>
                    <span className="text-xs font-mono text-txt-muted">{checkedCount}/{modPerms.length}</span>
                  </div>

                  {/* Permissions grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
                    {modPerms.map((perm) => {
                      const checked = editPerms.has(perm.code);
                      return (
                        <label key={perm.code}
                          className={`flex items-center gap-2.5 px-4 py-2.5 cursor-pointer border-t border-r border-gm-border transition-colors ${checked ? 'bg-accent-light' : 'hover:bg-gm-card-h'}`}>
                          <input type="checkbox" checked={checked}
                            onChange={() => togglePerm(perm.code)}
                            className="w-3.5 h-3.5 accent-accent flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{perm.label}</div>
                            <div className="text-[0.65rem] text-txt-muted font-mono">{perm.code}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom save */}
          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-gm-border">
            <Button variant="secondary" onClick={cancelEdit}>Annuler</Button>
            <Button onClick={savePermissions} disabled={saving}>
              {saving ? 'Enregistrement...' : '💾 Sauvegarder les permissions'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Role Create/Edit Form ─────────────────────
function RoleForm({ role, onSuccess }: { role?: Role; onSuccess: () => void }) {
  const isEdit = !!role;
  const [form, setForm] = useState({ name: role?.name || '', label: role?.label || '', level: role?.level || 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function update(k: string, v: any) { setForm((f) => ({ ...f, [k]: v })); setError(''); }

  async function handleSubmit() {
    if (!form.name || !form.label) { setError('Nom et libellé obligatoires'); return; }
    setSaving(true);
    const method = isEdit ? 'PUT' : 'POST';
    const body = isEdit ? { id: role!.id, label: form.label, level: Number(form.level) } : { ...form, level: Number(form.level), permissionCodes: [] };
    const res = await fetch('/api/roles', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) onSuccess();
    else { const err = await res.json(); setError(err.error || 'Erreur'); }
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-danger-bg border border-danger/30 rounded-gm-sm px-4 py-2 text-sm text-danger">{error}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="gm-label">Nom technique *</label>
          <input className="gm-input text-sm" value={form.name} onChange={(e) => update('name', e.target.value)}
            readOnly={isEdit} style={isEdit ? { opacity: 0.6 } : undefined}
            placeholder="ex: superviseur_terrain" />
          <p className="text-[0.65rem] text-txt-muted mt-1">Identifiant unique, sans espaces</p>
        </div>
        <div>
          <label className="gm-label">Libellé affiché *</label>
          <input className="gm-input text-sm" value={form.label} onChange={(e) => update('label', e.target.value)}
            placeholder="ex: Superviseur terrain" />
        </div>
      </div>
      <div>
        <label className="gm-label">Niveau de priorité</label>
        <input type="number" className="gm-input text-sm w-[120px]" min={0} max={100} value={form.level}
          onChange={(e) => update('level', e.target.value)} />
        <p className="text-[0.65rem] text-txt-muted mt-1">0 = consultation, 100 = admin. Détermine la hiérarchie.</p>
      </div>
      <div className="flex justify-end pt-3 border-t border-gm-border">
        <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Enregistrement...' : isEdit ? 'Modifier' : 'Créer le rôle'}</Button>
      </div>
      {!isEdit && <p className="text-xs text-txt-muted">Après création, cliquez sur "🔐 Permissions" pour assigner les droits.</p>}
    </div>
  );
}
