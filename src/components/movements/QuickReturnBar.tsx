'use client';

import { daysFromNow, formatDate } from '@/lib/utils';

interface QuickReturnBarProps {
  items: any[];
  onReturn: (itemId: string) => void;
}

export default function QuickReturnBar({ items, onReturn }: QuickReturnBarProps) {
  if (!items.length) return null;

  return (
    <div className="bg-danger-bg border border-danger/30 rounded-gm p-4 mb-5">
      <h4 className="text-sm font-semibold text-danger mb-3 flex items-center gap-2">
        ⏰ Retours en retard
        <span className="bg-danger text-white text-xs px-2 py-0.5 rounded-xl">{items.length}</span>
      </h4>
      <div className="flex flex-wrap gap-2">
        {items.slice(0, 10).map((it) => {
          const days = Math.abs(daysFromNow(it.returnDate));
          return (
            <div key={it.id}
              className="inline-flex items-center gap-2 px-3 py-2 bg-gm-card border border-gm-border rounded-gm-sm text-sm cursor-pointer hover:border-danger transition-all"
              onClick={() => {
                if (confirm('Retour rapide de ' + it.code + ' — ' + it.designation + ' ?')) {
                  onReturn(it.id);
                }
              }}>
              <span className="font-mono text-accent text-xs">{it.code}</span>
              <span className="text-txt-secondary truncate max-w-[150px]">{it.designation}</span>
              <span className="text-danger text-xs font-bold">-{days}j</span>
              <span className="text-success text-xs">↩</span>
            </div>
          );
        })}
        {items.length > 10 && (
          <span className="text-xs text-txt-muted self-center">+{items.length - 10} autres</span>
        )}
      </div>
    </div>
  );
}
