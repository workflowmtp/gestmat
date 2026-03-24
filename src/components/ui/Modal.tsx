'use client';

import { useAppStore } from '@/stores/app-store';

export default function ModalContainer() {
  const { modalOpen, modalContent, closeModal } = useAppStore();

  if (!modalOpen || !modalContent) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center p-5 backdrop-blur-[4px]"
      onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
      <div className="bg-gm-card border border-gm-border rounded-gm-lg w-full max-w-[780px] max-h-[90vh] overflow-y-auto shadow-2xl animate-fade">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gm-border">
          <h3 className="text-lg font-semibold text-txt-primary">{modalContent.title}</h3>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-gm-sm bg-gm-input text-txt-secondary flex items-center justify-center
              hover:bg-danger-bg hover:text-danger transition-all text-lg">
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {modalContent.body}
        </div>

        {/* Footer */}
        {modalContent.footer && (
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-gm-border">
            {modalContent.footer}
          </div>
        )}
      </div>
    </div>
  );
}
