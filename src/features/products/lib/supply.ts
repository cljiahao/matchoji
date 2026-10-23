import type { SupplyLevel } from '@/integrations/supabase/database.types';

export type { SupplyLevel };

// Scarcest first: the order the scarcity sorts rank by.
export const SUPPLY_LEVELS = ['scarce', 'tight', 'plentiful'] as const satisfies SupplyLevel[];

export const SUPPLY_LABELS: Record<SupplyLevel, string> = {
  scarce: 'Scarce',
  tight: 'Tight',
  plentiful: 'Plentiful',
};

// Teas and regions with no sourced level sort after every known one.
export function supplyRank(level: SupplyLevel | null): number {
  return level === null ? SUPPLY_LEVELS.length : SUPPLY_LEVELS.indexOf(level);
}
