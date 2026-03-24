'use client';

import { useRef } from 'react';
import Button from './Button';
import { useAppStore } from '@/stores/app-store';

interface PhotoUploadProps {
  value: string | null;
  onChange: (data: string | null) => void;
  maxSizeMb?: number;
}

export default function PhotoUpload({ value, onChange, maxSizeMb = 2 }: PhotoUploadProps) {
  const { showToast } = useAppStore();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxSizeMb * 1024 * 1024) {
      showToast('Photo trop lourde (max ' + maxSizeMb + ' Mo)', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex gap-4 items-start">
      <div className="w-[120px] h-[90px] rounded-gm-sm border-2 border-dashed border-gm-border flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer bg-gm-input"
        onClick={() => inputRef.current?.click()}>
        {value ? (
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl text-txt-muted">📷</span>
        )}
      </div>
      <div>
        <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
        <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
          📷 {value ? 'Changer' : 'Ajouter'}
        </Button>
        {value && (
          <Button variant="ghost" size="sm" className="ml-2 text-danger" onClick={() => { onChange(null); if (inputRef.current) inputRef.current.value = ''; }}>
            Supprimer
          </Button>
        )}
        <p className="text-xs text-txt-muted mt-2">JPG, PNG ou WebP — Max {maxSizeMb} Mo</p>
      </div>
    </div>
  );
}
