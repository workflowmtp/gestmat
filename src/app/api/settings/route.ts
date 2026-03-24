import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission, getServerUser } from '@/lib/permissions';

// GET /api/settings
export async function GET() {
  try {
    const settings = await prisma.setting.findMany();
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;
    return NextResponse.json({ settings: map });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/settings
export async function PUT(req: NextRequest) {
  try {
    await requirePermission('config.settings');
    const user = await getServerUser();
    const body = await req.json();

    // body = { key: value, key2: value2, ... }
    for (const [key, value] of Object.entries(body)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    await prisma.auditLog.create({
      data: { action: 'config', detail: 'Modification paramètres : ' + Object.keys(body).join(', '), userId: user?.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}
