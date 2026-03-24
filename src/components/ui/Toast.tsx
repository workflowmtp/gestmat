'use client';

import { useAppStore } from '@/stores/app-store';

const STYLES = {
  success: 'bg-[#065f46] text-[#a7f3d0] border-success',
  error:   'bg-[#7f1d1d] text-[#fca5a5] border-danger',
  warning: 'bg-[#78350f] text-[#fde68a] border-warning',
  info:    'bg-[#1e3a5f] text-[#93c5fd] border-info',
};

const ICONS = { success: '✓', error: '✗', warning: '⚠', info: 'ℹ' };

export default function ToastContainer() {
  const { toasts, removeToast } = useAppStore();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => removeToast(t.id)}
          className={`
            px-5 py-3.5 rounded-gm-sm text-sm font-medium shadow-2xl
            flex items-center gap-2.5 border cursor-pointer
            animate-toast max-w-[380px]
            ${STYLES[t.type]}
          `}>
          <span>{ICONS[t.type]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
