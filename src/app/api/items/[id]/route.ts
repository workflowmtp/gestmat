import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission, getServerUser } from '@/lib/permissions';

// GET /api/items/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('items.view');
    const { id } = await params;

    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        type: true,
        family: true,
        location: true,
        movements: {
          include: { user: { select: { fullname: true } } },
          orderBy: { timestamp: 'desc' },
          take: 50,
        },
        inspections: {
          include: { inspector: { select: { fullname: true } } },
          orderBy: { date: 'desc' },
          take: 20,
        },
        dotations: { orderBy: { givenDate: 'desc' }, take: 20 },
      },
    });

    if (!item) return NextResponse.json({ error: 'Article introuvable' }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

// PUT /api/items/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('items.edit');
    const user = await getServerUser();
    const { id } = await params;
    const body = await req.json();

    // Unicité code si modifié
    if (body.code) {
      const dup = await prisma.item.findFirst({ where: { code: body.code, NOT: { id } } });
      if (dup) return NextResponse.json({ error: 'Code article déjà utilisé' }, { status: 400 });
    }

    // Unicité série si modifié
    if (body.serialNumber) {
      const dup = await prisma.item.findFirst({ where: { serialNumber: body.serialNumber, NOT: { id } } });
      if (dup) return NextResponse.json({ error: 'N° de série déjà utilisé' }, { status: 400 });
    }

    if (body.unitCost !== undefined && body.unitCost < 0) {
      return NextResponse.json({ error: 'Coût négatif interdit' }, { status: 400 });
    }

    const item = await prisma.item.update({ where: { id }, data: body });

    await prisma.auditLog.create({
      data: { action: 'modification', detail: 'Modification article ' + item.code, userId: user!.id, itemId: id },
    });

    return NextResponse.json({ item });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/items/[id] — Archive (soft delete)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('items.delete');
    const user = await getServerUser();
    const { id } = await params;

    const item = await prisma.item.update({
      where: { id },
      data: { archiveState: 'archivé' },
    });

    await prisma.auditLog.create({
      data: { action: 'archivage', detail: 'Archivage article ' + item.code, userId: user!.id, itemId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
