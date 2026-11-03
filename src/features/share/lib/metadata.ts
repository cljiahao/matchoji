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

// A private profile shares as a bare taster with no counts, matching its site-default image.
export function profileMetadata(profile: {
  id: string;
  name: string;
  isPublic: boolean;
  teas: number;
}): Metadata {
  const noun = profile.teas === 1 ? 'tea' : 'teas';
  const description = profile.isPublic
    ? `${profile.name} has rated ${profile.teas} ${noun} on Matchoji.`
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
