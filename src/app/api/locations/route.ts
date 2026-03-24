import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission, getServerUser } from '@/lib/permissions';

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      include: { _count: { select: { items: true } } },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ locations: locations.map((l) => ({ ...l, itemCount: l._count.items })) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission('config.locations');
    const user = await getServerUser();
    const body = await req.json();
    if (!body.name || !body.type) return NextResponse.json({ error: 'Nom et type obligatoires' }, { status: 400 });
    const loc = await prisma.location.create({
      data: { name: body.name, code: body.code || body.name.substring(0,3).toUpperCase(), type: body.type, responsible: body.responsible, phone: body.phone, comment: body.comment },
    });
    await prisma.auditLog.create({ data: { action: 'config', detail: 'Création localisation : ' + body.name, userId: user?.id } });
    return NextResponse.json({ location: loc }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requirePermission('config.locations');
    const user = await getServerUser();
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    const { id, ...data } = body;
    await prisma.location.update({ where: { id }, data });
    await prisma.auditLog.create({ data: { action: 'config', detail: 'Modification localisation : ' + (data.name || id), userId: user?.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requirePermission('config.locations');
    const user = await getServerUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    const loc = await prisma.location.findUnique({ where: { id }, include: { _count: { select: { items: true } } } });
    if (!loc) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
    if (loc._count.items > 0) return NextResponse.json({ error: 'Localisation encore utilisée par ' + loc._count.items + ' article(s)' }, { status: 400 });
    await prisma.location.delete({ where: { id } });
    await prisma.auditLog.create({ data: { action: 'config', detail: 'Suppression localisation : ' + loc.name, userId: user?.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
