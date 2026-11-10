import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { cache } from 'react';
import { z } from 'zod';

import { SignInButton } from '@/features/auth';
import {
  YearInTeaView,
  YearShareButton,
  buildYearInTea,
  isProfilePublic,
  listMyReviews,
} from '@/features/journal';
import { createClient } from '@/integrations/supabase/server';

interface YearPageProps {
  params: Promise<{ year: string }>;
}

const YearParam = z
  .string()
  .regex(/^\d{4}$/)
  .transform(Number);

// One read per request, shared by the page and its metadata so the tab title can follow a 404.
const loadRecap = cache(async (year: number) => {
  // Per-user data, so render per request (see the journal page).
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, recap: null };
  return { supabase, user, recap: buildYearInTea(await listMyReviews(supabase, user.id), year) };
});

export async function generateMetadata({ params }: YearPageProps): Promise<Metadata> {
  const parsed = YearParam.safeParse((await params).year);
  if (!parsed.success) return { title: 'Page not found' };
  const { user, recap } = await loadRecap(parsed.data);
  if (user && !recap) return { title: 'Page not found' };
  return { title: 'Your year in tea', robots: { index: false } };
}

export default async function YearPage({ params }: YearPageProps) {
  const parsed = YearParam.safeParse((await params).year);
  if (!parsed.success) notFound();
  const year = parsed.data;

  const { supabase, user, recap } = await loadRecap(year);

  if (!user) {
    return (
      <div className="max-w-site mx-auto w-full px-6 py-10 sm:py-14">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your year in tea</h1>
        <p className="text-muted-foreground mt-2">Sign in to see your year in tea.</p>
        <div className="mt-6">
          <SignInButton label="Sign in" />
        </div>
      </div>
    );
  }

  // A year with too few tastings has no recap page, so a guessed URL shows nothing.
  if (!recap) notFound();
  const isPublic = await isProfilePublic(supabase, user.id);

  return (
    <div className="max-w-site mx-auto w-full px-6 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your {year} in tea</h1>
      <div className="mt-4">
        {isPublic ? (
          <YearShareButton path={`/u/${user.id}/year/${year}`} title={`My ${year} in tea`} />
        ) : (
          <p className="text-muted-foreground text-sm">
            Your profile is private, so there is no share card.{' '}
            <Link href="/account" className="text-brand font-semibold hover:underline">
              Make it public in your account
            </Link>{' '}
            to share your year.
          </p>
        )}
      </div>
      <div className="mt-8">
        <YearInTeaView recap={recap} />
      </div>
    </div>
  );
}
