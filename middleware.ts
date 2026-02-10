/**
 * Vercel Edge Middleware for multi-domain routing
 * Handles domain-based access control and redirects based on user role
 * 
 * Note: This middleware will work with Vercel's Edge Network
 * For Vite apps, Vercel will automatically handle routing through this middleware
 */

interface EdgeRequest extends Request {
  cookies: {
    get(name: string): { value: string } | undefined;
  };
}

/**
 * Extracts user role from Supabase JWT token
 * @param request - The incoming request
 * @returns The user role ('admin', 'user', or null if not authenticated)
 */
async function getUserRoleFromCookies(cookieHeader: string | null): Promise<string | null> {
  if (!cookieHeader) {
    return null;
  }

  // Parse cookies from header
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name && rest.length > 0) {
      cookies[name] = rest.join('=');
    }
  });

  // Get Supabase auth token from cookies
  // Try standard Supabase cookie names
  const authToken = cookies['sb-access-token'] || 
                    cookies['supabase-auth-token'];
  
  if (!authToken) {
    return null;
  }

  try {
    // Decode JWT token
    // Note: This is a simplified implementation for initial validation.
    // For production, implement proper JWT signature verification using:
    // 1. Supabase JWT secret from environment variables
    // 2. Supabase's official token verification methods
    // 3. A JWT verification library like 'jose' or '@supabase/supabase-js'
    const parts = authToken.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Base64 decode the payload
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    
    // Check if token is expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }

    // Return role from token metadata (this assumes role is stored in the JWT)
    return payload.user_metadata?.role || payload.role || 'user';
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

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

export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;
  const hostname = url.hostname;
  
  // Extract the actual domain (removing port if present)
  const domain = hostname.split(':')[0];
  
  // Check if this is the admin subdomain
  // Use strict domain matching to prevent security issues
  const isAdminDomain = domain === 'admin.phynetix.me' || 
                        (domain.startsWith('admin.') && domain.endsWith('.phynetix.me'));
  const isMainDomain = domain === 'phynetix.me' || (!isAdminDomain && domain !== 'localhost' && domain !== '127.0.0.1');
  
  // Skip middleware for non-production domains (localhost, vercel preview deployments)
  if (domain === 'localhost' || domain === '127.0.0.1' || domain.includes('vercel.app')) {
    return new Response(null, {
      headers: {
        'x-middleware-next': '1',
      },
    });
  }

  // Get user role from cookies
  const cookieHeader = request.headers.get('cookie');
  const userRole = await getUserRoleFromCookies(cookieHeader);
  const isAdmin = userRole === 'admin';
  const isAuthenticated = userRole !== null;

  // Domain-based routing logic
  
  // Case 1: Non-admin user trying to access admin domain
  if (isAdminDomain && isAuthenticated && !isAdmin) {
    const redirectUrl = new URL(pathname, `${url.protocol}//phynetix.me`);
    redirectUrl.pathname = '/dashboard';
    return Response.redirect(redirectUrl.toString(), 307);
  }

  // Case 2: Non-authenticated user trying to access admin domain
  if (isAdminDomain && !isAuthenticated && pathname.startsWith('/admin')) {
    const redirectUrl = new URL(pathname, `${url.protocol}//phynetix.me`);
    redirectUrl.pathname = '/auth';
    return Response.redirect(redirectUrl.toString(), 307);
  }

  // Case 3: Admin user on main domain trying to access admin routes
  // Redirect them to admin subdomain
  if (isMainDomain && isAdmin && pathname.startsWith('/admin')) {
    const redirectUrl = new URL(pathname, `${url.protocol}//admin.phynetix.me`);
    return Response.redirect(redirectUrl.toString(), 307);
  }

  // Add security headers
  const headers = new Headers();
  headers.set('X-DNS-Prefetch-Control', 'on');
  headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('x-middleware-next', '1');

  return new Response(null, { headers });
}
