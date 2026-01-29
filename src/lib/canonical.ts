// Canonical domain helpers
// Keep all user-facing auth flows on the custom domain in production.

export const CANONICAL_ORIGIN = "https://phynetix.me";

const STAGING_HOST = "phynetix.lovable.app";
export const STAGING_ORIGIN = `https://${STAGING_HOST}`;
const CANONICAL_HOSTS = new Set(["phynetix.me", "www.phynetix.me"]);

/**
 * Returns an absolute URL for auth redirects.
 * - On the canonical domain OR the staging published domain, always returns CANONICAL_ORIGIN + path
 * - Otherwise (preview / localhost), uses the current origin
 */
export function getAuthRedirectTo(path: string): string {
  const hostname = window.location.hostname;
  const origin =
    CANONICAL_HOSTS.has(hostname) || hostname === STAGING_HOST
      ? CANONICAL_ORIGIN
      : window.location.origin;

  // Allow passing through absolute URLs when needed
  if (path.startsWith("https://") || path.startsWith("http://")) return path;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalizedPath}`;
}

/**
 * Safety net: if anyone hits the published Lovable domain, forward them to the canonical domain.
 * NOTE: This should be safe once your backend auth URL config points to the canonical domain.
 */
export function maybeRedirectToCanonical(): void {
  if (window.location.hostname !== STAGING_HOST) return;

  const target = `${CANONICAL_ORIGIN}${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (window.location.href === target) return;

  window.location.replace(target);
}

/**
 * OAuth endpoints (/authorize, /callback) are served only on the published domain.
 * If you run the app on a custom domain (or elsewhere), start OAuth on the published
 * domain, then rely on maybeRedirectToCanonical() to forward the user back.
 */
export function getOAuthRedirectUri(): string {
  const hostname = window.location.hostname;

  // Custom domains don't serve Lovable Cloud auth endpoints.
  if (CANONICAL_HOSTS.has(hostname)) return STAGING_ORIGIN;

  // Published domain is already correct.
  if (hostname === STAGING_HOST) return STAGING_ORIGIN;

  // Preview / localhost.
  return window.location.origin;
}
