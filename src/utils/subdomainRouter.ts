// src/utils/subdomainRouter.ts
/**
 * Client-side subdomain detection and routing utility
 * 
 * This provides subdomain-based routing for React applications where the URL
 * structure needs to change based on the subdomain.
 * 
 * Usage:
 * - Import and call getSubdomainPath() to get the correct path based on subdomain
 * - Use in your React Router configuration or components
 */

/**
 * Detects if the current request is from the admin subdomain
 */
export function isAdminSubdomain(): boolean {
  if (typeof window === 'undefined') {
    return false; // Server-side, return false
  }
  
  const hostname = window.location.hostname.split(':')[0];
  const subdomain = hostname.split('.')[0];
  
  return subdomain === 'admin';
}

/**
 * Gets the appropriate path based on subdomain
 * 
 * For admin subdomain:
 * - Current path: /dashboard
 * - Returns: /admin/dashboard
 * 
 * For main domain:
 * - Current path: /dashboard
 * - Returns: /dashboard
 */
export function getSubdomainPath(currentPath: string = window.location.pathname): string {
  if (!isAdminSubdomain()) {
    return currentPath;
  }
  
  // Already has /admin prefix, don't double-prefix
  if (currentPath.startsWith('/admin')) {
    return currentPath;
  }
  
  // Root path
  if (currentPath === '/') {
    return '/admin';
  }
  
  // All other paths
  return `/admin${currentPath}`;
}

/**
 * React hook for subdomain-aware routing
 */
export function useSubdomainPath(): string {
  if (typeof window === 'undefined') {
    return '/';
  }
  
  return getSubdomainPath(window.location.pathname);
}

/**
 * Redirects to the appropriate path based on subdomain
 * Call this in your App component or router setup
 */
export function handleSubdomainRedirect(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  const currentPath = window.location.pathname;
  const targetPath = getSubdomainPath(currentPath);
  
  // Only redirect if path needs to change
  if (currentPath !== targetPath) {
    window.history.replaceState(null, '', targetPath);
  }
}
