import { OG_CONTENT_TYPE, OG_SIZE, renderTeaImage } from '@/features/share';

export const alt = 'A tea and its rating on Matchoji';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return renderTeaImage(id);
}
