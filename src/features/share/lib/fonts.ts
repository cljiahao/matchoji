import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Figtree is committed as static files (SIL OFL, see fonts/OFL.txt) because satori reads TTF/OTF,
// not the woff2 next/font ships, and the image routes must not call Google at request time.
// The path is spelled out as a literal join so Next's output file tracing bundles the files.
const DIR = path.join(process.cwd(), 'src/features/share/fonts');

const FILES = [
  { file: 'Figtree-Regular.ttf', weight: 400 },
  { file: 'Figtree-Bold.ttf', weight: 700 },
  { file: 'Figtree-ExtraBold.ttf', weight: 800 },
] as const;

type Weight = (typeof FILES)[number]['weight'];

let cached: Promise<{ name: string; data: Buffer; weight: Weight; style: 'normal' }[]> | undefined;

export function loadFonts() {
  cached ??= Promise.all(
    FILES.map(async ({ file, weight }) => ({
      name: 'Figtree',
      data: await readFile(path.join(DIR, file)),
      weight,
      style: 'normal' as const,
    }))
  );
  return cached;
}
