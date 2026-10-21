import { describe, expect, it } from 'vitest';

import { makeReview } from '../../../../test/support/render';
import { summarizeReviews } from './summarize-reviews';

const prep = (
  method: 'usucha' | 'latte' | null,
  doseG: number | null = null,
  waterMl: number | null = null,
  waterTempC: number | null = null
) => ({
  method,
  doseG,
  waterMl,
  waterTempC,
});

describe('summarizeReviews', () => {
  it('counts the distribution', () => {
    const s = summarizeReviews([
      makeReview({ stars: 5 }),
      makeReview({ stars: 5 }),
      makeReview({ stars: 2 }),
    ]);
    expect(s.distribution).toEqual({ 1: 0, 2: 1, 3: 0, 4: 0, 5: 2 });
  });

  it('omits profile with no attributes', () => {
    expect(summarizeReviews([makeReview(), makeReview()]).profile).toBeNull();
  });

  it('averages only reviews that set an attribute', () => {
    const s = summarizeReviews([
      makeReview({ profile: { umami: 5, body: 2 } }),
      makeReview({ profile: { umami: 3 } }),
      makeReview(),
    ]);
    expect(s.profile).toEqual({ averages: { umami: 4, body: 2 }, contributors: 2 });
  });

  it('ranks top notes by count, ties by first appearance, at most six', () => {
    const s = summarizeReviews([
      makeReview({ flavorNotes: ['nutty', 'roasty'] }),
      makeReview({ flavorNotes: ['roasty', 'caramel', 'woody', 'smoky', 'sweet', 'earthy'] }),
      makeReview({ flavorNotes: ['malty'] }),
    ]);
    expect(s.topNotes).toEqual([
      { note: 'roasty', count: 2 },
      { note: 'nutty', count: 1 },
      { note: 'caramel', count: 1 },
      { note: 'woody', count: 1 },
      { note: 'smoky', count: 1 },
      { note: 'sweet', count: 1 },
    ]);
  });

  // Flavour families add up every note, not just the top six.
  it('counts every note for the flavour families', () => {
    const s = summarizeReviews([
      makeReview({ flavorNotes: ['nutty', 'roasty', 'caramel', 'woody', 'smoky', 'sweet'] }),
      makeReview({ flavorNotes: ['earthy', 'roasty'] }),
    ]);
    expect(s.noteCounts).toHaveLength(7);
    expect(s.noteCounts[0]).toEqual({ note: 'roasty', count: 2 });
    expect(s.noteCounts.at(-1)).toEqual({ note: 'earthy', count: 1 });
    expect(s.topNotes).toEqual(s.noteCounts.slice(0, 6));
  });

  it('returns null prep without a method', () => {
    expect(summarizeReviews([makeReview({ prep: prep(null, 2, 70, 80) })]).prep).toBeNull();
  });

  it('medians prep numbers only with two or more values', () => {
    const s = summarizeReviews([
      makeReview({ prep: prep('usucha', 2, 70, 80) }),
      makeReview({ prep: prep('usucha', 3, 60, null) }),
      makeReview({ prep: prep('usucha', 4, null, null) }),
      makeReview({ prep: prep('latte', null, null, null) }),
    ]);
    expect(s.prep).toEqual({ method: 'usucha', doseG: 3, waterMl: 65, waterTempC: null });
  });

  it('collects review photos newest first as given', () => {
    const s = summarizeReviews([
      makeReview({ photoUrl: 'a.jpg' }),
      makeReview(),
      makeReview({ photoUrl: 'b.jpg' }),
    ]);
    expect(s.photos).toEqual(['a.jpg', 'b.jpg']);
  });
});
