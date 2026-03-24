import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission, getServerUser } from '@/lib/permissions';

// GET /api/movements
export async function GET(req: NextRequest) {
  try {
    await requirePermission('movements.view');
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');
    const type = searchParams.get('type') || '';
    const search = searchParams.get('search') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    const where: any = {};
    if (type) where.type = type;
    if (dateFrom) where.timestamp = { ...where.timestamp, gte: new Date(dateFrom) };
    if (dateTo) where.timestamp = { ...where.timestamp, lte: new Date(dateTo + 'T23:59:59') };
    if (search) {
      where.OR = [
        { item: { code: { contains: search, mode: 'insensitive' } } },
        { item: { designation: { contains: search, mode: 'insensitive' } } },
        { user: { fullname: { contains: search, mode: 'insensitive' } } },
        { origin: { contains: search, mode: 'insensitive' } },
        { destination: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [movements, total] = await Promise.all([
      prisma.movement.findMany({
        where,
        include: {
          item: { select: { code: true, designation: true } },
          user: { select: { fullname: true } },
        },
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.movement.count({ where }),
    ]);

    return NextResponse.json({ movements, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

// POST /api/movements — Créer un mouvement avec règles métier
export async function POST(req: NextRequest) {
  try {
    await requirePermission('movements.create');
    const user = await getServerUser();
    const body = await req.json();

    if (!body.itemId || !body.type) {
      return NextResponse.json({ error: 'Article et type de mouvement obligatoires' }, { status: 400 });
    }

    const item = await prisma.item.findUnique({
      where: { id: body.itemId },
      include: { location: true },
    });
    if (!item) return NextResponse.json({ error: 'Article introuvable' }, { status: 404 });

    // ═══ RÈGLES MÉTIER ═══
    if ((item.state === 'hors service' || item.state === 'rebuté') && (body.type === 'prêt' || body.type === 'affectation')) {
      return NextResponse.json({ error: 'Un article hors service ne peut pas être prêté ou affecté' }, { status: 400 });
    }
    if ((item.state === 'perdu' || item.state === 'volé') && body.type !== 'correction inventaire') {
      return NextResponse.json({ error: 'Un article perdu/volé ne peut faire l\'objet que d\'une correction inventaire' }, { status: 400 });
    }

    // Créer le mouvement
    const movement = await prisma.movement.create({
      data: {
        itemId: body.itemId,
        type: body.type,
        origin: body.origin || item.location?.name || 'Magasin',
        destination: body.destination || '',
        userId: user!.id,
        beneficiary: body.beneficiary || '',
        qty: body.qty || 1,
        reason: body.reason || '',
        comment: body.comment || '',
        validator: body.validator || user!.name,
      },
    });

    // ═══ MAJ ARTICLE selon type ═══
    const itemUpdate: any = {};

    if (body.destination && ['prêt', 'affectation', 'transfert'].includes(body.type)) {
      const destLoc = await prisma.location.findFirst({ where: { name: body.destination } });
      if (destLoc) itemUpdate.locationId = destLoc.id;
      if (body.type !== 'transfert' && destLoc?.type === 'chantier') itemUpdate.currentProject = body.destination;
      if (body.returnDate) itemUpdate.returnDate = new Date(body.returnDate);
    }

    if (['retour', 'restitution'].includes(body.type)) {
      const magasin = await prisma.location.findFirst({ where: { type: 'magasin' } });
      if (magasin) itemUpdate.locationId = magasin.id;
      itemUpdate.returnDate = null;
      itemUpdate.currentProject = null;
    }

    if (body.type === 'mise au rebut') { itemUpdate.state = 'rebuté'; itemUpdate.archiveState = 'rebuté'; }
    if (body.type === 'perte') itemUpdate.state = 'perdu';
    if (body.type === 'vol') itemUpdate.state = 'volé';

    if (Object.keys(itemUpdate).length > 0) {
      await prisma.item.update({ where: { id: body.itemId }, data: itemUpdate });
    }

    // Audit
    await prisma.auditLog.create({
      data: {
        action: 'mouvement',
        detail: body.type + ' : ' + item.code + ' → ' + (body.destination || '?'),
        userId: user!.id,
        itemId: item.id,
      },
    });

    return NextResponse.json({ movement }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
