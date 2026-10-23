'use client';

import { Star } from 'lucide-react';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';

import { CATEGORY_STYLES, type ProductCategory } from '@/features/products';
import { cn } from '@/lib/utils';

import { FLAVOR_NOTES, editionLabel, noteLabel, truncateNotes } from '../lib';
import type { Review } from '../types';
import { PrepSummary } from './prep-summary';

// Roughly four lines at the max-w-prose width.
const NOTES_PREVIEW_CHARS = 280;

// Dates are calendar days (no time zone), so format them in UTC to keep the day as stored.
const DAY = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const formatDay = (day: string) => DAY.format(new Date(`${day}T00:00:00Z`));

interface ReviewItemProps {
  review: Review;
  category: ProductCategory;
  // Controls another feature renders under the review (likes, comments, report).
  footer?: ReactNode;
}

export function ReviewItem({ review, category, footer }: ReviewItemProps) {
  const [expanded, setExpanded] = useState(false);
  // Notes are free text in the DB; only the category's own vocabulary is shown.
  const notes = review.flavorNotes.filter((n) => FLAVOR_NOTES[category].includes(n));
  const preview = review.notes ? truncateNotes(review.notes, NOTES_PREVIEW_CHARS) : null;

  return (
    <article className="border-border rounded-2xl border p-5">
      <p
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold tabular-nums',
          CATEGORY_STYLES[category].tint
        )}
      >
        <Star aria-hidden="true" className={cn('h-3.5 w-3.5', CATEGORY_STYLES[category].star)} />
        {review.stars.toFixed(1)}
        <span className="sr-only"> out of 5 stars</span>
      </p>

      {review.notes && preview && (
        <p className="mt-3 max-w-prose whitespace-pre-line">
          {expanded ? review.notes : preview.text}
          {preview.truncated && (
            <>
              {' '}
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="text-brand font-semibold hover:underline"
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
            </>
          )}
        </p>
      )}
      {notes.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {notes.map((note) => (
            <li key={note} className="bg-muted rounded-full px-2.5 py-0.5 text-xs">
              {noteLabel(note)}
            </li>
          ))}
        </ul>
      )}
      <PrepSummary prep={review.prep} className="mt-2 text-xs" />
      {review.edition.harvestYear && (
        <p className="text-muted-foreground mt-1 text-xs">
          {editionLabel(review.edition.harvestYear, review.edition.flush)}
        </p>
      )}
      {review.photoUrl && (
        // Supabase Storage host isn't known until a real project exists, so next/image's
        // remotePatterns can't be configured yet — plain img until then.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={review.photoUrl}
          alt="Review"
          className="mt-3 h-40 w-40 rounded-xl object-cover"
        />
      )}
      <footer className="border-border mt-4 flex items-center gap-2 border-t pt-3 text-sm">
        <span
          aria-hidden="true"
          className="bg-muted flex-center h-6 w-6 rounded-full text-xs font-bold"
        >
          {review.reviewerName.charAt(0).toUpperCase()}
        </span>
        {review.authorId ? (
          <Link href={`/u/${review.authorId}`} className="font-semibold hover:underline">
            {review.reviewerName}
          </Link>
        ) : (
          <span className="font-semibold">{review.reviewerName}</span>
        )}
        <time dateTime={review.tastedOn} className="text-muted-foreground">
          {formatDay(review.tastedOn)}
        </time>
      </footer>
      {footer}
    </article>
  );
}
