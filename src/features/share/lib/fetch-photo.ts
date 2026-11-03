const MAX_BYTES = 4_000_000;
const TYPES = new Set(['image/jpeg', 'image/png']);

// satori decodes JPEG and PNG only, and a slow or broken photo host must not sink the whole card,
// so the photo is fetched here and handed over as a data URI; any failure returns null and the
// caller draws the tin instead.
export async function fetchPhoto(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    const type = res.headers.get('content-type')?.split(';')[0]?.trim() ?? '';
    if (!res.ok || !TYPES.has(type)) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length > MAX_BYTES) return null;
    return `data:${type};base64,${bytes.toString('base64')}`;
  } catch {
    return null;
  }
}
