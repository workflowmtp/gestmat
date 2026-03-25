import { create } from 'zustand';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface CurrentUser {
  id: string;
  username: string;
  fullname: string;
  email: string | null;
  phone: string | null;
  role: string;
  roleLabel: string;
  permissions: string[];
}

type Theme = 'dark' | 'light';

interface AppState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;

  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;

  modalOpen: boolean;
  modalContent: { title: string; body: React.ReactNode; footer?: React.ReactNode } | null;
  openModal: (content: { title: string; body: React.ReactNode; footer?: React.ReactNode }) => void;
  closeModal: () => void;

  currentUser: CurrentUser | null;
  userLoading: boolean;
  fetchCurrentUser: () => Promise<void>;
  clearCurrentUser: () => void;
}

function getInitialTheme(): Theme {
  if (typeof window !== 'undefined') {
    return (localStorage.getItem('gm-theme') as Theme) || 'dark';
  }
  return 'dark';
}

function applyTheme(theme: Theme) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gm-theme', theme);
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),

  theme: getInitialTheme(),
  setTheme: (theme) => { applyTheme(theme); set({ theme }); },
  toggleTheme: () => { const next = get().theme === 'dark' ? 'light' : 'dark'; applyTheme(next); set({ theme: next }); },

  toasts: [],
  showToast: (message, type = 'info') => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  modalOpen: false,
  modalContent: null,
  openModal: (content) => set({ modalOpen: true, modalContent: content }),
  closeModal: () => set({ modalOpen: false, modalContent: null }),

  currentUser: null,
  userLoading: true,
  fetchCurrentUser: async () => {
    try {
      set({ userLoading: true });
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        set({ currentUser: data, userLoading: false });
      } else {
        set({ currentUser: null, userLoading: false });
      }
    } catch {
      set({ currentUser: null, userLoading: false });
    }
  },
  clearCurrentUser: () => set({ currentUser: null, userLoading: false }),
}));
