import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gm: {
          bg:       'var(--gm-bg)',
          surface:  'var(--gm-surface)',
          card:     'var(--gm-card)',
          'card-h': 'var(--gm-card-h)',
          input:    'var(--gm-input)',
          sidebar:  'var(--gm-sidebar)',
          border:   'var(--gm-border)',
          'border-l':'var(--gm-border-l)',
        },
        accent:     { DEFAULT:'var(--accent)', hover:'var(--accent-hover)', light:'var(--accent-light)' },
        success:    { DEFAULT:'var(--success)', bg:'var(--success-bg)' },
        danger:     { DEFAULT:'var(--danger)', bg:'var(--danger-bg)' },
        warning:    { DEFAULT:'var(--warning)', bg:'var(--warning-bg)' },
        info:       { DEFAULT:'var(--info)', bg:'var(--info-bg)' },
        purple:     { DEFAULT:'var(--purple)', bg:'var(--purple-bg)' },
        cyan:       { DEFAULT:'var(--cyan)', bg:'var(--cyan-bg)' },
        txt: {
          primary:   'var(--txt-primary)',
          secondary: 'var(--txt-secondary)',
          muted:     'var(--txt-muted)',
          label:     'var(--txt-label)',
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
