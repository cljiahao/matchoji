import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const APP = resolve(__dirname, '../../src/app');
const STATUS_CALL = /\b(?:notFound|permanentRedirect|redirect)\(/;
const COMMENTS = /(?:\/\*[\s\S]*?\*\/)|(?:\/\/[^\n]*)/g;
const SEGMENT_FILES = new Set(['page.tsx', 'layout.tsx']);

// A regex strip is enough here: a URL inside a string ("https://x") loses its tail, which only
// hides text that could not be a status call anyway.
function stripComments(source: string): string {
  return source.replace(COMMENTS, '');
}

function segmentFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return segmentFiles(path);
    return SEGMENT_FILES.has(entry.name) ? [path] : [];
  });
}

// A page sits inside its own directory's loading.tsx. A layout renders outside its own segment's
// boundary, so only a loading.tsx in a parent directory wraps it.
export function findOffenders(appDir: string): string[] {
  return segmentFiles(appDir).flatMap((file) => {
    if (!STATUS_CALL.test(stripComments(readFileSync(file, 'utf8')))) return [];
    const start = file.endsWith('layout.tsx') ? dirname(dirname(file)) : dirname(file);
    const wrapping: string[] = [];
    for (let dir = start; dir.startsWith(appDir); dir = dirname(dir)) {
      const loading = join(dir, 'loading.tsx');
      if (existsSync(loading)) wrapping.push(relative(appDir, loading));
    }
    return wrapping.length ? [`${relative(appDir, file)} is under ${wrapping.join(', ')}`] : [];
  });
}

// A loading.tsx wraps everything below it in Suspense, so the response streams with a 200 before
// the page can redirect or 404. Pages that decide a status must sit under no skeleton.
describe('loading.tsx boundaries', () => {
  it('never sit above a page or layout that redirects or calls notFound()', () => {
    expect(findOffenders(APP)).toEqual([]);
  });
});

describe('findOffenders', () => {
  const roots: string[] = [];

  function fixture(files: Record<string, string>): string {
    const root = mkdtempSync(join(tmpdir(), 'loading-boundaries-'));
    roots.push(root);
    for (const [name, body] of Object.entries(files)) {
      const path = join(root, name);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, body);
    }
    return root;
  }

  afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
  });

  it('ignores a call that only appears in a comment', () => {
    const root = fixture({
      'a/loading.tsx': 'export default () => null;',
      'a/page.tsx': '// never redirect() here\n/* notFound() too */\nexport default () => null;',
    });
    expect(findOffenders(root)).toEqual([]);
  });

  it('fails a real call under a loading boundary', () => {
    const root = fixture({
      'a/loading.tsx': 'export default () => null;',
      'a/page.tsx': 'notFound();',
    });
    expect(findOffenders(root)).toEqual(['a/page.tsx is under a/loading.tsx']);
  });

  it('fails a layout call under a parent loading boundary', () => {
    const root = fixture({
      'a/loading.tsx': 'export default () => null;',
      'a/b/layout.tsx': 'permanentRedirect("/x");',
    });
    expect(findOffenders(root)).toEqual(['a/b/layout.tsx is under a/loading.tsx']);
  });

  it('passes a layout call beside its own segment loading.tsx', () => {
    const root = fixture({
      'a/loading.tsx': 'export default () => null;',
      'a/layout.tsx': 'redirect("/x");',
    });
    expect(findOffenders(root)).toEqual([]);
  });
});
