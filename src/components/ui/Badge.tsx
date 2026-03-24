import { clsx } from 'clsx';

const VARIANTS: Record<string, string> = {
  success: 'badge-success',
  danger:  'badge-danger',
  warning: 'badge-warning',
  info:    'badge-info',
  purple:  'badge-purple',
  cyan:    'badge-cyan',
  muted:   'badge-muted',
};

interface BadgeProps {
  variant?: keyof typeof VARIANTS;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ variant = 'muted', children, className }: BadgeProps) {
  return (
    <span className={clsx('badge', VARIANTS[variant] || VARIANTS.muted, className)}>
      {children}
    </span>
  );
}

// Raccourcis pour status/state/conformity
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    'disponible':'success','affecté':'info','en prêt':'cyan','en retard':'danger',
    'en fin de vie':'warning','hors service':'danger','indisponible':'muted',
    'perdu / volé':'danger','à inspection':'purple',
  };
  return <Badge variant={(map[status] || 'muted') as any}>{status}</Badge>;
}

export function StateBadge({ state }: { state: string }) {
  const map: Record<string, string> = {
    'neuf':'success','bon':'success','moyen':'warning','usé':'warning',
    'à contrôler':'purple','à réparer':'info','hors service':'danger',
    'perdu':'danger','volé':'danger','rebuté':'muted',
  };
  return <Badge variant={(map[state] || 'muted') as any}>{state}</Badge>;
}

export function ConformityBadge({ value }: { value: string }) {
  const map: Record<string, string> = { 'conforme':'success','non conforme':'danger','à vérifier':'warning' };
  return <Badge variant={(map[value] || 'muted') as any}>{value || '-'}</Badge>;
}
