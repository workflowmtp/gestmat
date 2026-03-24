import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

// POST /api/auth/reset-password — Réinitialise le mot de passe avec un token
export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token et nouveau mot de passe requis.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères.' },
        { status: 400 }
      );
    }

    // Find valid token
    const resetToken = await (prisma as any).passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.used) {
      return NextResponse.json(
        { error: 'Ce lien de réinitialisation est invalide ou a déjà été utilisé.' },
        { status: 400 }
      );
    }

    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { error: 'Ce lien de réinitialisation a expiré. Veuillez en demander un nouveau.' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      (prisma as any).passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    // Log
    await prisma.auditLog.create({
      data: {
        action: 'modification',
        detail: `Mot de passe réinitialisé pour ${resetToken.user.fullname}`,
        userId: resetToken.userId,
      },
    });

    return NextResponse.json({ success: true, message: 'Mot de passe réinitialisé avec succès.' });
  } catch (error: any) {
    console.error('[Reset Password]', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur.' }, { status: 500 });
  }
}
