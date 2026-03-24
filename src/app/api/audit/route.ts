import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission, getServerUser } from '@/lib/permissions';

// GET /api/audit — Liste des logs avec filtres et pagination
export async function GET(req: NextRequest) {
  try {
    await requirePermission('audit.view');

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '30');
    const action = searchParams.get('action') || undefined;
    const search = searchParams.get('search') || undefined;

    const where: any = {};
    if (action) where.action = action;
    if (search) {
      where.OR = [
        { detail: { contains: search, mode: 'insensitive' } },
        { user: { fullname: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { fullname: true } } },
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Count by action type
    const actionCounts = await prisma.auditLog.groupBy({
      by: ['action'],
      _count: { action: true },
    });

    return NextResponse.json({
      logs: logs.map((l) => ({
        ...l,
        userName: l.user?.fullname || 'Système',
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      actionCounts: actionCounts.reduce((acc, c) => {
        acc[c.action] = c._count.action;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

// POST /api/audit — Créer un log (utilisé par les server actions)
export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser();
    const body = await req.json();

    await prisma.auditLog.create({
      data: {
        action: body.action,
        detail: body.detail,
        userId: user?.id || null,
        itemId: body.itemId || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
