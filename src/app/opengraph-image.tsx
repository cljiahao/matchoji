import { OG_CONTENT_TYPE, OG_SIZE, renderSiteImage } from '@/features/share';

export const alt = 'Matchoji: the trusted guide to hojicha and matcha drinks in Singapore and JB';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderSiteImage();
}
