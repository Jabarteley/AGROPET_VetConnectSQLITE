import { NextResponse, type NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// Secret for JWT tokens (should match the one in your auth module)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Verify a JWT token
function verifyToken(token: string): any {
  if (!token) {
    return null;
  }

  try {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) {
      return null;
    }

    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
    if (decodedPayload.exp * 1000 < Date.now()) {
      return null;
    }

    return decodedPayload;
  } catch (error) {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  // Verify authentication token for protected routes
  const token = request.cookies.get('auth-token')?.value;
  console.log('auth-token:', token);
  const decodedToken = verifyToken(token as string);
  console.log('decoded-token:', decodedToken);
  const isAuthenticated = !!decodedToken;
  console.log('isAuthenticated:', isAuthenticated);

  // Define protected routes
  const protectedRoutes = ['/profile', '/appointments', '/messages', '/notifications'];
  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|_next/static|_next/image|favicon.ico|manifest\\.json$).*)',
  ],
}
