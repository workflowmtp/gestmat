import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// ═══════════════════════════════════════
// SERVER-SIDE: vérification permissions dans API routes
// Permissions are fetched FRESH from DB, not from JWT token
// ═══════════════════════════════════════

export async function getServerPermissions(): Promise<string[]> {
  const user = await getServerUser();
  return user?.permissions || [];
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
  const userId = (session.user as any).id;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  if (!user || !user.active) return null;

  return {
    id: user.id,
    name: user.fullname,
    email: user.email,
    role: user.role.name,
    roleLabel: user.role.label,
    permissions: user.role.permissions.map((rp) => rp.permission.code),
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
