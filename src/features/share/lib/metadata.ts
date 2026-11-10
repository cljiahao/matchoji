import type { Metadata } from 'next';

import { SITE_URL } from '@/lib/constants/env';

interface ShareableTea {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  status: string;
  avgStars: number | null;
  reviewCount: number;
}

// The preview image comes from the segment's opengraph-image file, which Next adds to both the
// Open Graph and Twitter tags; naming no images here keeps that file in charge.
function card(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${path}`,
      siteName: 'Matchoji',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export function teaMetadata(product: ShareableTea): Metadata {
  const title = product.brand ? `${product.name} · ${product.brand}` : product.name;
  const rating =
    product.avgStars === null
      ? 'Not yet rated'
      : `${product.avgStars.toFixed(1)} out of 5 from ${product.reviewCount} ratings`;
  return {
    ...card(
      title,
      `${title}: ${product.category}. ${rating} on Matchoji.`,
      `/products/${product.id}`
    ),
    // Teas outside the catalogue are shareable by link but kept out of search engines.
    robots: product.status === 'approved' ? undefined : { index: false },
  };
}

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`;

// A private profile shares as a bare taster with no counts, matching its site-default image.
export function profileMetadata(profile: {
  id: string;
  name: string;
  isPublic: boolean;
  teas: number;
  drinks: number;
}): Metadata {
  // Drinks lead because the site is drink-first; a tea-only reviewer reads as before.
  const rated = [
    ...(profile.drinks > 0 ? [plural(profile.drinks, 'drink')] : []),
    ...(profile.teas > 0 || profile.drinks === 0 ? [plural(profile.teas, 'tea')] : []),
  ].join(' and ');
  const description = profile.isPublic
    ? `${profile.name} has rated ${rated} on Matchoji.`
    : 'A taster on Matchoji.';
  return {
    ...card(profile.name, description, `/u/${profile.id}`),
    robots: profile.isPublic ? undefined : { index: false },
  };
}

export function yearMetadata(year: {
  id: string;
  year: number;
  taster: string;
  tastings: number;
}): Metadata {
  const noun = year.tastings === 1 ? 'tasting' : 'tastings';
  return card(
    `${year.taster}'s ${year.year} in tea`,
    `${year.taster} logged ${year.tastings} ${noun} in ${year.year} on Matchoji.`,
    `/u/${year.id}/year/${year.year}`
  );
}

export function cafeMetadata(cafe: {
  slug: string;
  name: string;
  area: string | null;
  cityName: string;
  drinkCount: number;
  status: string;
  tasterAvg: number | null;
  tasterCount: number;
}): Metadata {
  const title = cafe.area ? `${cafe.name} · ${cafe.area}` : cafe.name;
  const rating =
    cafe.tasterAvg === null || cafe.tasterCount === 0
      ? 'Not yet rated'
      : `${cafe.tasterAvg.toFixed(1)} out of 5 from ${plural(cafe.tasterCount, 'taster review')}`;
  return {
    ...card(
      title,
      `${cafe.name}, ${cafe.cityName}: ${plural(cafe.drinkCount, 'drink')} listed. ${rating} on Matchoji.`,
      `/cafes/${cafe.slug}`
    ),
    robots: cafe.status === 'approved' ? undefined : { index: false },
  };
}

// The taster score is quoted when there is one, then the community score labelled as such;
// the two are never blended into one figure.
export function drinkMetadata(drink: {
  slug: string;
  name: string;
  cafeName: string;
  cafeSlug: string;
  status: string;
  tasterAvg: number | null;
  tasterCount: number;
  communityAvg: number | null;
  communityCount: number;
}): Metadata {
  const title = `${drink.name} · ${drink.cafeName}`;
  let rating = 'Not yet rated';
  if (drink.tasterAvg !== null && drink.tasterCount > 0) {
    rating = `${drink.tasterAvg.toFixed(1)} out of 5 from ${plural(drink.tasterCount, 'taster review')}`;
  } else if (drink.communityAvg !== null && drink.communityCount > 0) {
    rating = `${drink.communityAvg.toFixed(1)} out of 5 from ${plural(drink.communityCount, 'community review')}`;
  }
  return {
    ...card(
      title,
      `${drink.name} at ${drink.cafeName}. ${rating} on Matchoji.`,
      `/cafes/${drink.cafeSlug}/${drink.slug}`
    ),
    robots: drink.status === 'approved' ? undefined : { index: false },
  };
}
