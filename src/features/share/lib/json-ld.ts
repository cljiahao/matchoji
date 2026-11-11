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

interface LdMenuItem {
  name: string;
  slug: string;
  price: number | null;
  currency: string;
}

// An Offer only when there is a price: a drink listed without one makes no offer.
const offerFor = (price: number | null, currency: string) =>
  price === null
    ? {}
    : { offers: { '@type': 'Offer', price: price.toFixed(2), priceCurrency: currency } };

interface LdCafe {
  slug: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  instagramHandle: string | null;
  websiteUrl: string | null;
  // Only the taster score is claimed: it is the one with a named, disclosed source.
  tasterAvg: number | null;
  // Reviews, the unit tasterAvg is averaged over (not people).
  tasterCount: number;
  menu: LdMenuItem[];
  // A photo of one of its drinks; there is no café photo, so none is claimed when no drink has one.
  photoUrl: string | null;
}

// schema.org CafeOrCoffeeShop. aggregateRating needs at least one taster review behind it, for
// the same reason teaJsonLd leaves it out of an unrated tea. hasMenu lists the approved drinks and
// is left out for a café with none. The image is a drink photo, left out when there is none: the
// share-card route's path carries a build hash, so a guessed URL would 404.
export function cafeJsonLd(cafe: LdCafe): Record<string, unknown> {
  const rated = cafe.tasterAvg !== null && cafe.tasterCount > 0;
  return {
    '@context': 'https://schema.org',
    '@type': 'CafeOrCoffeeShop',
    name: cafe.name,
    ...(cafe.photoUrl && { image: cafe.photoUrl }),
    ...(cafe.address && { address: cafe.address }),
    ...(cafe.lat !== null &&
      cafe.lng !== null && {
        geo: { '@type': 'GeoCoordinates', latitude: cafe.lat, longitude: cafe.lng },
      }),
    ...(cafe.websiteUrl && { url: cafe.websiteUrl }),
    ...(cafe.instagramHandle && {
      sameAs: [`https://www.instagram.com/${cafe.instagramHandle}/`],
    }),
    ...(cafe.menu.length > 0 && {
      hasMenu: {
        '@type': 'Menu',
        hasMenuSection: {
          '@type': 'MenuSection',
          name: 'Drinks',
          hasMenuItem: cafe.menu.map((item) => ({
            '@type': 'MenuItem',
            name: item.name,
            url: `${SITE_URL}/cafes/${cafe.slug}/${item.slug}`,
            ...offerFor(item.price, item.currency),
          })),
        },
      },
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

// A menu item has no rating of its own in schema.org, so none is claimed. The image is the
// drink's photo, left out when it has none (the share-card path carries a build hash).
export function drinkJsonLd(drink: {
  name: string;
  slug: string;
  cafeName: string;
  cafeSlug: string;
  photoUrl: string | null;
  price: number | null;
  currency: string;
}): Record<string, unknown> {
  const url = `${SITE_URL}/cafes/${drink.cafeSlug}/${drink.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'MenuItem',
    name: drink.name,
    description: `${drink.name} at ${drink.cafeName}`,
    url,
    ...(drink.photoUrl && { image: drink.photoUrl }),
    ...offerFor(drink.price, drink.currency),
  };
}
