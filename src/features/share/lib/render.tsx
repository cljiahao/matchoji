import { ImageResponse } from 'next/og';

import { getProduct } from '@/features/products';
import { getProfileView } from '@/features/social';
import { createClient } from '@/integrations/supabase/server';

import { ProfileCard, SiteCard, TeaCard } from '../components/share-cards';
import { fetchPhoto } from './fetch-photo';
import { loadFonts } from './fonts';
import { OG_SIZE } from './palette';

async function respond(card: React.ReactElement) {
  return new ImageResponse(card, { ...OG_SIZE, fonts: await loadFonts() });
}

export function renderSiteImage() {
  return respond(<SiteCard />);
}

export async function renderTeaImage(id: string) {
  const product = await getProduct(await createClient(), id);
  if (!product) return renderSiteImage();
  const photo = await fetchPhoto(product.imageUrl);
  return respond(<TeaCard tea={{ ...product, photo }} />);
}

// Read as an anonymous viewer: a crawler has no session, and a private profile must never
// reach the card, so anything but a public profile falls back to the site image.
export async function renderProfileImage(id: string) {
  const view = await getProfileView(await createClient(), id, null);
  if (!view?.profile.isPublic) return renderSiteImage();
  return respond(<ProfileCard name={view.profile.name} teas={view.counts.teas} />);
}
