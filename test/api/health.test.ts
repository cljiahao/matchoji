import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const server = vi.hoisted(() => ({ client: null as unknown, fail: false }));
vi.mock('@/integrations/supabase/server', () => ({
  createClient: async () => {
    if (server.fail) throw new Error('Supabase is not configured');
    return server.client;
  },
}));

import { GET as getHealthPath } from '@/app/api/health/route';

const request = () => new NextRequest('http://localhost/api/health');
const rpc = (result: { data: unknown; error: unknown }) => ({ rpc: vi.fn(async () => result) });

beforeEach(() => {
  server.fail = false;
});

describe('GET /api/health (Docker / probe path)', () => {
  it('returns ok with 200 when the database answers', async () => {
    server.client = rpc({ data: true, error: null });
    const response = await getHealthPath(request());
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data).toMatchObject({ status: 'ok', checks: { database: 'ok' } });
    expect(data.timestamp).toBeDefined();
  });

  it('returns 503 when the database errors', async () => {
    server.client = rpc({ data: null, error: new Error('timeout') });
    const response = await getHealthPath(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      status: 'degraded',
      checks: { database: 'down' },
    });
  });

  it('returns 503 when Supabase is not configured', async () => {
    server.fail = true;
    const response = await getHealthPath(request());
    expect(response.status).toBe(503);
  });
});
