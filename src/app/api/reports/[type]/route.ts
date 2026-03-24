import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';

// GET /api/reports/[type]
export async function GET(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  try {
    await requirePermission('reports.view');
    const { type } = await params;

    const items = await prisma.item.findMany({
      where: { archiveState: { not: 'archivé' } },
      include: { type: true, family: true, location: true },
    });
    const now = new Date();
    const dayMs = 86400000;

    switch (type) {
      case 'by-family': {
        const grouped: Record<string, { count: number; value: number; items: any[] }> = {};
        for (const it of items) {
          const f = it.family?.name || 'Non classé';
          if (!grouped[f]) grouped[f] = { count: 0, value: 0, items: [] };
          grouped[f].count++;
          grouped[f].value += (it.unitCost || 0) * (it.qty || 1);
          grouped[f].items.push({ code: it.code, designation: it.designation, qty: it.qty, cost: it.unitCost });
        }
        return NextResponse.json({ report: grouped, title: 'Rapport par famille' });
      }

      case 'by-location': {
        const grouped: Record<string, { count: number; value: number; type: string }> = {};
        for (const it of items) {
          const l = it.location?.name || 'Non localisé';
          if (!grouped[l]) grouped[l] = { count: 0, value: 0, type: it.location?.type || '?' };
          grouped[l].count++;
          grouped[l].value += (it.unitCost || 0) * (it.qty || 1);
        }
        return NextResponse.json({ report: grouped, title: 'Rapport par chantier/localisation' });
      }

      case 'by-user': {
        const grouped: Record<string, { count: number; value: number }> = {};
        for (const it of items) {
          const r = it.responsible || 'Non assigné';
          if (!grouped[r]) grouped[r] = { count: 0, value: 0 };
          grouped[r].count++;
          grouped[r].value += (it.unitCost || 0) * (it.qty || 1);
        }
        return NextResponse.json({ report: grouped, title: 'Rapport par utilisateur' });
      }

      case 'overdue': {
        const overdue = items.filter((it) => it.returnDate && new Date(it.returnDate) < now)
          .map((it) => ({ ...it, daysOverdue: Math.round((now.getTime() - new Date(it.returnDate!).getTime()) / dayMs) }))
          .sort((a, b) => b.daysOverdue - a.daysOverdue);
        return NextResponse.json({ report: overdue, title: 'Rapport retards de retour' });
      }

      case 'end-of-life': {
        const eol = items.filter((it) => {
          if (!it.purchaseDate || !it.lifespanDays) return false;
          const svc = it.serviceDate || it.purchaseDate;
          const used = Math.round((now.getTime() - new Date(svc).getTime()) / dayMs);
          return used >= (it.lifespanDays - (it.lifespanAlertDays || 0));
        }).map((it) => {
          const svc = it.serviceDate || it.purchaseDate!;
          const used = Math.round((now.getTime() - new Date(svc).getTime()) / dayMs);
          return { ...it, daysUsed: used, percentUsed: Math.round((used / it.lifespanDays!) * 100) };
        }).sort((a, b) => b.percentUsed - a.percentUsed);
        return NextResponse.json({ report: eol, title: 'Rapport fin de vie' });
      }

      case 'epi': {
        const dotations = await prisma.dotation.findMany({
          include: { givenBy: { select: { fullname: true } } },
          orderBy: { givenDate: 'desc' },
        });
        const byEmployee: Record<string, any[]> = {};
        for (const d of dotations) {
          if (!byEmployee[d.employeeName]) byEmployee[d.employeeName] = [];
          byEmployee[d.employeeName].push(d);
        }
        return NextResponse.json({ report: byEmployee, dotations, title: 'Rapport dotations EPI' });
      }

      case 'valuation': {
        const byType: Record<string, { count: number; totalQty: number; totalValue: number }> = {};
        let grandTotal = 0;
        for (const it of items) {
          const t = it.type?.name || '?';
          if (!byType[t]) byType[t] = { count: 0, totalQty: 0, totalValue: 0 };
          byType[t].count++;
          byType[t].totalQty += it.qty;
          byType[t].totalValue += (it.unitCost || 0) * (it.qty || 1);
          grandTotal += (it.unitCost || 0) * (it.qty || 1);
        }
        return NextResponse.json({ report: byType, grandTotal, title: 'Rapport valorisation du stock' });
      }

      case 'alerts': {
        const { computeAlerts } = await import('@/lib/alert-engine');
        const alerts = await computeAlerts();
        const byModule: Record<string, any[]> = {};
        for (const a of alerts) {
          if (!byModule[a.module]) byModule[a.module] = [];
          byModule[a.module].push(a);
        }
        return NextResponse.json({ report: byModule, alerts, title: 'Rapport des alertes' });
      }

      default:
        return NextResponse.json({ error: 'Type de rapport inconnu' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}
