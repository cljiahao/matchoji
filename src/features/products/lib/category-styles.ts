import type { ProductCategory } from '../types';

// Category colour is data (see .impeccable/surfaces/phase1.md): every place a product or
// rating appears pulls its jade/amber from here so the two never drift apart.
export const CATEGORY_STYLES: Record<
  ProductCategory,
  { label: string; badge: string; tint: string; text: string; star: string; activeTab: string }
> = {
  matcha: {
    label: 'Matcha',
    badge: 'bg-matcha text-matcha-foreground',
    tint: 'bg-matcha/15',
    text: 'text-matcha',
    star: 'fill-matcha text-matcha',
    activeTab: 'bg-matcha text-matcha-foreground',
  },
  hojicha: {
    label: 'Hojicha',
    badge: 'bg-hojicha text-hojicha-foreground',
    tint: 'bg-hojicha/15',
    text: 'text-hojicha',
    star: 'fill-hojicha text-hojicha',
    activeTab: 'bg-hojicha text-hojicha-foreground',
  },
};
