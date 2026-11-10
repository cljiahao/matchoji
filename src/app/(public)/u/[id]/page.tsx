import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { z } from 'zod';

import { PublicStatsStrip, computePublicStats, listUserTastings } from '@/features/journal';
import { profileMetadata } from '@/features/share';
import {
  BlockButton,
  FollowButton,
  InstagramHandleLink,
  TastingFeed,
  TrustedTasterBadge,
  getProfileView,
} from '@/features/social';
import { YourTaste, buildTasteProfile } from '@/features/taste';
import { createClient } from '@/integrations/supabase/server';
import { PAGE_ROUTES } from '@/lib/constants/routes';

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

const isProfileId = (id: string) => z.uuid().safeParse(id).success;

// One read per request, shared by the page and its metadata.
const loadProfile = cache(async (id: string) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return getProfileView(supabase, id, user?.id ?? null);
});

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const view = isProfileId(id) ? await loadProfile(id) : null;
  if (!view) return { title: 'Taster not found' };
  return profileMetadata({ ...view.profile, teas: view.counts.teas });
}

const JOINED = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' });

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;
  if (!isProfileId(id)) notFound();
  const view = await loadProfile(id);
  if (!view) notFound();
  const { profile, counts, viewer, recent, drinkReviews } = view;
  const visible = profile.isPublic || viewer.isSelf;
  const teaTastings = recent.filter((t) => 'product' in t);
  // Read only when the viewer may see it; a private profile never reaches the query.
  const stats = visible
    ? computePublicStats(await listUserTastings(await createClient(), id))
    : null;

  return (
    <div className="max-w-site mx-auto w-full space-y-10 px-6 py-10 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{profile.name}</h1>
          {profile.isTrustedTaster && (
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              <TrustedTasterBadge />
              {profile.instagramHandle && <InstagramHandleLink handle={profile.instagramHandle} />}
            </div>
          )}
          {!profile.isTrustedTaster && visible && profile.instagramHandle && (
            <div className="mt-3">
              <InstagramHandleLink handle={profile.instagramHandle} />
            </div>
          )}
          {visible && profile.bio && (
            <p className="mt-3 max-w-prose whitespace-pre-line">{profile.bio}</p>
          )}
          <p className="text-muted-foreground mt-2">
            Joined {JOINED.format(new Date(profile.joinedAt))}
            {visible && (
              <>
                {' · '}
                {counts.teas} {counts.teas === 1 ? 'tea' : 'teas'} rated · {counts.followers}{' '}
                {counts.followers === 1 ? 'follower' : 'followers'} · {counts.following} following
              </>
            )}
          </p>
        </div>
        {!viewer.isSelf && (
          <div className="flex items-center gap-2">
            {!viewer.blocked && (
              <FollowButton profileId={profile.id} name={profile.name} following={viewer.follows} />
            )}
            <BlockButton profileId={profile.id} name={profile.name} blocked={viewer.blocked} />
          </div>
        )}
      </header>

      {visible ? (
        <>
          {stats && <PublicStatsStrip stats={stats} />}
          {drinkReviews.length > 0 && (
            <section aria-labelledby="drink-reviews" className="space-y-3">
              <h2 id="drink-reviews" className="text-2xl font-bold tracking-tight">
                Drink reviews
              </h2>
              <TastingFeed tastings={drinkReviews} showAuthor={false} />
              {profile.isTrustedTaster && (
                <p className="text-muted-foreground text-sm">
                  Trusted taster reviews are shown apart from community ratings.{' '}
                  <Link href={PAGE_ROUTES.HOW_WE_RATE} className="underline underline-offset-2">
                    How we rate
                  </Link>
                </p>
              )}
            </section>
          )}
          {teaTastings.length > 0 && (
            <YourTaste profile={buildTasteProfile(teaTastings)} title={`${profile.name}'s taste`} />
          )}
          <section aria-labelledby="recent" className="space-y-3">
            <h2 id="recent" className="text-2xl font-bold tracking-tight">
              Recent tea tastings
            </h2>
            {teaTastings.length > 0 ? (
              <TastingFeed tastings={teaTastings} showAuthor={false} />
            ) : (
              <p className="text-muted-foreground text-sm">No tastings yet.</p>
            )}
          </section>
        </>
      ) : (
        <p className="bg-muted rounded-2xl px-5 py-4 text-sm">
          {profile.name} keeps their profile private. Their ratings still appear on tea pages.
        </p>
      )}
    </div>
  );
}
