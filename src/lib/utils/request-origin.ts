import { type NextRequest } from 'next/server';

// TRUST_PROXY: set to the number of trusted proxy hops in front of the app
// (1 = ALB → App, 2 = ALB → Traefik → App); empty/unset = X-Forwarded-*
// headers are not trusted. A hop count is truthy, so the checks below hold.
// Callers MUST validate the resolved host against an ALLOWED_HOSTS set before using
// this in any emitted URL (password reset links, OAuth callbacks, etc.) — this
// function alone does not prevent Host header injection.
export function getAppOrigin(request: NextRequest): string {
  const trustProxy = process.env.TRUST_PROXY;
  const proto =
    (trustProxy ? request.headers.get('x-forwarded-proto')?.split(',')[0].trim() : undefined) ??
    request.nextUrl.protocol.replace(/:$/, '');
  const host =
    (trustProxy
      ? (request.headers.get('x-forwarded-host') ?? request.headers.get('host'))
      : undefined) ?? request.nextUrl.host;
  return `${proto}://${host}`;
}
