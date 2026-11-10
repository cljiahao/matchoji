import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const APP = resolve(__dirname, '../../src/app');
const STATUS_CALL = /\b(?:notFound|permanentRedirect|redirect)\(/;

function pages(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return pages(path);
    return entry.name === 'page.tsx' ? [path] : [];
  });
}

// A loading.tsx wraps everything below it in Suspense, so the response streams with a 200 before
// the page can redirect or 404. Pages that decide a status must sit under no skeleton.
describe('loading.tsx boundaries', () => {
  it('never sit above a page that redirects or calls notFound()', () => {
    const offenders = pages(APP).flatMap((page) => {
      if (!STATUS_CALL.test(readFileSync(page, 'utf8'))) return [];
      const wrapping: string[] = [];
      for (let dir = dirname(page); dir.startsWith(APP); dir = dirname(dir)) {
        const loading = join(dir, 'loading.tsx');
        if (existsSync(loading)) wrapping.push(relative(APP, loading));
      }
      return wrapping.length ? [`${relative(APP, page)} is under ${wrapping.join(', ')}`] : [];
    });
    expect(offenders).toEqual([]);
  });
});
