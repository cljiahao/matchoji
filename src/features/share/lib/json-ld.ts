import { SITE_URL } from '@/lib/constants/env';

interface LdTea {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  grade: string | null;
  imageUrl: string | null;
  avgStars: number | null;
  reviewCount: number;
}

// schema.org Product for a catalogue tea. aggregateRating is left out until someone has rated
// it: a rating of nothing is a false claim, and search engines reject a zero review count.
export function teaJsonLd(tea: LdTea): Record<string, unknown> {
  const rated = tea.avgStars !== null && tea.reviewCount > 0;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: tea.name,
    category: tea.category,
    url: `${SITE_URL}/products/${tea.id}`,
    ...(tea.brand && { brand: { '@type': 'Brand', name: tea.brand } }),
    ...(tea.grade && { description: `${tea.category} tea, ${tea.grade}` }),
    ...(tea.imageUrl && { image: tea.imageUrl }),
    ...(rated && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Number(tea.avgStars?.toFixed(1)),
        reviewCount: tea.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };
}

// The JSON sits inside a <script> element, so a "<" in a tea name must not be able to close it.
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
