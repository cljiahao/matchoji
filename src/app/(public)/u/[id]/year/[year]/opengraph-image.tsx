import { OG_CONTENT_TYPE, OG_SIZE, renderSiteImage, renderYearImage } from '@/features/share';

export const alt = 'A taster’s year in tea on Matchoji';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ id: string; year: string }> }) {
  const { id, year } = await params;
  if (!/^\d{4}$/.test(year)) return renderSiteImage();
  return renderYearImage(id, Number(year));
}
