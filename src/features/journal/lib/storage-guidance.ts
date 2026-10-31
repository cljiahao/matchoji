import { guideHref } from '@/features/learn';

export interface MakerGuidance {
  // The longest time after opening the maker's own wording allows.
  days: number;
  // The maker's wording, as a clause that follows "suggests using".
  phrase: string;
  sourceUrl: string;
}

// Only makers whose own site states a figure appear here (checked 2026-10-31). Never add a
// figure from a retailer or a guess: a maker without an entry gets the general advice instead.
// Marukyu Koyamaen's own FAQ says only "as soon as possible" once opened, so it has no entry.
export const MAKER_GUIDANCE: Readonly<Record<string, MakerGuidance>> = {
  Ippodo: {
    days: 30,
    phrase: 'within a month of opening',
    sourceUrl:
      'https://support.global.ippodo-tea.co.jp/hc/en-us/articles/4404037142031-How-long-will-my-tea-be-fresh-after-opening',
  },
  Aiya: {
    days: 60,
    phrase: 'within 1 to 2 months of opening',
    sourceUrl: 'https://aiya-america.com/blog/how-to-store-matcha-for-freshness-and-flavor-6e4cf0/',
  },
};

const DAY = 86_400_000;

export interface FreshnessHint {
  daysOpen: number;
  // Set only when the maker published a figure.
  maker: { name: string; phrase: string; sourceUrl: string } | null;
  guideHref: string;
}

// Days since opening plus the maker's own guidance; null when no opening date is recorded.
export function freshnessHint(
  brand: string | null,
  openedOn: string | null,
  today: string
): FreshnessHint | null {
  if (!openedOn) return null;
  const daysOpen = Math.max(0, Math.round((Date.parse(today) - Date.parse(openedOn)) / DAY));
  const entry = brand ? MAKER_GUIDANCE[brand] : undefined;
  return {
    daysOpen,
    maker: brand && entry ? { name: brand, ...entry } : null,
    guideHref: guideHref('storing-matcha'),
  };
}
