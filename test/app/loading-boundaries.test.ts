import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import ts from 'typescript';
import { afterEach, describe, expect, it } from 'vitest';

const APP = resolve(__dirname, '../../src/app');
const STATUS_FUNCTIONS = new Set(['notFound', 'permanentRedirect', 'redirect']);
const SEGMENT_FILE = /^(?:page|layout)\.(?:tsx?|jsx?)$/;
const LOADING_FILE = /^loading\.(?:tsx?|jsx?)$/;

// Walking the AST, not matching text, so comments and strings that mention a status function
// never count and a `//` or `/*` inside a string cannot hide a real call.
export function callsStatusFunction(source: string): boolean {
  const file = ts.createSourceFile(
    'segment.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const visit = (node: ts.Node): boolean =>
    (ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      STATUS_FUNCTIONS.has(node.expression.text)) ||
    ts.forEachChild(node, visit) === true;
  return visit(file);
}

function segmentFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return segmentFiles(path);
    return SEGMENT_FILE.test(entry.name) ? [path] : [];
  });
}

function isInside(appDir: string, dir: string): boolean {
  return (dir + sep).startsWith(appDir + sep);
}

// A page sits inside its own directory's loading file. A layout renders outside its own
// segment's boundary, so only a loading file in a parent directory wraps it.
export function findOffenders(appDir: string): string[] {
  return segmentFiles(appDir).flatMap((file) => {
    if (!callsStatusFunction(readFileSync(file, 'utf8'))) return [];
    const isLayout = /^layout\./.test(file.slice(dirname(file).length + 1));
    const wrapping: string[] = [];
    for (
      let dir = isLayout ? dirname(dirname(file)) : dirname(file);
      isInside(appDir, dir);
      dir = dirname(dir)
    ) {
      for (const entry of readdirSync(dir)) {
        if (LOADING_FILE.test(entry)) wrapping.push(relative(appDir, join(dir, entry)));
      }
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
  const LOADING = 'export default () => null;';

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

  it('passes a page with a call and no loading.tsx', () => {
    expect(findOffenders(fixture({ 'a/page.tsx': 'notFound();' }))).toEqual([]);
  });

  it('fails a page call under its own loading.tsx', () => {
    const root = fixture({ 'a/loading.tsx': LOADING, 'a/page.tsx': 'notFound();' });
    expect(findOffenders(root)).toEqual(['a/page.tsx is under a/loading.tsx']);
  });

  it('fails a page call under a parent-folder loading.tsx', () => {
    const root = fixture({ 'a/loading.tsx': LOADING, 'a/b/c/page.tsx': 'notFound();' });
    expect(findOffenders(root)).toEqual(['a/b/c/page.tsx is under a/loading.tsx']);
  });

  it.each(['redirect("/x");', 'permanentRedirect("/x");'])('fails %s in a page', (call) => {
    const root = fixture({ 'a/loading.tsx': LOADING, 'a/page.tsx': call });
    expect(findOffenders(root)).toHaveLength(1);
  });

  it('fails a layout call under a parent loading.tsx', () => {
    const root = fixture({
      'a/loading.tsx': LOADING,
      'a/b/layout.tsx': 'permanentRedirect("/x");',
    });
    expect(findOffenders(root)).toEqual(['a/b/layout.tsx is under a/loading.tsx']);
  });

  it('passes a layout call beside its own segment loading.tsx', () => {
    const root = fixture({ 'a/loading.tsx': LOADING, 'a/layout.tsx': 'redirect("/x");' });
    expect(findOffenders(root)).toEqual([]);
  });

  it('passes a layout call in a tree with no loading.tsx', () => {
    expect(findOffenders(fixture({ 'a/b/layout.tsx': 'redirect("/x");' }))).toEqual([]);
  });

  it('scans .ts, .js and .jsx segment files and loading files too', () => {
    const root = fixture({
      'a/loading.js': LOADING,
      'a/page.jsx': 'notFound();',
      'a/b/layout.ts': 'redirect("/x");',
    });
    expect(findOffenders(root)).toHaveLength(2);
  });
});

describe('callsStatusFunction', () => {
  it('ignores line and multi-line block comments', () => {
    expect(callsStatusFunction('// redirect(x)\n/* a\n notFound()\n permanentRedirect(y) */')).toBe(
      false
    );
  });

  it('ignores a string or template that contains a call', () => {
    expect(callsStatusFunction("const a = 'notFound()'; const b = `redirect(${x})`;")).toBe(false);
  });

  it('still finds a call after // inside a string on the same line', () => {
    expect(callsStatusFunction("const u = 'https://x'; redirect(u);")).toBe(true);
  });

  it('still finds a call after /* inside a string on the same line', () => {
    expect(callsStatusFunction("const g = '/api/*'; notFound();\n// */")).toBe(true);
  });
});
