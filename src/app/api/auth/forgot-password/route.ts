import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

// POST /api/auth/forgot-password — Génère un token de réinitialisation
export async function POST(req: NextRequest) {
  try {
    const { username, email } = await req.json();

    if (!username && !email) {
      return NextResponse.json(
        { error: "Veuillez fournir votre identifiant ou votre email." },
        { status: 400 }
      );
    }

    // Find user by username or email
    const user = await prisma.user.findFirst({
      where: username
        ? { username }
        : { email: email || undefined },
    });

    // Always return success to avoid user enumeration
    if (!user || !user.active) {
      return NextResponse.json({
        success: true,
        message: 'Si un compte correspond, un lien de réinitialisation a été généré.',
      });
    }

    // Invalidate previous tokens
    await (prisma as any).passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await (prisma as any).passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // In production, send email with reset link
    // For now, return the token directly (dev mode)
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    // Log
    await prisma.auditLog.create({
      data: {
        action: 'config',
        detail: `Demande de réinitialisation de mot de passe pour ${user.fullname}`,
        userId: user.id,
      },
    });

    // TODO: Send email in production
    // For now, log the reset URL
    console.log(`[Password Reset] URL: ${resetUrl}`);

    return NextResponse.json({
      success: true,
      message: 'Si un compte correspond, un lien de réinitialisation a été généré.',
      // In dev mode, return the token for testing
      ...(process.env.NODE_ENV === 'development' ? { resetUrl, token } : {}),
    });
  } catch (error: any) {
    console.error('[Forgot Password]', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur.' }, { status: 500 });
  }
}
