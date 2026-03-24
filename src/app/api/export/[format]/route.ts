import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission, getServerUser } from '@/lib/permissions';

// GET /api/export/[format] — format: items-csv, movements-csv, dotations-csv, full-json
export async function GET(req: NextRequest, { params }: { params: Promise<{ format: string }> }) {
  try {
    await requirePermission('reports.export');
    const user = await getServerUser();
    const { format } = await params;

    switch (format) {
      case 'items-csv': {
        const items = await prisma.item.findMany({ include: { type: true, family: true, location: true } });
        let csv = 'Code;Désignation;Type;Famille;Marque;Modèle;Série;Qté;Coût;État;Conformité;Localisation;Responsable;Achat;DuréeVie\n';
        for (const it of items) {
          csv += [it.code, it.designation, it.type?.name, it.family?.name || '', it.brand || '', it.model || '', it.serialNumber || '', it.qty, it.unitCost, it.state, it.conformity, it.location?.name || '', it.responsible || '', it.purchaseDate?.toISOString().split('T')[0] || '', it.lifespanDays || ''].join(';') + '\n';
        }
        await prisma.auditLog.create({ data: { action: 'export', detail: 'Export inventaire CSV', userId: user?.id } });
        return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename=inventaire_gestmat.csv' } });
      }

      case 'movements-csv': {
        const mvts = await prisma.movement.findMany({ include: { item: true, user: true }, orderBy: { timestamp: 'desc' } });
        let csv = 'Date;Article;Type;Origine;Destination;Qté;Par;Bénéficiaire;Motif\n';
        for (const m of mvts) {
          csv += [m.timestamp.toISOString(), m.item?.code, m.type, m.origin || '', m.destination || '', m.qty, m.user?.fullname || '', m.beneficiary || '', m.reason || ''].join(';') + '\n';
        }
        await prisma.auditLog.create({ data: { action: 'export', detail: 'Export mouvements CSV', userId: user?.id } });
        return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename=mouvements_gestmat.csv' } });
      }

      case 'dotations-csv': {
        const dots = await prisma.dotation.findMany({ include: { givenBy: true } });
        let csv = 'Employé;Type EPI;Libellé;Date;Qté;Durée(j);Renouvellement;Taille;Remis par\n';
        for (const d of dots) {
          csv += [d.employeeName, d.epiType, d.epiLabel, d.givenDate.toISOString().split('T')[0], d.qty, d.durationDays, d.renewalDate?.toISOString().split('T')[0] || '', d.size || '', d.givenBy?.fullname || ''].join(';') + '\n';
        }
        return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename=dotations_epi_gestmat.csv' } });
      }

      case 'full-json': {
        await requirePermission('reports.backup');
        const [users, items, movements, locations, families, dotations, inspections, campaigns, settings, audit] = await Promise.all([
          prisma.user.findMany({ select: { id: true, username: true, fullname: true, email: true, phone: true, active: true, roleId: true } }),
          prisma.item.findMany(),
          prisma.movement.findMany(),
          prisma.location.findMany(),
          prisma.itemFamily.findMany(),
          prisma.dotation.findMany(),
          prisma.inspection.findMany(),
          prisma.inventoryCampaign.findMany({ include: { lines: true } }),
          prisma.setting.findMany(),
          prisma.auditLog.findMany({ take: 1000, orderBy: { timestamp: 'desc' } }),
        ]);
        const backup = { version: '5.0', exportDate: new Date().toISOString(), users, items, movements, locations, families, dotations, inspections, campaigns, settings, audit };
        await prisma.auditLog.create({ data: { action: 'export', detail: 'Backup JSON complet', userId: user?.id } });
        return NextResponse.json(backup, { headers: { 'Content-Disposition': 'attachment; filename=gestmat_backup.json' } });
      }

      default:
        return NextResponse.json({ error: 'Format inconnu: ' + format }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}
