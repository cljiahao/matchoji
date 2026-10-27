import { PAGE_ROUTES } from '@/lib/constants/routes';

export const recipeHref = (slug: string) => `${PAGE_ROUTES.LEARN}/recipes/${slug}`;
export const guideHref = (slug: string) => `${PAGE_ROUTES.LEARN}/guides/${slug}`;
