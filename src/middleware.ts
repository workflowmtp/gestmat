import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const token =
    req.cookies.get('authjs.session-token')?.value ||
    req.cookies.get('__Secure-authjs.session-token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!login|register|forgot-password|reset-password|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
