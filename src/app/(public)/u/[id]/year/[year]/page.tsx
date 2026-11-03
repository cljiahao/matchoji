import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { z } from 'zod';

import { getPublicYear, toYearCard } from '@/features/journal';
import { yearMetadata } from '@/features/share';
import { createClient } from '@/integrations/supabase/server';

interface SharedYearProps {
  params: Promise<{ id: string; year: string }>;
}

const Params = z.object({
  id: z.uuid(),
  year: z
    .string()
    .regex(/^\d{4}$/)
    .transform(Number),
});

// One read per request, shared by the page and its metadata. Read as the visitor: a private
// taster's year resolves to null, so the page 404s rather than confirming it exists.
const loadYear = cache(async (id: string, year: number) =>
  getPublicYear(await createClient(), id, year)
);

export async function generateMetadata({ params }: SharedYearProps): Promise<Metadata> {
  const parsed = Params.safeParse(await params);
  const found = parsed.success ? await loadYear(parsed.data.id, parsed.data.year) : null;
  if (!parsed.success || !found) return { title: 'Year in tea not found' };
  return yearMetadata({
    id: parsed.data.id,
    year: parsed.data.year,
    taster: found.taster,
    tastings: found.recap.tastings,
  });
}

export default async function SharedYearPage({ params }: SharedYearProps) {
  const parsed = Params.safeParse(await params);
  if (!parsed.success) notFound();
  const found = await loadYear(parsed.data.id, parsed.data.year);
  if (!found) notFound();
  const card = toYearCard(found.recap, found.taster);

  return (
    <div className="max-w-site mx-auto w-full space-y-6 px-6 py-10 sm:py-14">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        {card.taster}&apos;s {card.year} in tea
      </h1>
      <dl className="bg-muted grid gap-6 rounded-3xl p-6 sm:grid-cols-3 sm:p-8">
        <div>
          <dt className="text-muted-foreground text-sm">Tastings</dt>
          <dd className="text-3xl font-extrabold tabular-nums">{card.tastings}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-sm">Different teas</dt>
          <dd className="text-3xl font-extrabold tabular-nums">{card.teas}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-sm">Top rated</dt>
          <dd className="font-semibold">{card.topRated.tea}</dd>
        </div>
      </dl>
      <p>
        <Link
          href={`/u/${parsed.data.id}`}
          className="text-brand inline-flex min-h-11 items-center font-semibold hover:underline"
        >
          See {card.taster}&apos;s profile
        </Link>
      </p>
    </div>
  );
}
