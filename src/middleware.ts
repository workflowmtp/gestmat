export { auth as middleware } from '@/lib/auth';

export const config = {
  matcher: [
    // Protéger toutes les routes sauf login, api/auth, et fichiers statiques
    '/((?!login|register|forgot-password|reset-password|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
