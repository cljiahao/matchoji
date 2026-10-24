import type { Metadata } from 'next';
import { connection } from 'next/server';

import {
  DeleteAccountSection,
  DisplayNameForm,
  ExportDataButton,
  getMyProfile,
} from '@/features/account';
import { SignInButton } from '@/features/auth';
import { BlockedList, PrivacyToggle, listBlocked } from '@/features/social';
import { createClient } from '@/integrations/supabase/server';

export const metadata: Metadata = { title: 'Your account', robots: { index: false } };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export default async function AccountPage() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="max-w-site mx-auto w-full space-y-10 px-6 py-10 sm:py-14">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Your account</h1>
      {user ? (
        <AccountSections
          userId={user.id}
          profile={await getMyProfile(supabase, user.id)}
          blocked={await listBlocked(supabase, user.id)}
        />
      ) : (
        <div className="space-y-4">
          <p className="text-muted-foreground">Sign in to manage your name and your data.</p>
          <SignInButton label="Sign in" />
        </div>
      )}
    </div>
  );
}

function AccountSections({
  userId,
  profile,
  blocked,
}: {
  userId: string;
  profile: Awaited<ReturnType<typeof getMyProfile>>;
  blocked: { id: string; name: string }[];
}) {
  return (
    <>
      {profile && <p className="text-muted-foreground">Signed in as {profile.email}</p>}
      <Section title="Your name">
        <DisplayNameForm userId={userId} current={profile?.displayName ?? ''} />
      </Section>
      <Section title="Privacy">
        <PrivacyToggle userId={userId} isPublic={profile?.isPublic ?? true} />
        <p className="text-muted-foreground text-sm">
          <a href={`/u/${userId}`} className="underline underline-offset-2">
            See your profile
          </a>
        </p>
      </Section>
      <Section title="Blocked tasters">
        <BlockedList userId={userId} blocked={blocked} />
      </Section>
      <Section title="Your data">
        <p className="text-muted-foreground max-w-xl text-sm">
          Everything Matchoji holds about you (profile, tastings, want-to-try, stock reports and
          shop) as one JSON file.
        </p>
        <ExportDataButton userId={userId} />
      </Section>
      <Section title="Delete your account">
        <DeleteAccountSection userId={userId} />
      </Section>
    </>
  );
}
