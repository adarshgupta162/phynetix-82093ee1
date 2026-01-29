import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware for subdomain-based admin routing
 * 
 * This middleware rewrites requests from admin.phynetix.me to /admin/* paths
 * while keeping the browser URL unchanged (no redirects).
 * 
 * Examples:
 * - admin.phynetix.me/ → /admin
 * - admin.phynetix.me/dashboard → /admin/dashboard
 * - admin.phynetix.me/users → /admin/users
 * 
 * The main domain (phynetix.me or www.phynetix.me) is not affected.
 */
export function middleware(request: NextRequest) {
  // Get the hostname from the request
  const hostname = request.headers.get('host') || '';
  
  // Extract the subdomain from the hostname
  // This handles formats like: admin.phynetix.me, admin.phynetix.me:3000, etc.
  const subdomain = hostname.split('.')[0];
  
  // Check if the request is coming from the admin subdomain
  const isAdminSubdomain = subdomain === 'admin';
  
  // Only process requests from admin.phynetix.me
  if (!isAdminSubdomain) {
    // For main domain (phynetix.me, www.phynetix.me) or other subdomains,
    // continue without any rewriting
    return NextResponse.next();
  }
  
  // Get the current pathname
  const pathname = request.nextUrl.pathname;
  
  // Prevent double-prefixing: if path already starts with /admin, continue as-is
  if (pathname.startsWith('/admin')) {
    return NextResponse.next();
  }
  
  // Rewrite the URL to prepend /admin to the path
  // This is a server-side rewrite, so the browser URL remains unchanged
  const url = request.nextUrl.clone();
  
  // Handle root path: admin.phynetix.me/ → /admin
  if (pathname === '/') {
    url.pathname = '/admin';
  } else {
    // Handle all other paths: admin.phynetix.me/dashboard → /admin/dashboard
    url.pathname = `/admin${pathname}`;
  }
  
  // Perform the rewrite (not a redirect)
  // The browser will still show admin.phynetix.me/* in the address bar
  return NextResponse.rewrite(url);
}

/**
 * Matcher configuration to run middleware only for relevant paths
 * 
 * This ensures the middleware runs for all paths except:
 * - Static files (_next/static, _next/image)
 * - Public files in /public (favicon.ico, etc.)
 * - API routes that should not be rewritten
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
};
