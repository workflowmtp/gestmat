'use client';

import { useState } from 'react';
import { hasPermission } from '@/lib/permissions';
import { useAppStore } from '@/stores/app-store';
import LocationsManager from './LocationsManager';
import FamiliesManager from './FamiliesManager';
import UsersManager from './UsersManager';
import RolePermissionMatrix from './RolePermissionMatrix';
import SettingsManager from './SettingsManager';

export default function ConfigClient() {
  const currentUser = useAppStore((s) => s.currentUser);
  const perms = currentUser?.permissions || [];
  const [tab, setTab] = useState('');

  const tabs = [
    { key: 'locations', label: '📍 Localisations', perm: 'config.locations' },
    { key: 'families', label: '🏷 Familles', perm: 'config.families' },
    { key: 'users', label: '👥 Utilisateurs', perm: 'config.users' },
    { key: 'roles', label: '🔐 Rôles & Permissions', perm: 'config.roles' },
    { key: 'settings', label: '⚙ Paramètres', perm: 'config.settings' },
  ].filter((t) => hasPermission(perms, t.perm));

  // Set first available tab
  if (tabs.length && !tab) {
    setTab(tabs[0].key);
  }

  if (!tabs.length) {
    return (
      <div className="bg-warning-bg border border-warning/30 rounded-gm p-6 text-center">
        <p className="text-warning text-sm">🔒 Vous n&apos;avez pas les permissions nécessaires pour accéder à la configuration.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-1 border-b border-gm-border mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              tab === t.key ? 'text-accent border-accent' : 'text-txt-secondary border-transparent hover:text-txt-primary'
            }`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="animate-fade">
        {tab === 'locations' && <LocationsManager />}
        {tab === 'families' && <FamiliesManager />}
        {tab === 'users' && <UsersManager />}
        {tab === 'roles' && <RolePermissionMatrix />}
        {tab === 'settings' && <SettingsManager />}
      </div>
    </div>
  );
}
