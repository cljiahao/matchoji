import { describe, expect, it, vi } from 'vitest';

vi.mock('next/font/google', () => ({ Figtree: () => ({ variable: 'figtree' }) }));
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('@/components/layout', () => ({ Providers: () => null, ThemeProvider: () => null }));

import { metadata, viewport } from './layout';

describe('root layout', () => {
  it('colours the browser bar for light and dark', () => {
    expect(viewport.themeColor).toEqual([
      { media: '(prefers-color-scheme: light)', color: '#ffffff' },
      { media: '(prefers-color-scheme: dark)', color: '#101010' },
    ]);
  });

  it('is installable on iOS and links the icons', () => {
    expect(metadata.appleWebApp).toMatchObject({ capable: true, title: 'Matchoji' });
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image' });
    expect(JSON.stringify(metadata.icons)).toContain('/icons/apple-icon.png');
  });

  it('describes the café-drink positioning, not the old tea-rating line', () => {
    expect(metadata.description).toContain('hojicha and matcha drinks in Singapore');
    expect(metadata.description).not.toContain('one cup at a time');
  });

  it('canonicalises each page to its own path', () => {
    expect(metadata.alternates).toEqual({ canonical: './' });
  });
});
