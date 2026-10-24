import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { z } from 'zod';

import { BlockButton, FollowButton, TastingFeed, getProfileView } from '@/features/social';
import { YourTaste, buildTasteProfile } from '@/features/taste';
import { createClient } from '@/integrations/supabase/server';

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
  return {
    title: view.profile.name,
    robots: view.profile.isPublic ? undefined : { index: false },
  };
}

const JOINED = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' });

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;
  if (!isProfileId(id)) notFound();
  const view = await loadProfile(id);
  if (!view) notFound();
  const { profile, counts, viewer, recent } = view;
  const visible = profile.isPublic || viewer.isSelf;

  return (
    <div className="max-w-site mx-auto w-full space-y-10 px-6 py-10 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{profile.name}</h1>
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
          {recent.length > 0 && (
            <YourTaste profile={buildTasteProfile(recent)} title={`${profile.name}'s taste`} />
          )}
          <section aria-labelledby="recent" className="space-y-3">
            <h2 id="recent" className="text-2xl font-bold tracking-tight">
              Recent tastings
            </h2>
            {recent.length > 0 ? (
              <TastingFeed tastings={recent} showAuthor={false} />
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
