import type { MetadataRoute } from 'next';
import { connection } from 'next/server';

import {
  COURSES,
  GUIDES,
  RECIPES,
  courseHref,
  guideHref,
  lessonHref,
  recipeHref,
} from '@/features/learn';
import { createClient } from '@/integrations/supabase/server';
import { SITE_URL } from '@/lib/constants/env';
import { PAGE_ROUTES } from '@/lib/constants/routes';

// Catalogue teas plus the public browse and Learn pages. Read per request so builds need no database.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase.from('catalogue_teas').select('id, created_at');
  if (error) throw error;

  const pages = [
    PAGE_ROUTES.HOME,
    PAGE_ROUTES.EXPLORE,
    PAGE_ROUTES.REGIONS,
    PAGE_ROUTES.SUPPLY,
    PAGE_ROUTES.LEARN,
    ...RECIPES.map((recipe) => recipeHref(recipe.slug)),
    ...GUIDES.map((guide) => guideHref(guide.slug)),
    ...COURSES.flatMap((course) => [
      courseHref(course.slug),
      ...course.lessons.map((lesson) => lessonHref(course.slug, lesson.slug)),
    ]),
  ].map((path) => ({ url: `${SITE_URL}${path}` }));
  const teas = data.map((tea) => ({
    url: `${SITE_URL}/products/${tea.id}`,
    lastModified: tea.created_at,
  }));
  return [...pages, ...teas];
}
