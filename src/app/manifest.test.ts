import { describe, expect, it } from 'vitest';

import manifest from './manifest';

describe('manifest', () => {
  const m = manifest();

  it('is installable as a standalone app', () => {
    expect(m).toMatchObject({
      name: 'Matchoji',
      short_name: 'Matchoji',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#2f5233',
    });
  });

  it('lists 192, 512 and a maskable 512 icon', () => {
    const icons = m.icons ?? [];
    expect(icons.map((i) => [i.sizes, i.purpose])).toEqual([
      ['192x192', 'any'],
      ['512x512', 'any'],
      ['512x512', 'maskable'],
    ]);
    for (const icon of icons) expect(icon.src).toMatch(/^\/icons\/.+\.png$/);
  });
});
