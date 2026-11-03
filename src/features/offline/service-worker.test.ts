import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

type Listener = (event: never) => void;

const source = readFileSync(path.resolve(__dirname, '../../../public/sw.js'), 'utf8');

// Runs the real public/sw.js against a fake worker scope and an in-memory cache.
function boot(swUrl = 'https://matchoji.test/sw.js?v=abc') {
  const listeners = new Map<string, Listener>();
  const stores = new Map<string, Map<string, Response>>();
  const open = (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name)!;
    return {
      put: async (req: Request | string, res: Response) => {
        store.set(
          typeof req === 'string' ? new URL(req, 'https://matchoji.test').href : req.url,
          res
        );
      },
      match: async (req: Request | string) =>
        store.get(typeof req === 'string' ? new URL(req, 'https://matchoji.test').href : req.url),
    };
  };
  const caches = {
    open: async (name: string) => open(name),
    keys: async () => [...stores.keys()],
    delete: async (name: string) => stores.delete(name),
  };
  const self = {
    location: new URL(swUrl),
    addEventListener: (type: string, fn: Listener) => listeners.set(type, fn),
    skipWaiting: vi.fn(async () => {}),
    clients: { claim: vi.fn(async () => {}) },
  };
  const network = vi.fn<(req: Request) => Promise<Response>>(async () => new Response('net'));
  // Runs the repo's own public/sw.js, not input.
  // eslint-disable-next-line sonarjs/code-eval
  vm.runInNewContext(source, { self, caches, fetch: network, URL, Response });

  const dispatch = async (type: string, event: Record<string, unknown>) => {
    let pending: Promise<unknown> | undefined;
    const e = {
      ...event,
      waitUntil: (p: Promise<unknown>) => (pending = p),
      respondWith: (p: Promise<unknown>) => (pending = p),
    };
    listeners.get(type)?.(e as never);
    return { handled: pending !== undefined, result: await pending };
  };
  const navigate = (url: string) =>
    dispatch('fetch', { request: { url, method: 'GET', mode: 'navigate' } });
  const asset = (url: string, mode = 'no-cors') =>
    dispatch('fetch', { request: { url, method: 'GET', mode } });
  return { self, stores, network, dispatch, navigate, asset };
}

describe('service worker', () => {
  it('precaches /offline on install, in a cache named for the build', async () => {
    const sw = boot();
    sw.network.mockResolvedValue(new Response('offline page'));
    await sw.dispatch('install', {});
    expect([...sw.stores.keys()]).toEqual(['matchoji-shell-abc']);
    expect([...sw.stores.get('matchoji-shell-abc')!.keys()]).toEqual([
      'https://matchoji.test/offline',
    ]);
    expect(sw.self.skipWaiting).toHaveBeenCalled();
  });

  it('fails the install when /offline cannot be fetched', async () => {
    const sw = boot();
    sw.network.mockResolvedValue(new Response('nope', { status: 500 }));
    await expect(sw.dispatch('install', {})).rejects.toThrow();
  });

  it('deletes caches from earlier deploys on activate', async () => {
    const sw = boot();
    sw.stores.set('matchoji-shell-old', new Map());
    sw.stores.set('matchoji-shell-abc', new Map());
    await sw.dispatch('activate', {});
    expect([...sw.stores.keys()]).toEqual(['matchoji-shell-abc']);
    expect(sw.self.clients.claim).toHaveBeenCalled();
  });

  it('serves hashed build files and icons cache-first', async () => {
    const sw = boot();
    const url = 'https://matchoji.test/_next/static/chunks/a.js';
    sw.network.mockResolvedValue(new Response('js'));
    await sw.asset(url);
    await sw.asset(url);
    expect(sw.network).toHaveBeenCalledTimes(1);
    const hit = await sw.asset('https://matchoji.test/icons/icon-192.png');
    expect(hit.handled).toBe(true);
  });

  it('does not cache a failed asset response', async () => {
    const sw = boot();
    sw.network.mockResolvedValue(new Response('gone', { status: 404 }));
    await sw.asset('https://matchoji.test/_next/static/chunks/b.js');
    expect(sw.stores.get('matchoji-shell-abc')?.size ?? 0).toBe(0);
  });

  it('shows the cached /offline page when a navigation fails, and never stores pages', async () => {
    const sw = boot();
    sw.network.mockResolvedValueOnce(new Response('offline page'));
    await sw.dispatch('install', {});
    sw.network.mockRejectedValue(new TypeError('Failed to fetch'));
    const { result } = await sw.navigate('https://matchoji.test/journal');
    expect(await (result as Response).text()).toBe('offline page');

    sw.network.mockResolvedValue(new Response('<html>for one user</html>'));
    await sw.navigate('https://matchoji.test/journal');
    expect([...sw.stores.get('matchoji-shell-abc')!.keys()]).toEqual([
      'https://matchoji.test/offline',
    ]);
  });

  it('passes API, auth, monitoring, other methods and other origins through untouched', async () => {
    const sw = boot();
    for (const url of [
      'https://matchoji.test/api/health',
      'https://matchoji.test/auth/callback',
      'https://matchoji.test/monitoring',
    ]) {
      expect((await sw.navigate(url)).handled).toBe(false);
      expect((await sw.asset(url)).handled).toBe(false);
    }
    expect((await sw.asset('https://matchoji.test/explore', 'cors')).handled).toBe(false);
    expect((await sw.asset('https://other.test/_next/static/a.js')).handled).toBe(false);
    const post = await sw.dispatch('fetch', {
      request: { url: 'https://matchoji.test/explore', method: 'POST', mode: 'navigate' },
    });
    expect(post.handled).toBe(false);
  });

  it('falls back to a dev cache name without a build id', async () => {
    const sw = boot('https://matchoji.test/sw.js');
    sw.network.mockResolvedValue(new Response('x'));
    await sw.dispatch('install', {});
    expect([...sw.stores.keys()]).toEqual(['matchoji-shell-dev']);
  });
});
