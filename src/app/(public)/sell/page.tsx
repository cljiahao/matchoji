import type { Metadata } from 'next';
import { connection } from 'next/server';

import { SignInButton } from '@/features/auth';
import {
  ListingForm,
  ReapplyButton,
  VendorForm,
  VendorListings,
  getMyVendor,
  listCatalogue,
  listVendorListings,
  type Vendor,
} from '@/features/marketplace';
import { createClient } from '@/integrations/supabase/server';

export const metadata: Metadata = { title: 'Sell on Matchoji' };

function Page({ intro, children }: { intro: string; children: React.ReactNode }) {
  return (
    <div className="max-w-site mx-auto w-full px-6 py-10 sm:py-14">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Sell on Matchoji</h1>
      <p className="text-muted-foreground mt-2 max-w-2xl">{intro}</p>
      <div className="mt-8 space-y-10">{children}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function StatusNote({ vendor }: { vendor: Vendor }) {
  if (vendor.status === 'pending') {
    return (
      <p className="bg-muted rounded-2xl px-5 py-4 text-sm">
        <span className="font-semibold">{vendor.name} is under review.</span> We check every shop by
        hand. You can add listings once it is approved; until then you can still edit your details
        below.
      </p>
    );
  }
  return (
    <div className="bg-muted space-y-3 rounded-2xl px-5 py-4 text-sm">
      <p>
        <span className="font-semibold">{vendor.name} was not approved.</span> Your listings are
        hidden.{vendor.reviewNote && <> Our note: {vendor.reviewNote}</>}
      </p>
      <p>Update your details below if needed, then send the application again.</p>
      <ReapplyButton />
    </div>
  );
}

export default async function SellPage() {
  // Per user, so rendered per request; see the journal page for why this matters to builds.
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Page intro="Farms, roasters and tea shops can list the teas on Matchoji they sell, with a price and a link to buy. Sign in to apply.">
        <div>
          <SignInButton label="Sign in to apply" />
        </div>
      </Page>
    );
  }

  const vendor = await getMyVendor(supabase, user.id);

  if (!vendor) {
    return (
      <Page intro="Tell us about your shop. We review every application by hand; once approved, you can list the teas you sell, and they appear under “Where to buy” on each tea’s page.">
        <VendorForm userId={user.id} />
      </Page>
    );
  }

  if (vendor.status !== 'approved') {
    return (
      <Page intro="Your shop and its listings on Matchoji.">
        <StatusNote vendor={vendor} />
        <Section title="Shop details">
          <VendorForm userId={user.id} vendor={vendor} />
        </Section>
      </Page>
    );
  }

  const [listings, catalogue] = await Promise.all([
    listVendorListings(supabase, vendor.id),
    listCatalogue(supabase),
  ]);
  const listed = new Set(listings.map((l) => l.productId));
  const lastCurrency = listings[0]?.currency;

  return (
    <Page intro="Your listings appear under “Where to buy” on each tea’s page. Buyers check out on your site, through your buy link.">
      <Section title="Your listings">
        <VendorListings vendorId={vendor.id} listings={listings} />
      </Section>
      <Section title="Add a listing">
        <div className="max-w-xl">
          <ListingForm
            vendorId={vendor.id}
            products={catalogue.filter((p) => !listed.has(p.id))}
            defaultCurrency={lastCurrency}
          />
        </div>
      </Section>
      <Section title="Shop details">
        <VendorForm userId={user.id} vendor={vendor} />
      </Section>
    </Page>
  );
}
