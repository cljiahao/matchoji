import { OG_CONTENT_TYPE, OG_SIZE, renderDrinkImage } from '@/features/share';

export const alt = 'A drink and its rating on Matchoji';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string; drink: string }>;
}) {
  const { slug, drink } = await params;
  return renderDrinkImage(slug, drink);
}
