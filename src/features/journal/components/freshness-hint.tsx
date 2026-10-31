import Link from 'next/link';

import { freshnessHint } from '../lib/storage-guidance';

// Matcha fades once opened, so a tea you have open shows its age against the maker's own
// advice. A maker with no published figure gets the general guidance, not an attribution.
export function FreshnessHint({
  brand,
  openedOn,
  today,
}: {
  brand: string | null;
  openedOn: string | null;
  today: string;
}) {
  const hint = freshnessHint(brand, openedOn, today);
  if (!hint) return null;
  const unit = hint.daysOpen === 1 ? 'day' : 'days';
  const age = hint.daysOpen === 0 ? 'Opened today' : `Opened ${hint.daysOpen} ${unit} ago`;
  return (
    <p className="text-muted-foreground text-sm">
      {age} ·{' '}
      {hint.maker ? (
        <>
          <a
            href={hint.maker.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {hint.maker.name} suggests
          </a>{' '}
          using {hint.maker.phrase}
        </>
      ) : (
        'matcha is best finished within about a month of opening'
      )}
      {'. '}
      <Link href={hint.guideHref} className="text-brand font-semibold hover:underline">
        Keeping matcha fresh
      </Link>
    </p>
  );
}
