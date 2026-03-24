import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission, getServerUser } from '@/lib/permissions';

// GET /api/campaigns/[id] — Detail with lines
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('campaigns.view');
    const { id } = await params;

    const campaign = await prisma.inventoryCampaign.findUnique({
      where: { id },
      include: {
        lines: {
          include: { item: { select: { code: true, designation: true, qty: true, state: true, location: true } } },
          orderBy: { item: { code: 'asc' } },
        },
      },
    });

    if (!campaign) return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 });
    return NextResponse.json({ campaign });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

// PUT /api/campaigns/[id] — Update counting lines
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('campaigns.count');
    const { id } = await params;
    const body = await req.json();

    // body.lines = [{ lineId, physicalQty, justification }]
    if (body.lines && Array.isArray(body.lines)) {
      for (const line of body.lines) {
        if (!line.lineId) continue;
        const existing = await prisma.inventoryLine.findUnique({ where: { id: line.lineId } });
        if (!existing) continue;

        const physQty = line.physicalQty !== null && line.physicalQty !== undefined ? Number(line.physicalQty) : null;
        const ecart = physQty !== null ? physQty - existing.theoreticalQty : null;

        await prisma.inventoryLine.update({
          where: { id: line.lineId },
          data: {
            physicalQty: physQty,
            ecart,
            justification: line.justification || null,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
