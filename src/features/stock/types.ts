import type { StockStatus } from '@/integrations/supabase/database.types';

export type { StockStatus };

export interface StockReport {
  status: StockStatus;
  reportedAt: string;
}
