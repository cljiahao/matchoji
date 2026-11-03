import { OG_CONTENT_TYPE, OG_SIZE, renderProfileImage } from '@/features/share';

export const alt = 'A taster on Matchoji';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return renderProfileImage(id);
}
