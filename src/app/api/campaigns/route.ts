import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission, getServerUser } from '@/lib/permissions';

// GET /api/campaigns
export async function GET() {
  try {
    await requirePermission('campaigns.view');
    const campaigns = await prisma.inventoryCampaign.findMany({
      include: {
        lines: { include: { item: { select: { code: true, designation: true, qty: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({
      campaigns: campaigns.map((c) => ({
        ...c,
        lineCount: c.lines.length,
        countedCount: c.lines.filter((l) => l.physicalQty !== null).length,
        ecartCount: c.lines.filter((l) => l.ecart !== null && l.ecart !== 0).length,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

// POST /api/campaigns — Create campaign + generate lines
export async function POST(req: NextRequest) {
  try {
    await requirePermission('campaigns.create');
    const user = await getServerUser();
    const body = await req.json();

    if (!body.name) return NextResponse.json({ error: 'Nom obligatoire' }, { status: 400 });

    // Filter items for the campaign
    const itemWhere: any = { archiveState: 'actif' };
    if (body.locationFilter) {
      itemWhere.location = { name: body.locationFilter };
    }
    if (body.typeFilter) {
      itemWhere.type = { name: body.typeFilter };
    }

    const items = await prisma.item.findMany({ where: itemWhere, select: { id: true, qty: true } });

    if (!items.length) {
      return NextResponse.json({ error: 'Aucun article correspondant aux filtres' }, { status: 400 });
    }

    const campaign = await prisma.inventoryCampaign.create({
      data: {
        name: body.name,
        locationFilter: body.locationFilter || null,
        typeFilter: body.typeFilter || null,
        responsible: body.responsible || user?.name || null,
        comment: body.comment || null,
        lines: {
          create: items.map((it) => ({
            itemId: it.id,
            theoreticalQty: it.qty,
          })),
        },
      },
    });

    await prisma.auditLog.create({
      data: { action: 'creation', detail: 'Campagne inventaire : ' + body.name + ' (' + items.length + ' articles)', userId: user?.id },
    });

    return NextResponse.json({ campaign, lineCount: items.length }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
