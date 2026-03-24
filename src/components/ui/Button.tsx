import { clsx } from 'clsx';

const VARIANTS: Record<string, string> = {
  primary:   'bg-accent text-white hover:bg-accent-hover',
  secondary: 'bg-gm-input border border-gm-border text-txt-secondary hover:border-txt-muted hover:text-txt-primary',
  danger:    'bg-danger text-white hover:brightness-110',
  success:   'bg-success text-white hover:brightness-110',
  info:      'bg-info text-white hover:brightness-110',
  ghost:     'bg-transparent text-txt-secondary hover:bg-gm-card hover:text-txt-primary',
};

const SIZES: Record<string, string> = {
  sm: 'px-3.5 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  children: React.ReactNode;
}

export default function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'rounded-gm-sm font-semibold cursor-pointer transition-all inline-flex items-center gap-1.5',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}>
      {children}
    </button>
  );
}
