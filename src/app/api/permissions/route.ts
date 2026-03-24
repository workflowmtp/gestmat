import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';

// GET /api/permissions — Liste toutes les permissions (lecture seule)
export async function GET() {
  try {
    await requirePermission('config.roles');

    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { code: 'asc' }],
    });

    // Grouper par module
    const grouped: Record<string, typeof permissions> = {};
    for (const p of permissions) {
      if (!grouped[p.module]) grouped[p.module] = [];
      grouped[p.module].push(p);
    }

    return NextResponse.json({ permissions, grouped });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}
