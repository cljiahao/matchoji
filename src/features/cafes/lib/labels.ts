import type { DrinkBase, DrinkServing, DrinkStyle } from '@/integrations/supabase/database.types';

export const BASE_LABELS: Record<DrinkBase, string> = { hojicha: 'Hojicha', matcha: 'Matcha' };

export const STYLE_LABELS: Record<DrinkStyle, string> = {
  latte: 'Latte',
  straight: 'Straight',
  iced_latte: 'Iced latte',
  float: 'Float',
  other: 'Other',
};

export const SERVING_LABELS: Record<DrinkServing, string> = {
  hot: 'Hot',
  iced: 'Iced',
  both: 'Hot or iced',
};
