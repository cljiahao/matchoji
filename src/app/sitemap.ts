import type { MetadataRoute } from 'next';
import { connection } from 'next/server';

import { listCafeSitemapEntries, listTopDrinkLists, topTeasHref } from '@/features/cafes';
import { buildTopLists } from '@/features/discovery';
import {
  COURSES,
  GUIDES,
  RECIPES,
  courseHref,
  guideHref,
  lessonHref,
  recipeHref,
} from '@/features/learn';
import { listCatalogue } from '@/features/products';
import { createClient } from '@/integrations/supabase/server';
import { MARKETPLACE_ENABLED, SITE_URL } from '@/lib/constants/env';
import { PAGE_ROUTES } from '@/lib/constants/routes';

// Catalogue teas plus the public browse, top-list and Learn pages. Read per request so builds need no database.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const supabase = await createClient();
  const [catalogue, cafeEntries, drinkLists] = await Promise.all([
    listCatalogue(supabase),
    listCafeSitemapEntries(supabase),
    listTopDrinkLists(supabase),
  ]);

  const pages = [
    PAGE_ROUTES.HOME,
    PAGE_ROUTES.EXPLORE,
    PAGE_ROUTES.TOP,
    topTeasHref(),
    PAGE_ROUTES.REGIONS,
    PAGE_ROUTES.SUPPLY,
    PAGE_ROUTES.SHOPS,
    PAGE_ROUTES.CAFES,
    PAGE_ROUTES.TASTERS,
    PAGE_ROUTES.HOW_WE_RATE,
    PAGE_ROUTES.LEARN,
    ...(MARKETPLACE_ENABLED ? [PAGE_ROUTES.SELL] : []),
    // Only drink lists with a qualifying drink exist; the rest return not-found and stay out.
    ...drinkLists.map((list) => `${PAGE_ROUTES.TOP}/${list.slug}`),
    // Likewise only tea lists with enough rated teas.
    ...buildTopLists(catalogue).map((list) => topTeasHref(list.slug)),
    ...RECIPES.map((recipe) => recipeHref(recipe.slug)),
    ...GUIDES.map((guide) => guideHref(guide.slug)),
    ...COURSES.flatMap((course) => [
      courseHref(course.slug),
      ...course.lessons.map((lesson) => lessonHref(course.slug, lesson.slug)),
    ]),
  ].map((path) => ({ url: `${SITE_URL}${path}` }));
  const teas = catalogue.map((tea) => ({
    url: `${SITE_URL}/products/${tea.id}`,
    lastModified: tea.createdAt,
  }));
  const cafes = cafeEntries.map((entry) => ({
    url: `${SITE_URL}${entry.path}`,
    lastModified: entry.lastModified,
  }));
  return [...pages, ...teas, ...cafes];
}
