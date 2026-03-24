import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission, getServerUser } from '@/lib/permissions';

export async function GET() {
  try {
    const families = await prisma.itemFamily.findMany({
      include: { _count: { select: { items: true } } },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ families: families.map((f) => ({ ...f, itemCount: f._count.items })) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission('config.families');
    const body = await req.json();
    if (!body.name) return NextResponse.json({ error: 'Nom obligatoire' }, { status: 400 });
    const fam = await prisma.itemFamily.create({ data: { name: body.name } });
    return NextResponse.json({ family: fam }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requirePermission('config.families');
    const body = await req.json();
    if (!body.id || !body.name) return NextResponse.json({ error: 'ID et nom requis' }, { status: 400 });
    await prisma.itemFamily.update({ where: { id: body.id }, data: { name: body.name } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requirePermission('config.families');
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    const fam = await prisma.itemFamily.findUnique({ where: { id }, include: { _count: { select: { items: true } } } });
    if (!fam) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
    if (fam._count.items > 0) return NextResponse.json({ error: 'Famille utilisée par ' + fam._count.items + ' article(s)' }, { status: 400 });
    await prisma.itemFamily.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
