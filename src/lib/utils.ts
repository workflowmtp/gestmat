// ═══════════════════════════════════════
// GEST-MAT BTP — Fonctions utilitaires
// ═══════════════════════════════════════

export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return '0';
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function formatCurrency(n: number | null | undefined): string {
  return formatNumber(Math.round(n || 0)) + ' FCFA';
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '-';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '-';
  return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return '-';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '-';
  return dt.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' })
    + ' ' + dt.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
}

export function daysBetween(a: Date | string, b: Date | string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function daysFromNow(d: Date | string): number {
  return daysBetween(new Date(), new Date(d));
}

export function truncate(s: string | null | undefined, len: number): string {
  if (!s) return '';
  return s.length > len ? s.substring(0, len) + '...' : s;
}

export function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase();
}

// ═══════════════════════════════════════
// CONSTANTES MÉTIER
// ═══════════════════════════════════════

export const ITEM_STATES = [
  'neuf','bon','moyen','usé','à contrôler','à réparer','hors service','perdu','volé','rebuté',
] as const;

export const LOCATION_TYPES = [
  'magasin','dépôt','chantier','atelier','véhicule','utilisateur','sous-traitant','zone quarantaine','rebut',
] as const;

export const MOVEMENT_TYPES = [
  'entrée en stock','sortie','prêt','retour','transfert','affectation','restitution',
  'mise au rebut','perte','vol','maintenance','contrôle','correction inventaire',
] as const;

export const CONFORMITY_VALUES = ['conforme','non conforme','à vérifier'] as const;

export const ARCHIVE_STATES = ['actif','archivé','rebuté'] as const;

export const INSPECTION_TYPES = [
  'Contrôle périodique','Maintenance préventive','Maintenance corrective',
  'Vérification sécurité','Calibration','Inspection visuelle',
  'Changement d\'état','Motif de réforme',
] as const;

export const EPI_TYPES = [
  { key:'casque',          label:'Casque de chantier',   icon:'🪖' },
  { key:'gants',           label:'Gants de protection',  icon:'🧤' },
  { key:'bottes',          label:'Bottes sécurité',      icon:'🥾' },
  { key:'lunettes',        label:'Lunettes de protection',icon:'🕶' },
  { key:'harnais',         label:'Harnais antichute',    icon:'🧷' },
  { key:'gilet',           label:'Gilet de signalisation',icon:'🦺' },
  { key:'masque',          label:'Masque respiratoire',  icon:'😷' },
  { key:'casque_antibruit',label:'Protection auditive',  icon:'🎧' },
] as const;

// ═══════════════════════════════════════
// MOTEUR DE STATUT CALCULÉ
// ═══════════════════════════════════════

export type ComputedStatus =
  | 'disponible' | 'affecté' | 'en prêt' | 'en retard'
  | 'en fin de vie' | 'hors service' | 'indisponible'
  | 'perdu / volé' | 'à inspection';

export function computeItemStatus(item: {
  state: string;
  returnDate?: Date | string | null;
  purchaseDate?: Date | string | null;
  serviceDate?: Date | string | null;
  lifespanDays?: number | null;
  lifespanAlertDays?: number | null;
  nextControlDate?: Date | string | null;
  location?: { type: string } | null;
  locationId?: string | null;
  qtyAvailable?: number;
  qty?: number;
}): ComputedStatus {
  // Priority chain
  if (item.state === 'perdu' || item.state === 'volé') return 'perdu / volé';
  if (item.state === 'hors service' || item.state === 'rebuté') return 'hors service';
  if (item.state === 'à réparer') return 'indisponible';

  // Overdue return
  if (item.returnDate && daysFromNow(item.returnDate) < 0) return 'en retard';

  // End of life
  if (item.purchaseDate && item.lifespanDays && item.lifespanDays > 0) {
    const used = daysBetween(item.serviceDate || item.purchaseDate, new Date());
    if (used >= item.lifespanDays) return 'en fin de vie';
    if (item.lifespanAlertDays && (item.lifespanDays - used) <= item.lifespanAlertDays) return 'en fin de vie';
  }

  // Inspection needed
  if (item.state === 'à contrôler') return 'à inspection';
  if (item.nextControlDate && daysFromNow(item.nextControlDate) <= 0) return 'à inspection';

  // Location based
  const locType = item.location?.type;
  if (locType && locType !== 'magasin' && locType !== 'dépôt') {
    return item.returnDate ? 'en prêt' : 'affecté';
  }

  if ((item.qtyAvailable ?? 0) <= 0 && (item.qty ?? 0) > 0) return 'indisponible';

  return 'disponible';
}

export function getStatusColor(status: ComputedStatus): string {
  const map: Record<ComputedStatus, string> = {
    'disponible': 'success', 'affecté': 'info', 'en prêt': 'cyan',
    'en retard': 'danger', 'en fin de vie': 'warning', 'hors service': 'danger',
    'indisponible': 'muted', 'perdu / volé': 'danger', 'à inspection': 'purple',
  };
  return map[status] || 'muted';
}

export function getStateColor(state: string): string {
  const map: Record<string, string> = {
    'neuf':'success','bon':'success','moyen':'warning','usé':'warning',
    'à contrôler':'purple','à réparer':'info','hors service':'danger',
    'perdu':'danger','volé':'danger','rebuté':'muted',
  };
  return map[state] || 'muted';
}

export function getMovementColor(type: string): string {
  const map: Record<string, string> = {
    'entrée en stock':'success','sortie':'danger','prêt':'info','retour':'success',
    'transfert':'purple','affectation':'cyan','restitution':'success','mise au rebut':'muted',
    'perte':'danger','vol':'danger','maintenance':'warning','contrôle':'purple','correction inventaire':'warning',
  };
  return map[type] || 'muted';
}
