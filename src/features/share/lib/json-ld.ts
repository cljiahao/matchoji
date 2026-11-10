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

interface LdCafe {
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  instagramHandle: string | null;
  websiteUrl: string | null;
  // Only the taster score is claimed: it is the one with a named, disclosed source.
  tasterAvg: number | null;
  tasterCount: number;
}

// schema.org CafeOrCoffeeShop. aggregateRating needs at least one taster review behind it, for
// the same reason teaJsonLd leaves it out of an unrated tea.
export function cafeJsonLd(cafe: LdCafe): Record<string, unknown> {
  const rated = cafe.tasterAvg !== null && cafe.tasterCount > 0;
  return {
    '@context': 'https://schema.org',
    '@type': 'CafeOrCoffeeShop',
    name: cafe.name,
    ...(cafe.address && { address: cafe.address }),
    ...(cafe.lat !== null &&
      cafe.lng !== null && {
        geo: { '@type': 'GeoCoordinates', latitude: cafe.lat, longitude: cafe.lng },
      }),
    ...(cafe.websiteUrl && { url: cafe.websiteUrl }),
    ...(cafe.instagramHandle && {
      sameAs: [`https://www.instagram.com/${cafe.instagramHandle}/`],
    }),
    ...(rated && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Number(cafe.tasterAvg?.toFixed(1)),
        reviewCount: cafe.tasterCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };
}

// A menu item has no rating of its own in schema.org, so none is claimed.
export function drinkJsonLd(drink: {
  name: string;
  slug: string;
  cafeName: string;
  cafeSlug: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'MenuItem',
    name: drink.name,
    description: `${drink.name} at ${drink.cafeName}`,
    url: `${SITE_URL}/cafes/${drink.cafeSlug}/${drink.slug}`,
  };
}
