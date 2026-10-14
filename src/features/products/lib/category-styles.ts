import type { ProductCategory } from '../types';

// Category colour is data (see .impeccable/surfaces/phase1.md): every place a product or
// rating appears pulls its jade/amber from here so the two never drift apart.
export const CATEGORY_STYLES: Record<
  ProductCategory,
  { label: string; badge: string; border: string; star: string; activeTab: string }
> = {
  matcha: {
    label: 'Matcha',
    badge: 'bg-matcha text-matcha-foreground',
    border: 'border-l-matcha',
    star: 'fill-matcha text-matcha',
    activeTab: 'bg-matcha text-matcha-foreground',
  },
  hojicha: {
    label: 'Hojicha',
    badge: 'bg-hojicha text-hojicha-foreground',
    border: 'border-l-hojicha',
    star: 'fill-hojicha text-hojicha',
    activeTab: 'bg-hojicha text-hojicha-foreground',
  },
};
