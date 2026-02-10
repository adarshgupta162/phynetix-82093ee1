/**
 * Domain utility functions for multi-domain routing
 * Handles domain detection, validation, and redirect URL generation
 */

/**
 * Gets the current hostname from the browser window
 * @returns The current hostname (e.g., "phynetix.me" or "admin.phynetix.me")
 */
export function getCurrentDomain(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.location.hostname;
}

/**
 * Checks if the current domain is the admin subdomain
 * @returns true if on admin.phynetix.me, false otherwise
 */
export function isAdminDomain(): boolean {
  const domain = getCurrentDomain();
  return domain === 'admin.phynetix.me' || domain.startsWith('admin.');
}

/**
 * Checks if the current domain is the main domain
 * @returns true if on phynetix.me (not admin subdomain), false otherwise
 */
export function isMainDomain(): boolean {
  return !isAdminDomain();
}

/**
 * Gets the appropriate redirect URL based on user role and current domain
 * @param isAdmin - Whether the user has admin role
 * @param targetPath - Optional specific path to redirect to (default: "/" for main, "/admin" for admin)
 * @returns The full URL to redirect to
 */
export function getRedirectUrl(isAdmin: boolean, targetPath?: string): string {
  const protocol = window.location.protocol;
  const port = window.location.port ? `:${window.location.port}` : '';
  
  // For development/localhost, use the current domain
  const currentDomain = getCurrentDomain();
  if (currentDomain === 'localhost' || currentDomain === '127.0.0.1') {
    // In development, just redirect to the path without changing domain
    return targetPath || (isAdmin ? '/admin' : '/dashboard');
  }

  // For production
  if (isAdmin) {
    // Admin users should go to admin subdomain
    const path = targetPath || '/admin';
    return `${protocol}//admin.phynetix.me${port}${path}`;
  } else {
    // Regular users should go to main domain
    const path = targetPath || '/dashboard';
    return `${protocol}//phynetix.me${port}${path}`;
  }
}

/**
 * Validates whether the current user can access the current domain
 * @param isAdmin - Whether the user has admin role
 * @returns true if access is valid, false if redirect is needed
 */
export function validateDomainAccess(isAdmin: boolean): boolean {
  const onAdminDomain = isAdminDomain();
  
  // In development (localhost), allow access to any domain
  const currentDomain = getCurrentDomain();
  if (currentDomain === 'localhost' || currentDomain === '127.0.0.1') {
    return true;
  }

  // Admin users can access admin domain
  if (isAdmin && onAdminDomain) {
    return true;
  }

  // Non-admin users should not be on admin domain
  if (!isAdmin && onAdminDomain) {
    return false;
  }

  // All users can access main domain (but admins may be redirected by other logic)
  return true;
}

/**
 * Gets the main domain URL
 * @param path - Optional path to append
 * @returns The full URL to the main domain
 */
export function getMainDomainUrl(path: string = '/'): string {
  const protocol = window.location.protocol;
  const port = window.location.port ? `:${window.location.port}` : '';
  
  const currentDomain = getCurrentDomain();
  if (currentDomain === 'localhost' || currentDomain === '127.0.0.1') {
    return path;
  }

  return `${protocol}//phynetix.me${port}${path}`;
}

/**
 * Gets the admin domain URL
 * @param path - Optional path to append
 * @returns The full URL to the admin domain
 */
export function getAdminDomainUrl(path: string = '/admin'): string {
  const protocol = window.location.protocol;
  const port = window.location.port ? `:${window.location.port}` : '';
  
  const currentDomain = getCurrentDomain();
  if (currentDomain === 'localhost' || currentDomain === '127.0.0.1') {
    return path;
  }

  return `${protocol}//admin.phynetix.me${port}${path}`;
}
