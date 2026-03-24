'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';

interface TopHeaderProps {
  title: string;
}

export default function TopHeader({ title }: TopHeaderProps) {
  const router = useRouter();
  const { toggleSidebar } = useAppStore();

  function handleSearch(value: string) {
    if (value.length >= 2) {
      router.push('/inventory?q=' + encodeURIComponent(value));
    }
  }

  return (
    <header className="h-[60px] bg-gm-surface border-b border-gm-border flex items-center px-7 gap-4 sticky top-0 z-50">
      {/* Mobile menu toggle */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden bg-transparent border-none text-txt-primary text-xl cursor-pointer p-1.5">
        ☰
      </button>

      {/* Page title */}
      <h1 className="text-lg font-bold text-txt-primary flex-1">{title}</h1>

      {/* Search */}
      <div className="relative w-[280px] hidden sm:block">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted text-sm">🔍</span>
        <input
          type="text"
          placeholder="Recherche globale..."
          className="gm-input pl-9 py-2 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch((e.target as HTMLInputElement).value);
          }}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push('/alerts')}
          title="Alertes"
          className="w-[38px] h-[38px] rounded-gm-sm bg-gm-input border border-gm-border text-txt-secondary
            flex items-center justify-center transition-all hover:border-accent hover:text-accent relative">
          ⚠
        </button>
        <button
          onClick={() => window.print()}
          title="Imprimer"
          className="w-[38px] h-[38px] rounded-gm-sm bg-gm-input border border-gm-border text-txt-secondary
            flex items-center justify-center transition-all hover:border-accent hover:text-accent">
          🖨
        </button>
      </div>
    </header>
  );
}
