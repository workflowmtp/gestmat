'use client';

import { hasPermission, hasAnyPermission } from '@/lib/permissions';
import { useAppStore } from '@/stores/app-store';

interface PermissionGateProps {
  permission?: string;
  permissions?: string[];
  mode?: 'all' | 'any';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function PermissionGate({ permission, permissions, mode = 'any', children, fallback }: PermissionGateProps) {
  const currentUser = useAppStore((s) => s.currentUser);
  const userPerms: string[] = currentUser?.permissions || [];

  let allowed = false;
  if (permission) {
    allowed = hasPermission(userPerms, permission);
  } else if (permissions) {
    if (mode === 'all') {
      allowed = permissions.every((p) => hasPermission(userPerms, p));
    } else {
      allowed = hasAnyPermission(userPerms, permissions);
    }
  } else {
    allowed = true;
  }

  if (!allowed) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

// Lock banner for restricted sections
export function PermissionBanner({ message }: { message?: string }) {
  return (
    <div className="bg-warning-bg border border-warning/30 rounded-gm p-5 text-center">
      <span className="text-2xl mb-2 block">🔒</span>
      <p className="text-sm text-warning">{message || 'Vous n\'avez pas les permissions nécessaires pour cette action.'}</p>
    </div>
  );
}
