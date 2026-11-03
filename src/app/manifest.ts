import type { MetadataRoute } from 'next';

import { OG } from '@/features/share';

// Installable, nothing more: no service worker, so there is no offline mode.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Matchoji',
    short_name: 'Matchoji',
    description: 'Rate and discover hojicha and matcha, one cup at a time.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: OG.pageWhite,
    theme_color: OG.matchaGreen,
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
