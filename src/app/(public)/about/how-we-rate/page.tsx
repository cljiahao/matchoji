import type { Metadata } from 'next';
import Link from 'next/link';

import { DisclosureBadge } from '@/features/reviews';
import { PAGE_ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = {
  title: 'How we rate',
  description:
    'How Matchoji scores hojicha and matcha drinks: trusted taster scores, community ratings and disclosure labels.',
};

const DISCLOSURES = [
  { value: 'invited', meaning: 'The café invited the taster to try the drink.' },
  { value: 'gifted', meaning: 'The taster got the drink or the visit for free.' },
  { value: 'paid', meaning: 'The taster was paid to post about it.' },
] as const;

export default function HowWeRatePage() {
  return (
    <div className="max-w-site mx-auto w-full space-y-10 px-6 py-10 sm:py-14">
      <header className="max-w-prose space-y-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">How we rate</h1>
        <p className="text-muted-foreground">
          Matchoji rates hojicha and matcha drinks one drink at a time, in Singapore and Johor
          Bahru.
        </p>
      </header>

      <section aria-labelledby="two-scores" className="max-w-prose space-y-2">
        <h2 id="two-scores" className="text-2xl font-bold tracking-tight">
          Two scores, never blended
        </h2>
        <p>
          Every drink can show two scores. The <strong>taster score</strong> comes from trusted
          tasters: people we invited, who link the Instagram post for each drink. The{' '}
          <strong>community score</strong> comes from everyone else.
        </p>
        <p>
          We never mix them into one number. You can see which one you are looking at, and how many
          people are behind it.
        </p>
      </section>

      <section aria-labelledby="labels" className="max-w-prose space-y-3">
        <h2 id="labels" className="text-2xl font-bold tracking-tight">
          Invited, gifted and paid reviews
        </h2>
        <p>
          Invited, gifted and paid reviews all count toward the taster score, and every one is
          labelled. If a taster was invited, gifted or paid, the review says so. A drink with such
          reviews also says how many of its taster reviews carry one of these labels.
        </p>
        <ul className="space-y-2">
          {DISCLOSURES.map(({ value, meaning }) => (
            <li key={value} className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <DisclosureBadge disclosure={value} />
              <span>{meaning}</span>
            </li>
          ))}
        </ul>
        <p>A review with no label was not invited, gifted or paid.</p>
      </section>

      <section aria-labelledby="one-rating" className="max-w-prose space-y-2">
        <h2 id="one-rating" className="text-2xl font-bold tracking-tight">
          One rating per person
        </h2>
        <p>
          Each person has one rating per drink. If you rate a drink again, your newest rating
          replaces the old one in the score.
        </p>
      </section>

      <p>
        <Link href={PAGE_ROUTES.TASTERS} className="text-brand font-semibold hover:underline">
          Meet the trusted tasters
        </Link>
      </p>
    </div>
  );
}
