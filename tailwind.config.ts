import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gm: {
          bg:       '#0f1117',
          surface:  '#161922',
          card:     '#1c1f2e',
          'card-h': '#232738',
          input:    '#1a1d2b',
          sidebar:  '#12141e',
          border:   '#2a2d3e',
          'border-l':'#353850',
        },
        accent:     { DEFAULT:'#f59e0b', hover:'#d97706', light:'rgba(245,158,11,0.12)' },
        success:    { DEFAULT:'#10b981', bg:'rgba(16,185,129,0.12)' },
        danger:     { DEFAULT:'#ef4444', bg:'rgba(239,68,68,0.12)' },
        warning:    { DEFAULT:'#f59e0b', bg:'rgba(245,158,11,0.12)' },
        info:       { DEFAULT:'#3b82f6', bg:'rgba(59,130,246,0.12)' },
        purple:     { DEFAULT:'#8b5cf6', bg:'rgba(139,92,246,0.12)' },
        cyan:       { DEFAULT:'#06b6d4', bg:'rgba(6,182,212,0.12)' },
        txt: {
          primary:   '#e8eaf0',
          secondary: '#8b8fa8',
          muted:     '#5c6078',
          label:     '#a0a4bc',
        },
      },
      fontFamily: {
        body: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        gm:   '10px',
        'gm-sm': '6px',
        'gm-lg': '14px',
      },
    },
  },
  plugins: [],
};

export default config;
