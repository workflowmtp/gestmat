import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';

export async function GET() {
  try {
    const items = await prisma.item.findMany({
      where: { archiveState: { not: 'archivé' } },
      include: { type: true, family: true, location: true },
    });

    const now = new Date();
    let tO = 0, tE = 0, tV = 0, iM = 0, af = 0, ov = 0, eol = 0, hs = 0, lo = 0;
    const byType: Record<string, number> = {};
    const byState: Record<string, number> = {};
    const byFamily: Record<string, number> = {};
    const byLocation: Record<string, number> = {};
    const byResponsible: Record<string, number> = {};

    // Lifecycle counters
    let lcMaint = 0, lcRebut = 0, lcCtrl = 0;

    for (const it of items) {
      const typeName = it.type?.name || '?';
      byType[typeName] = (byType[typeName] || 0) + 1;
      byState[it.state] = (byState[it.state] || 0) + 1;
      if (it.family) byFamily[it.family.name] = (byFamily[it.family.name] || 0) + 1;
      if (it.location) byLocation[it.location.name] = (byLocation[it.location.name] || 0) + 1;
      if (it.responsible) byResponsible[it.responsible] = (byResponsible[it.responsible] || 0) + 1;

      if (typeName === 'Outillage') tO++;
      if (typeName === 'EPI') tE++;
      tV += (it.unitCost || 0) * (it.qty || 1);

      const locType = it.location?.type;
      if (locType === 'magasin' || locType === 'dépôt') iM++;

      // Status computation
      if (it.state === 'perdu' || it.state === 'volé') { lo++; continue; }
      if (it.state === 'hors service' || it.state === 'rebuté') { hs++; continue; }
      if (it.state === 'à réparer') { lcMaint++; continue; }

      if (it.returnDate && new Date(it.returnDate) < now) { ov++; continue; }

      if (it.purchaseDate && it.lifespanDays && it.lifespanDays > 0) {
        const svc = it.serviceDate || it.purchaseDate;
        const used = Math.round((now.getTime() - new Date(svc).getTime()) / 86400000);
        if (used >= it.lifespanDays) { eol++; continue; }
        if (it.lifespanAlertDays && (it.lifespanDays - used) <= it.lifespanAlertDays) { eol++; continue; }
      }

      if (it.nextControlDate && new Date(it.nextControlDate) <= now) lcCtrl++;

      if (locType && locType !== 'magasin' && locType !== 'dépôt') af++;

      if (it.archiveState === 'rebuté') lcRebut++;
    }

    // Recent movements
    const recentMvts = await prisma.movement.findMany({
      include: { item: { select: { code: true, designation: true } }, user: { select: { fullname: true } } },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    // Dotations & campaigns counts
    const dotCount = await prisma.dotation.count();
    const campActive = await prisma.inventoryCampaign.count({ where: { status: 'en cours' } });

    // Alerts count (simplified)
    let alertCount = ov + eol + hs + lo + lcCtrl + lcMaint;
    const itemsAll = await prisma.item.findMany({ where: { archiveState: 'actif' }, select: { minStock: true, qtyAvailable: true } });
    for (const ia of itemsAll) {
      if (ia.minStock && ia.qtyAvailable !== null && ia.qtyAvailable <= ia.minStock) alertCount++;
    }

    return NextResponse.json({
      total: items.length,
      outillages: tO,
      epiCount: tE,
      valeur: tV,
      enMagasin: iM,
      affectes: af,
      enRetard: ov,
      finVie: eol,
      horsService: hs,
      perdus: lo,
      byType,
      byState,
      byFamily,
      byLocation,
      byResponsible,
      // Lifecycle
      lc: { maint: lcMaint, rebut: lcRebut, ctrl: lcCtrl, dotEpi: dotCount, campEnCours: campActive },
      recentMvts,
      alertCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
