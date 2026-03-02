// Canonical domain helpers
// Keep all user-facing auth flows on the custom domain in production.

export const CANONICAL_ORIGIN = "https://phynetix.me";

const STAGING_HOST = "phynetix.lovable.app";
export const STAGING_ORIGIN = `https://${STAGING_HOST}`;
const CANONICAL_HOSTS = new Set(["phynetix.me", "www.phynetix.me"]);

/** Check if we're running on a Lovable-served domain (preview or published) */
export function isLovableDomain(): boolean {
  const hostname = window.location.hostname;
  return (
    hostname === STAGING_HOST ||
    hostname.includes("lovable.app") ||
    hostname.includes("lovableproject.com")
  );
}

/**
 * Returns an absolute URL for auth redirects.
 * Always points to the canonical domain in production contexts.
 */
export function getAuthRedirectTo(path: string): string {
  const hostname = window.location.hostname;
  // On canonical, staging, or any external deployment (Vercel etc.) → always canonical
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  const origin = isLocal ? window.location.origin : CANONICAL_ORIGIN;

  if (path.startsWith("https://") || path.startsWith("http://")) return path;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalizedPath}`;
}

/**
 * Safety net: if anyone hits the published Lovable domain, forward them to the canonical domain.
 */
export function maybeRedirectToCanonical(): void {
  if (window.location.hostname !== STAGING_HOST) return;

  const target = `${CANONICAL_ORIGIN}${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (window.location.href === target) return;

  window.location.replace(target);
}

/**
 * OAuth redirect URI — only used for Lovable Cloud managed OAuth.
 */
export function getOAuthRedirectUri(): string {
  const hostname = window.location.hostname;

  if (CANONICAL_HOSTS.has(hostname)) return STAGING_ORIGIN;
  if (hostname === STAGING_HOST) return STAGING_ORIGIN;

  return window.location.origin;
}
