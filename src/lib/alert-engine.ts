import prisma from '@/lib/prisma';

export interface Alert {
  id: string;
  type: 'danger' | 'warning' | 'info';
  severity: number; // 1=info, 2=warning, 3=critical
  icon: string;
  title: string;
  text: string;
  itemId?: string;
  itemCode?: string;
  module: string;
}

export async function computeAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = [];
  const now = new Date();
  const dayMs = 86400000;

  const items = await prisma.item.findMany({
    where: { archiveState: 'actif' },
    include: { type: true, location: true, family: true },
  });

  const dotations = await prisma.dotation.findMany();

  for (const it of items) {

    // 1. Retour en retard
    if (it.returnDate && new Date(it.returnDate) < now) {
      const days = Math.round((now.getTime() - new Date(it.returnDate).getTime()) / dayMs);
      alerts.push({ id: 'ret-' + it.id, type: 'danger', severity: 3, icon: '⏰', title: 'Retour en retard', text: it.code + ' — ' + it.designation + ' (' + days + 'j de retard)', itemId: it.id, itemCode: it.code, module: 'movements' });
    }

    // 2. Retour proche (< 3j)
    if (it.returnDate && new Date(it.returnDate) >= now) {
      const days = Math.round((new Date(it.returnDate).getTime() - now.getTime()) / dayMs);
      if (days <= 3) {
        alerts.push({ id: 'retw-' + it.id, type: 'warning', severity: 2, icon: '📅', title: 'Retour imminent', text: it.code + ' — retour dans ' + days + 'j', itemId: it.id, itemCode: it.code, module: 'movements' });
      }
    }

    // 3. Contrôle en retard
    if (it.nextControlDate && new Date(it.nextControlDate) <= now) {
      const days = Math.round((now.getTime() - new Date(it.nextControlDate).getTime()) / dayMs);
      alerts.push({ id: 'ctrl-' + it.id, type: 'danger', severity: 3, icon: '🔧', title: 'Contrôle en retard', text: it.code + ' — contrôle dépassé de ' + days + 'j', itemId: it.id, itemCode: it.code, module: 'controls' });
    }

    // 4. Contrôle proche (< 15j)
    if (it.nextControlDate && new Date(it.nextControlDate) > now) {
      const days = Math.round((new Date(it.nextControlDate).getTime() - now.getTime()) / dayMs);
      if (days <= 15) {
        alerts.push({ id: 'ctrlw-' + it.id, type: 'warning', severity: 2, icon: '🔧', title: 'Contrôle imminent', text: it.code + ' — contrôle dans ' + days + 'j', itemId: it.id, itemCode: it.code, module: 'controls' });
      }
    }

    // 5. Fin de vie atteinte
    if (it.purchaseDate && it.lifespanDays && it.lifespanDays > 0) {
      const svc = it.serviceDate || it.purchaseDate;
      const used = Math.round((now.getTime() - new Date(svc).getTime()) / dayMs);
      if (used >= it.lifespanDays) {
        alerts.push({ id: 'eol-' + it.id, type: 'danger', severity: 3, icon: '⚠', title: 'Fin de vie atteinte', text: it.code + ' — durée de vie dépassée', itemId: it.id, itemCode: it.code, module: 'inventory' });
      } else if (it.lifespanAlertDays && (it.lifespanDays - used) <= it.lifespanAlertDays) {
        alerts.push({ id: 'eolw-' + it.id, type: 'warning', severity: 2, icon: '⚠', title: 'Fin de vie proche', text: it.code + ' — ' + (it.lifespanDays - used) + 'j restants', itemId: it.id, itemCode: it.code, module: 'inventory' });
      }
    }

    // 6. Stock bas
    if (it.minStock && it.qtyAvailable !== null && it.qtyAvailable <= it.minStock) {
      const severity = it.qtyAvailable === 0 ? 3 : 2;
      alerts.push({ id: 'stock-' + it.id, type: it.qtyAvailable === 0 ? 'danger' : 'warning', severity, icon: '📦', title: 'Stock bas', text: it.code + ' — ' + it.qtyAvailable + '/' + it.minStock + ' (min)', itemId: it.id, itemCode: it.code, module: 'inventory' });
    }

    // 7. Hors service
    if (it.state === 'hors service') {
      alerts.push({ id: 'hs-' + it.id, type: 'danger', severity: 2, icon: '⛔', title: 'Hors service', text: it.code + ' — ' + it.designation, itemId: it.id, itemCode: it.code, module: 'inventory' });
    }

    // 8. Perdu / Volé
    if (it.state === 'perdu' || it.state === 'volé') {
      alerts.push({ id: 'lost-' + it.id, type: 'danger', severity: 3, icon: '❓', title: 'Perdu / Volé', text: it.code + ' — ' + it.designation + ' (' + it.state + ')', itemId: it.id, itemCode: it.code, module: 'inventory' });
    }

    // 9. Non conforme
    if (it.conformity === 'non conforme') {
      alerts.push({ id: 'nc-' + it.id, type: 'warning', severity: 2, icon: '⚠', title: 'Non conforme', text: it.code + ' — ' + it.designation, itemId: it.id, itemCode: it.code, module: 'controls' });
    }

    // 10. À contrôler (state)
    if (it.state === 'à contrôler') {
      alerts.push({ id: 'toctl-' + it.id, type: 'info', severity: 1, icon: '🔍', title: 'À contrôler', text: it.code + ' — état marqué "à contrôler"', itemId: it.id, itemCode: it.code, module: 'controls' });
    }

    // 11. À réparer
    if (it.state === 'à réparer') {
      alerts.push({ id: 'rep-' + it.id, type: 'warning', severity: 2, icon: '🔧', title: 'À réparer', text: it.code + ' — ' + it.designation, itemId: it.id, itemCode: it.code, module: 'controls' });
    }
  }

  // 12. Dotations EPI expirées
  for (const d of dotations) {
    if (d.renewalDate && new Date(d.renewalDate) <= now) {
      const days = Math.round((now.getTime() - new Date(d.renewalDate).getTime()) / dayMs);
      alerts.push({ id: 'epi-' + d.id, type: 'warning', severity: 2, icon: '🦺', title: 'Dotation EPI expirée', text: d.epiLabel + ' — ' + d.employeeName + ' (expiré ' + days + 'j)', module: 'dotations' });
    }
  }

  // 13. Dotations proches du renouvellement (< 15j)
  for (const d of dotations) {
    if (d.renewalDate && new Date(d.renewalDate) > now) {
      const days = Math.round((new Date(d.renewalDate).getTime() - now.getTime()) / dayMs);
      if (days <= 15) {
        alerts.push({ id: 'epiw-' + d.id, type: 'info', severity: 1, icon: '🦺', title: 'Dotation à renouveler bientôt', text: d.epiLabel + ' — ' + d.employeeName + ' (' + days + 'j)', module: 'dotations' });
      }
    }
  }

  // 14. Campagnes d'inventaire en cours
  const activeCamps = await prisma.inventoryCampaign.count({ where: { status: 'en cours' } });
  if (activeCamps > 0) {
    alerts.push({ id: 'camp-active', type: 'info', severity: 1, icon: '📋', title: 'Inventaire en cours', text: activeCamps + ' campagne(s) d\'inventaire en cours', module: 'campaigns' });
  }

  // Sort by severity desc
  alerts.sort((a, b) => b.severity - a.severity);
  return alerts;
}
