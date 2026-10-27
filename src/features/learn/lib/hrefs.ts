import { PAGE_ROUTES } from '@/lib/constants/routes';

export const recipeHref = (slug: string) => `${PAGE_ROUTES.LEARN}/recipes/${slug}`;
export const guideHref = (slug: string) => `${PAGE_ROUTES.LEARN}/guides/${slug}`;
export const courseHref = (slug: string) => `${PAGE_ROUTES.LEARN}/courses/${slug}`;
export const lessonHref = (course: string, lesson: string) => `${courseHref(course)}/${lesson}`;
