import { headers } from 'next/headers';

/**
 * Resolve the base URL for server-side fetch calls. Prefers the configured
 * public site URL and falls back to request headers so that API routes remain
 * reachable in production and preview environments.
 */
export function resolveBaseUrl(): string {
  const configuredBase = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (configuredBase) {
    return configuredBase;
  }

  const headerList = headers();
  const protocol = headerList.get('x-forwarded-proto') ?? 'https';
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host');

  if (host) {
    return `${protocol}://${host}`;
  }

  return 'http://localhost:3000';
}
