import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission, getServerUser } from '@/lib/permissions';

// GET /api/items — Liste avec filtres et pagination
export async function GET(req: NextRequest) {
  try {
    await requirePermission('items.view');

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const state = searchParams.get('state') || '';
    const family = searchParams.get('family') || '';
    const location = searchParams.get('location') || '';
    const sortCol = searchParams.get('sortCol') || 'code';
    const sortDir = searchParams.get('sortDir') === 'desc' ? 'desc' : 'asc';

    const where: any = { archiveState: { not: 'archivé' } };

    if (type) where.type = { name: type };
    if (state) where.state = state;
    if (family) where.family = { name: family };
    if (location) where.location = { name: location };
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { responsible: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy
    const orderBy: any = {};
    const allowedSorts = ['code','designation','state','qty','unitCost','responsible'];
    if (allowedSorts.includes(sortCol)) {
      orderBy[sortCol] = sortDir;
    } else {
      orderBy.code = 'asc';
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: {
          type: { select: { name: true } },
          family: { select: { name: true } },
          location: { select: { name: true, type: true } },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.item.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

// POST /api/items — Créer un article
export async function POST(req: NextRequest) {
  try {
    await requirePermission('items.create');
    const user = await getServerUser();
    const body = await req.json();

    // Validation
    if (!body.code || !body.designation || !body.typeId) {
      return NextResponse.json({ error: 'Code, désignation et type sont obligatoires' }, { status: 400 });
    }

    // Unicité code
    const existingCode = await prisma.item.findUnique({ where: { code: body.code } });
    if (existingCode) return NextResponse.json({ error: 'Code article déjà utilisé' }, { status: 400 });

    // Unicité série
    if (body.serialNumber) {
      const existingSN = await prisma.item.findUnique({ where: { serialNumber: body.serialNumber } });
      if (existingSN) return NextResponse.json({ error: 'N° de série déjà utilisé' }, { status: 400 });
    }

    // Coût négatif
    if (body.unitCost && body.unitCost < 0) {
      return NextResponse.json({ error: 'Le coût ne peut pas être négatif' }, { status: 400 });
    }

    const item = await prisma.item.create({ data: body });

    // Mouvement d'entrée en stock
    await prisma.movement.create({
      data: {
        itemId: item.id,
        type: 'entrée en stock',
        origin: 'Extérieur',
        destination: body.locationId ? (await prisma.location.findUnique({ where: { id: body.locationId } }))?.name || 'Magasin' : 'Magasin',
        userId: user!.id,
        qty: body.qty || 1,
        reason: 'Entrée initiale',
        validator: user!.name,
      },
    });

    // Audit
    await prisma.auditLog.create({
      data: { action: 'creation', detail: 'Création article ' + body.code, userId: user!.id, itemId: item.id },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
