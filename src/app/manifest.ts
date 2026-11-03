import type { MetadataRoute } from 'next';

import { OG } from '@/features/share';

// Installable; public/sw.js adds only an offline fallback page, not offline browsing.
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
