import { forbiddenResponse, requireAccess } from '../_lib/access.js';
import { noStoreHeaders } from '../_lib/beta.js';

const FOUNDER_SECURITY_HEADERS = Object.freeze({
  // A currently controlling pre-368 service worker is cache-first. Cache.put must reject
  // Vary:* responses, which prevents one upgrade navigation from persisting private rows
  // before the new network-only worker activates.
  Vary: '*',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; font-src 'self'; media-src 'none'; frame-src 'none'; frame-ancestors 'none'; worker-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'",
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
});

/* Defense-in-depth for every /founder route. Cloudflare Access should reject before Pages
   Functions, but a missing Access application/policy must never turn this tree public. */
export async function onRequest(context) {
  const identity = await requireAccess(context.request, context.env);
  if (!identity) return forbiddenResponse();
  context.data = context.data || {};
  context.data.access = identity;
  const downstream = await context.next();
  const headers = new Headers(downstream.headers);
  // Cloudflare Pages `_headers` rules do not apply to Function-generated/modified
  // responses. This middleware therefore owns the complete private-surface policy.
  const privacyHeaders = noStoreHeaders(FOUNDER_SECURITY_HEADERS);
  for (const [name, value] of Object.entries(privacyHeaders)) headers.set(name, value);
  return new Response(downstream.body, {
    status: downstream.status,
    statusText: downstream.statusText,
    headers,
  });
}
