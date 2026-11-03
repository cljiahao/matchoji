import { describe, expect, it } from 'vitest';

import { profileMetadata, teaMetadata } from './metadata';

const tea = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Samidori',
  brand: 'Ippodo',
  category: 'matcha',
  status: 'approved',
  avgStars: 4.26,
  reviewCount: 12,
};

describe('teaMetadata', () => {
  it('titles with the maker and describes the rating', () => {
    const meta = teaMetadata(tea);
    expect(meta.title).toBe('Samidori · Ippodo');
    expect(meta.description).toBe(
      'Samidori · Ippodo: matcha. 4.3 out of 5 from 12 ratings on Matchoji.'
    );
  });

  it('asks for a large Twitter card and an absolute Open Graph url, leaving the image to the file', () => {
    const meta = teaMetadata(tea);
    expect(meta.twitter).toMatchObject({ card: 'summary_large_image' });
    expect(meta.openGraph).toMatchObject({ siteName: 'Matchoji', type: 'website' });
    expect(String(meta.openGraph?.url)).toMatch(new RegExp(`^https?://.+/products/${tea.id}$`));
    expect(meta.openGraph).not.toHaveProperty('images');
  });

  it('says a tea is unrated and noindexes one outside the catalogue', () => {
    const meta = teaMetadata({
      ...tea,
      brand: null,
      avgStars: null,
      reviewCount: 0,
      status: 'pending',
    });
    expect(meta.title).toBe('Samidori');
    expect(meta.description).toContain('Not yet rated');
    expect(meta.robots).toEqual({ index: false });
  });
});

describe('profileMetadata', () => {
  const profile = {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Mei',
    isPublic: true,
    teas: 3,
  };

  it('shows the name and count of a public profile', () => {
    const meta = profileMetadata(profile);
    expect(meta.title).toBe('Mei');
    expect(meta.description).toBe('Mei has rated 3 teas on Matchoji.');
    expect(meta.robots).toBeUndefined();
    expect(meta.twitter).toMatchObject({ card: 'summary_large_image' });
  });

  it('uses the singular for one tea', () => {
    expect(profileMetadata({ ...profile, teas: 1 }).description).toContain('1 tea on');
  });

  it('keeps counts out of a private profile and out of search engines', () => {
    const meta = profileMetadata({ ...profile, isPublic: false, teas: 7 });
    expect(meta.description).toBe('A taster on Matchoji.');
    expect(JSON.stringify(meta)).not.toContain('7');
    expect(meta.robots).toEqual({ index: false });
  });
});
