// Images come only from this site, the project's Supabase Storage (review photos, tea photos),
// Google's profile-photo host (the signed-in avatar) and OpenStreetMap's tile server (the maps). Without a Supabase URL at build time
// (CI's blank-env build) any https host is allowed.
// Leaflet loads tiles as <img>; the policy's one third-party map host.
export const OSM_TILE_HOST = 'https://tile.openstreetmap.org';

export function imageSources(supabaseUrl: string | undefined): string {
  let storage = 'https:';
  try {
    if (supabaseUrl) storage = new URL(supabaseUrl).origin;
  } catch {
    // An unparsable URL keeps the permissive fallback; the app itself refuses to start without one.
  }
  const hosts =
    storage === 'https:' ? storage : `${storage} https://*.googleusercontent.com ${OSM_TILE_HOST}`;
  return `img-src 'self' data: blob: ${hosts}`;
}

export function generateNonce(): string {
  return btoa(crypto.randomUUID());
}

// Built per request because the nonce changes every time. frame-ancestors is omitted in dev:
// browsers enforce it even for localhost, which blocks IDE-embedded preview panes (most render
// via <iframe>). 'unsafe-eval' is dev-only: React uses eval there to rebuild server error stacks.
export function buildCsp({
  nonce,
  isDev,
  supabaseUrl,
}: {
  nonce: string;
  isDev: boolean;
  supabaseUrl: string | undefined;
}): string {
  return [
    ...(isDev ? [] : ["frame-ancestors 'none'"]),
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    // strict-dynamic makes script-src ignore 'self', and workers fall back to it, so the service
    // worker needs its own same-origin allowance.
    "worker-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    imageSources(supabaseUrl),
  ].join('; ');
}
