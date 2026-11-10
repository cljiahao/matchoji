import { OG_CONTENT_TYPE, OG_SIZE, renderCafeImage } from '@/features/share';

export const alt = 'A café and its drink ratings on Matchoji';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return renderCafeImage(slug);
}
