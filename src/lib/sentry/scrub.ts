import type { ErrorEvent } from '@sentry/nextjs';

const REDACTED = '[redacted]';
const EMAIL = /[\w.%+-]{1,64}@[\w-]{1,63}(?:\.[\w-]{1,63}){1,4}/g;
// Supabase access/refresh tokens are JWTs (three base64url segments starting "eyJ").
const JWT = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g;
const SENSITIVE_HEADERS = new Set([
  'cookie',
  'set-cookie',
  'authorization',
  'proxy-authorization',
  'x-api-key',
  'apikey',
]);
const SENSITIVE_KEY = /token|secret|password|authorization|cookie|apikey|api_key|sb-/i;

export function scrubString(value: string): string {
  return value.replace(JWT, REDACTED).replace(EMAIL, REDACTED);
}

function scrubValue(value: unknown, depth = 0): unknown {
  if (typeof value === 'string') return scrubString(value);
  if (depth > 6 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => scrubValue(item, depth + 1));
  return Object.fromEntries(
    Object.entries(value).map(([key, inner]) => [
      key,
      SENSITIVE_KEY.test(key) ? REDACTED : scrubValue(inner, depth + 1),
    ])
  );
}

// Runs as beforeSend: strips identity, cookies, auth headers and token-shaped strings so an
// error report can never carry a user's session or email to a third party.
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  const scrubbed = scrubValue({ ...event }) as ErrorEvent;
  delete scrubbed.user;
  if (scrubbed.request) {
    delete scrubbed.request.cookies;
    delete scrubbed.request.data;
    delete scrubbed.request.query_string;
    if (scrubbed.request.headers) {
      scrubbed.request.headers = Object.fromEntries(
        Object.entries(scrubbed.request.headers).filter(
          ([name]) => !SENSITIVE_HEADERS.has(name.toLowerCase())
        )
      );
    }
  }
  return scrubbed;
}
