import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/constants/env';

// Personal and admin pages stay out of search engines; everything public is crawlable.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/account', '/journal', '/sell', '/auth'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
