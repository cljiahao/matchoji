import Link from 'next/link';

import { CATEGORY_STYLES } from '@/features/products';
import { DisclosureBadge, InstagramPostLink, drinkHref } from '@/features/reviews';
import { cn } from '@/lib/utils';

import type { Tasting } from '../types';

const DAY = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const dayLabel = (iso: string) => DAY.format(new Date(`${iso}T00:00:00Z`));

interface TastingFeedProps {
  tastings: Tasting[];
  // On a profile page every tasting is the same person's, so their name is left out.
  showAuthor?: boolean;
}

// "Ben rated Sayaka-no-mukashi 5★": the feed and a profile's recent tastings.
export function TastingFeed({ tastings, showAuthor = true }: TastingFeedProps) {
  return (
    <ul className="divide-y rounded-2xl border">
      {tastings.map((t) => {
        const isDrink = 'drink' in t;
        const category = isDrink ? t.drink.base : t.product.category;
        return (
          <li
            key={t.id}
            className="flex flex-wrap items-baseline gap-x-2 gap-y-1 px-5 py-3 text-sm"
          >
            {showAuthor &&
              (t.authorId ? (
                <Link href={`/u/${t.authorId}`} className="font-semibold hover:underline">
                  {t.reviewerName}
                </Link>
              ) : (
                <span className="font-semibold">{t.reviewerName}</span>
              ))}
            <span className="text-muted-foreground">{showAuthor ? 'rated' : 'Rated'}</span>
            {isDrink ? (
              <>
                <Link
                  href={drinkHref(t.drink.cafe.slug, t.drink.slug)}
                  className="font-semibold hover:underline"
                >
                  {t.drink.name}
                </Link>
                <span className="text-muted-foreground">at {t.drink.cafe.name}</span>
              </>
            ) : (
              <Link href={`/products/${t.product.id}`} className="font-semibold hover:underline">
                {t.product.name}
              </Link>
            )}
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-bold tabular-nums',
                CATEGORY_STYLES[category].tint
              )}
            >
              {t.stars}★<span className="sr-only"> out of 5</span>
            </span>
            <DisclosureBadge disclosure={t.disclosure} />
            <time dateTime={t.tastedOn} className="text-muted-foreground ml-auto text-xs">
              {dayLabel(t.tastedOn)}
            </time>
            {t.notes && <p className="text-muted-foreground line-clamp-2 w-full">{t.notes}</p>}
            {t.instagramUrl && <InstagramPostLink url={t.instagramUrl} />}
          </li>
        );
      })}
    </ul>
  );
}
