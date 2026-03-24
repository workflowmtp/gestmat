import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

// POST /api/auth/register — Inscription d'un nouvel utilisateur
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password, fullname, email, phone } = body;

    // Validation
    if (!email || !password || !fullname) {
      return NextResponse.json(
        { error: 'Les champs nom complet, email et mot de passe sont requis.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères.' },
        { status: 400 }
      );
    }

    // Check email uniqueness
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà.' },
        { status: 409 }
      );
    }

    // Auto-generate username from email (part before @)
    let username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      username = username + Math.floor(Math.random() * 9999);
    }

    // Find the default role (lowest level, non-admin)
    const defaultRole = await prisma.role.findFirst({
      where: { builtIn: true, name: { not: 'admin' } },
      orderBy: { level: 'asc' },
    });

    const roleId = defaultRole?.id || (await prisma.role.findFirst({ orderBy: { level: 'asc' } }))!.id;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        fullname,
        email,
        phone: phone || null,
        roleId,
        active: true,
      },
    });

    // Log
    await prisma.auditLog.create({
      data: {
        action: 'creation',
        detail: `Inscription de ${user.fullname} (${user.email})`,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true, message: 'Compte créé avec succès.' });
  } catch (error: any) {
    console.error('[Register]', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur.' }, { status: 500 });
  }
}
