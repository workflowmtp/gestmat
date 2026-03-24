import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/me — Retourne l'utilisateur connecté avec ses permissions
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: 'ID utilisateur manquant' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user || !user.active) {
      return NextResponse.json({ error: 'Utilisateur inactif ou introuvable' }, { status: 403 });
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      fullname: user.fullname,
      email: user.email,
      phone: user.phone,
      role: user.role.name,
      roleLabel: user.role.label,
      permissions: user.role.permissions.map((rp) => rp.permission.code),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
