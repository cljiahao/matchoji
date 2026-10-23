import { CATEGORY_STYLES } from '@/features/products';
import {
  PREP_METHOD_LABELS,
  TASTE_ATTRIBUTES,
  TASTE_ATTRIBUTE_LABELS,
  noteLabel,
} from '@/features/reviews';

import type { TasteProfile } from '../lib';

const fmt = (value: number) => value.toFixed(1);

// Vivino's "Your taste": what the journal's ratings say about the taster.
export function YourTaste({ profile }: { profile: TasteProfile }) {
  if (profile.ratedTeas === 0) return null;
  const tastes = TASTE_ATTRIBUTES.filter(
    (a) => profile.liked[a] !== undefined || profile.disliked[a] !== undefined
  );

  return (
    <section aria-labelledby="your-taste" className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h2 id="your-taste" className="text-2xl font-bold tracking-tight">
          Your taste
        </h2>
        {profile.early && (
          <p className="text-muted-foreground text-sm">
            Early read from {profile.ratedTeas} {profile.ratedTeas === 1 ? 'tea' : 'teas'}; it
            sharpens after 5.
          </p>
        )}
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        {profile.favouriteNotes.length > 0 && (
          <div className="bg-muted rounded-2xl px-4 py-3">
            <dt className="text-muted-foreground">Notes in teas you love</dt>
            <dd className="font-semibold">{profile.favouriteNotes.map(noteLabel).join(', ')}</dd>
          </div>
        )}
        {profile.favouritePrep && (
          <div className="bg-muted rounded-2xl px-4 py-3">
            <dt className="text-muted-foreground">How you like it</dt>
            <dd className="font-semibold">{PREP_METHOD_LABELS[profile.favouritePrep]}</dd>
          </div>
        )}
        {(['matcha', 'hojicha'] as const)
          .filter((c) => profile.byCategory[c].teas > 0)
          .map((category) => {
            const { teas, avgStars } = profile.byCategory[category];
            return (
              <div key={category} className="bg-muted rounded-2xl px-4 py-3">
                <dt className="text-muted-foreground">{CATEGORY_STYLES[category].label}</dt>
                <dd className="font-semibold">
                  {teas} {teas === 1 ? 'tea' : 'teas'}
                  {avgStars !== null && `, ${fmt(avgStars)} out of 5 on average`}
                </dd>
              </div>
            );
          })}
      </dl>

      {tastes.length > 0 && (
        <table className="w-full max-w-md text-sm">
          <caption className="text-muted-foreground mb-2 text-left">
            Taste, out of 5: teas you rated 4★ or more against 2★ or less
          </caption>
          <thead>
            <tr className="text-muted-foreground">
              <th scope="col" className="py-1 text-left font-normal">
                Taste
              </th>
              <th scope="col" className="py-1 text-right font-normal">
                Loved
              </th>
              <th scope="col" className="py-1 text-right font-normal">
                Disliked
              </th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {tastes.map((attribute) => (
              <tr key={attribute} className="border-t">
                <th scope="row" className="py-1.5 text-left font-semibold">
                  {TASTE_ATTRIBUTE_LABELS[attribute]}
                </th>
                <td className="py-1.5 text-right">
                  {profile.liked[attribute] === undefined ? '–' : fmt(profile.liked[attribute])}
                </td>
                <td className="py-1.5 text-right">
                  {profile.disliked[attribute] === undefined
                    ? '–'
                    : fmt(profile.disliked[attribute])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
