import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission, getServerUser } from '@/lib/permissions';

// GET /api/inspections
export async function GET(req: NextRequest) {
  try {
    await requirePermission('controls.view');
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const tab = searchParams.get('tab') || 'planned';

    let where: any = {};
    if (tab === 'planned') {
      // Items with upcoming or overdue controls
      const items = await prisma.item.findMany({
        where: {
          archiveState: 'actif',
          controlFrequency: { not: null },
          nextControlDate: { not: null },
        },
        include: { type: true, location: true },
        orderBy: { nextControlDate: 'asc' },
      });
      return NextResponse.json({
        planned: items.map((it) => ({
          id: it.id, code: it.code, designation: it.designation,
          type: it.type?.name, location: it.location?.name,
          nextControlDate: it.nextControlDate, controlFrequency: it.controlFrequency,
          state: it.state, overdue: it.nextControlDate ? new Date(it.nextControlDate) <= new Date() : false,
        })),
      });
    }

    // History tab
    const [inspections, total] = await Promise.all([
      prisma.inspection.findMany({
        include: {
          item: { select: { code: true, designation: true } },
          inspector: { select: { fullname: true } },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.inspection.count(),
    ]);

    return NextResponse.json({ inspections, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

// POST /api/inspections — Enregistrer un contrôle
export async function POST(req: NextRequest) {
  try {
    await requirePermission('controls.create');
    const user = await getServerUser();
    const body = await req.json();

    if (!body.itemId || !body.inspType || !body.result) {
      return NextResponse.json({ error: 'Article, type et résultat obligatoires' }, { status: 400 });
    }

    const inspection = await prisma.inspection.create({
      data: {
        itemId: body.itemId,
        inspType: body.inspType,
        date: body.date ? new Date(body.date) : new Date(),
        result: body.result,
        inspectorId: user?.id || null,
        notes: body.notes || null,
        newState: body.newState || null,
      },
    });

    // Update item: next control date, state if changed
    const updateData: any = {};
    if (body.newState) updateData.state = body.newState;
    if (body.result === 'conforme') updateData.conformity = 'conforme';
    else if (body.result === 'non conforme') updateData.conformity = 'non conforme';

    // Calculate next control date
    const item = await prisma.item.findUnique({ where: { id: body.itemId } });
    if (item?.controlFrequency) {
      updateData.nextControlDate = new Date(Date.now() + item.controlFrequency * 86400000);
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.item.update({ where: { id: body.itemId }, data: updateData });
    }

    await prisma.auditLog.create({
      data: { action: 'contrôle', detail: body.inspType + ' : ' + body.result, userId: user?.id, itemId: body.itemId },
    });

    return NextResponse.json({ inspection }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
