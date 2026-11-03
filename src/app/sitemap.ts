import type { MetadataRoute } from 'next';
import { connection } from 'next/server';

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
import { SITE_URL } from '@/lib/constants/env';
import { PAGE_ROUTES } from '@/lib/constants/routes';

// Catalogue teas plus the public browse, top-list and Learn pages. Read per request so builds need no database.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const supabase = await createClient();
  const catalogue = await listCatalogue(supabase);

  const pages = [
    PAGE_ROUTES.HOME,
    PAGE_ROUTES.EXPLORE,
    PAGE_ROUTES.TOP,
    PAGE_ROUTES.REGIONS,
    PAGE_ROUTES.SUPPLY,
    PAGE_ROUTES.LEARN,
    // Only lists with enough rated teas exist; the rest return not-found and stay out.
    ...buildTopLists(catalogue).map((list) => `${PAGE_ROUTES.TOP}/${list.slug}`),
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
  return [...pages, ...teas];
}
