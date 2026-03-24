'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useAppStore } from '@/stores/app-store';
import { hasPermission, hasAnyPermission } from '@/lib/permissions';
import { initials } from '@/lib/utils';

const NAV_SECTIONS = [
  {
    title: 'PRINCIPAL',
    items: [
      { href: '/dashboard',  icon: '⌂', label: 'Tableau de bord', perm: null },
      { href: '/inventory',  icon: '📦', label: 'Inventaire général', perm: 'items.view' },
      { href: '/movements',  icon: '⇄', label: 'Mouvements', perm: 'movements.view' },
    ],
  },
  {
    title: 'MÉTIER',
    items: [
      { href: '/dotations',  icon: '🦺', label: 'Dotations EPI', perm: 'dotations.view' },
      { href: '/controls',   icon: '🔧', label: 'Contrôles & Maintenance', perm: 'controls.view' },
      { href: '/campaigns',  icon: '📋', label: 'Inventaires physiques', perm: 'campaigns.view' },
    ],
  },
  {
    title: 'SUIVI',
    items: [
      { href: '/alerts',   icon: '⚠', label: 'Centre d\'alertes', perm: 'alerts.view', badge: true },
      { href: '/reports',  icon: '📈', label: 'Rapports & exports', perm: 'reports.view' },
      { href: '/audit',    icon: '📜', label: 'Journal d\'audit', perm: 'audit.view' },
    ],
  },
  {
    title: 'ADMIN',
    items: [
      { href: '/config', icon: '⚙', label: 'Configuration', perm: ['config.locations','config.families','config.users','config.roles','config.settings'] },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, closeSidebar, currentUser } = useAppStore();

  const perms: string[] = currentUser?.permissions || [];
  const userInitials = currentUser?.fullname ? initials(currentUser.fullname) : '??';

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-[99] lg:hidden" onClick={closeSidebar} />
      )}

      <aside className={`
        fixed left-0 top-0 h-screen w-[260px] bg-gm-sidebar border-r border-gm-border
        flex flex-col z-[100] transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Brand */}
        <div className="px-5 py-5 border-b border-gm-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              GM
            </div>
            <div>
              <h2 className="text-[1.05rem] font-bold text-txt-primary leading-tight">GEST-MAT</h2>
              <span className="text-[0.7rem] text-txt-muted uppercase tracking-widest">BTP Management</span>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-gm-border flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-accent-light flex items-center justify-center font-semibold text-accent text-sm flex-shrink-0">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-txt-primary truncate">{currentUser?.fullname || 'Utilisateur'}</div>
            <div className="text-[0.72rem] text-txt-muted uppercase tracking-wide">{currentUser?.roleLabel || currentUser?.role || ''}</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3">
          {NAV_SECTIONS.map((section) => {
            // Filter items by permission
            const visibleItems = section.items.filter(
              (item) => !item.perm || (Array.isArray(item.perm) ? hasAnyPermission(perms, item.perm) : hasPermission(perms, item.perm))
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="px-3 mb-1">
                <div className="text-[0.65rem] font-semibold text-txt-muted uppercase tracking-[0.1em] px-3 pt-3 pb-1.5">
                  {section.title}
                </div>
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeSidebar}
                      className={`
                        flex items-center gap-2.5 px-3 py-2.5 my-0.5 rounded-gm-sm
                        text-[0.88rem] font-medium transition-all relative
                        ${isActive
                          ? 'nav-active'
                          : 'text-txt-secondary hover:bg-gm-card hover:text-txt-primary'
                        }
                      `}>
                      <span className="w-5 text-center text-base flex-shrink-0">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-5 py-3 border-t border-gm-border">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-2 px-3 py-2.5 w-full border border-gm-border rounded-gm-sm
              text-txt-secondary text-sm transition-all
              hover:border-danger hover:text-danger hover:bg-danger-bg">
            <span>⏻</span>
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}
