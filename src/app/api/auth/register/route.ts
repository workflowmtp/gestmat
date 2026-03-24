import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

// POST /api/auth/register — Inscription d'un nouvel utilisateur
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, fullname, email, phone } = body;

    // Validation
    if (!username || !password || !fullname) {
      return NextResponse.json(
        { error: 'Les champs identifiant, mot de passe et nom complet sont requis.' },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: "L'identifiant doit contenir au moins 3 caractères." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères.' },
        { status: 400 }
      );
    }

    // Check username uniqueness
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json(
        { error: 'Cet identifiant est déjà utilisé.' },
        { status: 409 }
      );
    }

    // Find the default role (lowest level, non-admin)
    const defaultRole = await prisma.role.findFirst({
      where: { builtIn: true, name: { not: 'admin' } },
      orderBy: { level: 'asc' },
    });

    if (!defaultRole) {
      // Fallback: get any role with the lowest level
      const fallbackRole = await prisma.role.findFirst({ orderBy: { level: 'asc' } });
      if (!fallbackRole) {
        return NextResponse.json(
          { error: 'Aucun rôle disponible. Contactez l\'administrateur.' },
          { status: 500 }
        );
      }
    }

    const roleId = defaultRole?.id || (await prisma.role.findFirst({ orderBy: { level: 'asc' } }))!.id;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        fullname,
        email: email || null,
        phone: phone || null,
        roleId,
        active: true,
      },
    });

    // Log
    await prisma.auditLog.create({
      data: {
        action: 'creation',
        detail: `Inscription de ${user.fullname} (${user.username})`,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true, message: 'Compte créé avec succès.' });
  } catch (error: any) {
    console.error('[Register]', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur.' }, { status: 500 });
  }
}
