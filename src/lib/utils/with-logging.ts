import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { logger } from '@/lib/logger';

// Generic over the route context so typed dynamic-segment params survive the wrap:
//   export const GET = withLogging(async (req) => …)                                    // static
//   export const GET = withLogging<RouteContext<{ id: string }>>(async (req, { params }) => …)  // dynamic
export type RouteContext<P = Record<string, string>> = { params: Promise<P> };

type RouteHandler<C> = (req: NextRequest, ctx: C) => Promise<NextResponse>;

// The returned handler takes the context via a variadic tuple ([ctx] | []) so static routes
// (and unit tests) can call it with just the request, while dynamic routes still receive
// their typed params. Next.js passes the context for dynamic segments at runtime.
// A caller's x-request-id is kept for tracing only when it looks like an id; anything else
// (overlong, odd characters) is replaced so it cannot flood or spoof the logs.
const REQUEST_ID = /^[A-Za-z0-9_-]{1,64}$/;

export function requestIdFrom(header: string | null): string {
  return header && REQUEST_ID.test(header) ? header : crypto.randomUUID();
}

export function withLogging<C = unknown>(
  handler: RouteHandler<C>
): (req: NextRequest, ...rest: [ctx: C] | []) => Promise<NextResponse> {
  return async (req, ...rest) => {
    const start = Date.now();
    const { method } = req;
    const path = new URL(req.url).pathname;
    const requestId = requestIdFrom(req.headers.get('x-request-id'));

    try {
      const res = await handler(req, ...(rest as [ctx: C]));
      logger.info({ requestId, method, path, status: res.status, duration_ms: Date.now() - start });
      return res;
    } catch (err) {
      logger.error({
        requestId,
        method,
        path,
        error: err instanceof Error ? err.message : String(err),
      });
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}
