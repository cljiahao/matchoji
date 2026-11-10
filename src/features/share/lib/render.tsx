import { ImageResponse } from 'next/og';

import { SlugSchema, cityBySlug, getCafePage, getDrinkPage } from '@/features/cafes';
import { getPublicYear, toYearCard } from '@/features/journal';
import { getProduct } from '@/features/products';
import { getProfileView } from '@/features/social';
import { createClient } from '@/integrations/supabase/server';

import {
  CafeCard,
  DrinkCard,
  ProfileCard,
  SiteCard,
  TeaCard,
  YearCard,
} from '../components/share-cards';
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

// Same rule as the profile card: read with no session, and anything that is not a public
// taster's qualifying year falls back to the site image.
export async function renderYearImage(id: string, year: number) {
  const found = await getPublicYear(await createClient(), id, year);
  if (!found) return renderSiteImage();
  return respond(<YearCard data={toYearCard(found.recap, found.taster)} />);
}

// Like the other cards, only a page that is publicly listed gets its own image; a merged,
// rejected, pending or unknown café shares the site card.
export async function renderCafeImage(slug: string) {
  if (!SlugSchema.safeParse(slug).success) return renderSiteImage();
  const page = await getCafePage(await createClient(), slug);
  if (page.kind !== 'found' || page.cafe.status !== 'approved') return renderSiteImage();
  const { cafe, scores, drinks } = page;
  return respond(
    <CafeCard
      cafe={{
        name: cafe.name,
        area: cafe.area,
        cityName: cityBySlug(cafe.citySlug)?.name ?? '',
        drinkCount: drinks.length,
        tasterAvg: scores.tasterAvg,
        tasterCount: scores.tasterCount,
      }}
    />
  );
}

export async function renderDrinkImage(cafeSlug: string, drinkSlug: string) {
  if (!SlugSchema.safeParse(cafeSlug).success || !SlugSchema.safeParse(drinkSlug).success) {
    return renderSiteImage();
  }
  const page = await getDrinkPage(await createClient(), cafeSlug, drinkSlug);
  if (page.kind !== 'found' || page.drink.status !== 'approved') return renderSiteImage();
  const { drink } = page;
  const photo = await fetchPhoto(drink.photoUrl);
  return respond(
    <DrinkCard
      drink={{
        name: drink.name,
        base: drink.base,
        cafeName: drink.cafe.name,
        area: drink.cafe.area,
        photo,
        ...drink.scores,
      }}
    />
  );
}
