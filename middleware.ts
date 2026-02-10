import { NextRequest, NextResponse } from 'next/server';

/**
 * Vercel Edge Middleware for multi-domain routing
 * Handles domain-based access control and redirects based on user role
 */

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public files (assets, images, etc.)
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$|api/).*)',
  ],
};

/**
 * Extracts user role from Supabase JWT token
 * @param request - The incoming request
 * @returns The user role ('admin', 'user', or null if not authenticated)
 */
async function getUserRoleFromToken(request: NextRequest): Promise<string | null> {
  // Get Supabase auth token from cookies
  const authToken = request.cookies.get('sb-access-token')?.value || 
                    request.cookies.get('supabase-auth-token')?.value;
  
  if (!authToken) {
    return null;
  }

  try {
    // Decode JWT token (simplified - in production you should verify signature)
    const parts = authToken.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Check if token is expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }

    // Return role from token metadata (this assumes role is stored in the JWT)
    // If role is not in JWT, you'll need to make an API call to Supabase
    return payload.user_metadata?.role || payload.role || 'user';
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  // Extract the actual domain (removing port if present)
  const domain = hostname.split(':')[0];
  
  // Check if this is the admin subdomain
  const isAdminDomain = domain === 'admin.phynetix.me' || domain.startsWith('admin.');
  const isMainDomain = domain === 'phynetix.me' || (!isAdminDomain && domain !== 'localhost' && domain !== '127.0.0.1');
  
  // Skip middleware for non-production domains (localhost, vercel preview deployments)
  if (domain === 'localhost' || domain === '127.0.0.1' || domain.includes('vercel.app')) {
    return NextResponse.next();
  }

  // Get user role from token
  const userRole = await getUserRoleFromToken(request);
  const isAdmin = userRole === 'admin';
  const isAuthenticated = userRole !== null;

  // Domain-based routing logic
  
  // Case 1: Non-admin user trying to access admin domain
  if (isAdminDomain && isAuthenticated && !isAdmin) {
    const redirectUrl = new URL(pathname, `${request.nextUrl.protocol}//phynetix.me`);
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl, { status: 307 });
  }

  // Case 2: Non-authenticated user trying to access admin domain
  if (isAdminDomain && !isAuthenticated && pathname.startsWith('/admin')) {
    const redirectUrl = new URL(pathname, `${request.nextUrl.protocol}//phynetix.me`);
    redirectUrl.pathname = '/auth';
    return NextResponse.redirect(redirectUrl, { status: 307 });
  }

  // Case 3: Admin user on main domain trying to access admin routes
  // Redirect them to admin subdomain
  if (isMainDomain && isAdmin && pathname.startsWith('/admin')) {
    const redirectUrl = new URL(pathname, `${request.nextUrl.protocol}//admin.phynetix.me`);
    return NextResponse.redirect(redirectUrl, { status: 307 });
  }

  // Add security headers
  const response = NextResponse.next();
  
  // CORS headers (adjust as needed)
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}
