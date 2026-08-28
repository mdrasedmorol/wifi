import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth';

/**
 * Next.js 16 Proxy — protects all admin routes.
 * Unauthenticated users are redirected to /login.
 * Authenticated users trying to access /login are redirected to /dashboard.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isAuthenticated = sessionCookie ? !!verifySessionToken(sessionCookie) : false;

  // If trying to access /login while already authenticated → go to dashboard
  if (pathname === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If trying to access protected admin routes without authentication → go to login
  if (!isAuthenticated && pathname !== '/login') {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/subscribers/:path*',
    '/billing/:path*',
    '/packages/:path*',
    '/settings/:path*',
    '/login',
  ],
};
