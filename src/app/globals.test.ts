import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const css = readFileSync(join(__dirname, 'globals.css'), 'utf8');
const light = css.slice(css.indexOf(':root {'), css.indexOf('.dark {'));
const dark = css.slice(css.indexOf('.dark {'), css.indexOf('@layer base'));

const token = (block: string, name: string): string => {
  const match = block.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})\\b`, 'i'));
  if (!match) throw new Error(`--${name} is not a plain hex in this block`);
  return match[1];
};

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const ratio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe('theme tokens meet WCAG AA', () => {
  it('keeps field edges at 3:1 on the page and the tile', () => {
    expect(ratio(token(light, 'input'), token(light, 'background'))).toBeGreaterThanOrEqual(3);
    expect(ratio(token(light, 'input'), token(light, 'tile'))).toBeGreaterThanOrEqual(3);
    expect(ratio(token(dark, 'input'), token(light, 'black'))).toBeGreaterThanOrEqual(3);
  });

  it('keeps muted text at 4.5:1 on the page and the tile', () => {
    expect(
      ratio(token(light, 'muted-foreground'), token(light, 'background'))
    ).toBeGreaterThanOrEqual(4.5);
    expect(ratio(token(light, 'muted-foreground'), token(light, 'muted'))).toBeGreaterThanOrEqual(
      4.5
    );
  });

  it('keeps text on brand fills, and brand text on the page, at 4.5:1 in both themes', () => {
    expect(ratio(token(light, 'brand-foreground'), token(light, 'brand'))).toBeGreaterThanOrEqual(
      4.5
    );
    expect(ratio(token(light, 'brand'), token(light, 'background'))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(token(dark, 'brand-foreground'), token(dark, 'brand'))).toBeGreaterThanOrEqual(
      4.5
    );
    expect(ratio(token(dark, 'brand'), token(light, 'black'))).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps white text on the category badges at 4.5:1', () => {
    for (const name of ['matcha', 'hojicha']) {
      expect(ratio(token(light, `${name}-foreground`), token(light, name))).toBeGreaterThanOrEqual(
        4.5
      );
    }
  });
});
