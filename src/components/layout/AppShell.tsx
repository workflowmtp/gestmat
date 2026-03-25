'use client';

import { useEffect } from 'react';
import Sidebar from './Sidebar';
import ToastContainer from '@/components/ui/Toast';
import ModalContainer from '@/components/ui/Modal';
import AiAgentPanel from '@/components/ai/AiAgentPanel';
import { useAppStore } from '@/stores/app-store';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const fetchCurrentUser = useAppStore((s) => s.fetchCurrentUser);
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Apply theme on mount and when it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 lg:ml-[260px] flex flex-col min-h-screen">
        {children}
      </div>
      <ToastContainer />
      <ModalContainer />
      <AiAgentPanel />
    </div>
  );
}
