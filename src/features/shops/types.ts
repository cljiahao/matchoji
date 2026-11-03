import type { ShopKind } from '@/integrations/supabase/database.types';

export type { ShopKind };

export interface Shop {
  id: string;
  brand: string;
  name: string;
  kind: ShopKind;
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  sourceUrl: string;
  checkedAt: string;
}
