import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { requirePermission, getServerUser } from '@/lib/permissions';

// GET /api/users
export async function GET() {
  try {
    await requirePermission('config.users');

    const users = await prisma.user.findMany({
      include: {
        role: { select: { id: true, name: true, label: true } },
        _count: {
          select: { movements: true, dotationsGiven: true, auditLogs: true },
        },
      },
      orderBy: { fullname: 'asc' },
    });

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        fullname: u.fullname,
        email: u.email,
        phone: u.phone,
        active: u.active,
        role: u.role,
        linkedData: u._count.movements + u._count.dotationsGiven,
        createdAt: u.createdAt,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

// POST /api/users — Créer
export async function POST(req: NextRequest) {
  try {
    await requirePermission('config.users');
    const currentU = await getServerUser();
    const body = await req.json();

    const { username, password, fullname, email, phone, roleId } = body;
    if (!username || !password || !fullname || !roleId) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return NextResponse.json({ error: 'Identifiant déjà utilisé' }, { status: 400 });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, password: hash, fullname, email, phone, roleId },
    });

    await prisma.auditLog.create({
      data: { action: 'config', detail: 'Création utilisateur : ' + fullname, userId: currentU?.id },
    });

    return NextResponse.json({ user: { id: user.id, username: user.username, fullname: user.fullname } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/users — Modifier
export async function PUT(req: NextRequest) {
  try {
    await requirePermission('config.users');
    const currentU = await getServerUser();
    const body = await req.json();

    const { id, fullname, email, phone, roleId, active, password } = body;
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

    const updateData: any = {};
    if (fullname !== undefined) updateData.fullname = fullname;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (roleId !== undefined) updateData.roleId = roleId;
    if (active !== undefined) updateData.active = active;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    await prisma.user.update({ where: { id }, data: updateData });

    await prisma.auditLog.create({
      data: { action: 'config', detail: 'Modification utilisateur : ' + (fullname || id), userId: currentU?.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/users — Supprimer (si aucune donnée liée)
export async function DELETE(req: NextRequest) {
  try {
    await requirePermission('config.users');
    const currentU = await getServerUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

    if (currentU?.id === id) {
      return NextResponse.json({ error: 'Impossible de supprimer votre propre compte' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: { _count: { select: { movements: true, dotationsGiven: true } } },
    });
    if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });

    const linked = user._count.movements + user._count.dotationsGiven;
    if (linked > 0) {
      return NextResponse.json({ error: 'Utilisateur a ' + linked + ' donnée(s) liée(s). Désactivez-le plutôt.' }, { status: 400 });
    }

    // Supprimer les audit logs de cet user d'abord
    await prisma.auditLog.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });

    await prisma.auditLog.create({
      data: { action: 'config', detail: 'Suppression utilisateur : ' + user.fullname, userId: currentU?.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
