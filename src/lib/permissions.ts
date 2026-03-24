import { auth } from '@/lib/auth';

// ═══════════════════════════════════════
// SERVER-SIDE: vérification permissions dans API routes
// ═══════════════════════════════════════

export async function getServerPermissions(): Promise<string[]> {
  const session = await auth();
  return (session?.user as any)?.permissions || [];
}

export async function checkServerPermission(code: string): Promise<boolean> {
  const perms = await getServerPermissions();
  return perms.includes(code);
}

export async function requirePermission(code: string) {
  const allowed = await checkServerPermission(code);
  if (!allowed) {
    throw new Error('Permission refusée: ' + code);
  }
}

export async function getServerUser() {
  const session = await auth();
  if (!session?.user) return null;
  const u = session.user as any;
  return {
    id: u.id as string,
    name: u.name as string,
    email: u.email as string | null,
    role: u.role as string,
    roleLabel: u.roleLabel as string,
    permissions: (u.permissions || []) as string[],
  };
}

// ═══════════════════════════════════════
// CLIENT-SIDE: hook React pour vérifier permissions
// ═══════════════════════════════════════

// Utilisé dans les composants client via useSession()
export function hasPermission(permissions: string[], code: string): boolean {
  return permissions.includes(code);
}

export function hasAnyPermission(permissions: string[], codes: string[]): boolean {
  return codes.some((c) => permissions.includes(c));
}

// ═══════════════════════════════════════
// MODULES (pour le menu de configuration des rôles)
// ═══════════════════════════════════════

export const PERMISSION_MODULES = [
  { code: 'items',      label: 'Inventaire',          icon: '📦' },
  { code: 'movements',  label: 'Mouvements',          icon: '⇄' },
  { code: 'dotations',  label: 'Dotations EPI',       icon: '🦺' },
  { code: 'controls',   label: 'Contrôles',           icon: '🔧' },
  { code: 'campaigns',  label: 'Inventaires physiques',icon: '📋' },
  { code: 'alerts',     label: 'Alertes',             icon: '⚠' },
  { code: 'reports',    label: 'Rapports',            icon: '📈' },
  { code: 'audit',      label: 'Journal d\'audit',    icon: '📜' },
  { code: 'config',     label: 'Configuration',       icon: '⚙' },
  { code: 'ai',         label: 'Agent IA',            icon: '🤖' },
];
