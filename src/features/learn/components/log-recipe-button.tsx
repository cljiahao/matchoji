'use client';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { LogTastingDialog } from '@/features/reviews';

import type { Recipe } from '../types';

// Opens the usual tasting dialog with this recipe's brew settings already filled in.
export function LogRecipeButton({ recipe }: { recipe: Recipe }) {
  return (
    <LogTastingDialog
      prep={{
        method: recipe.prepMethod,
        doseG: recipe.doseG,
        waterMl: recipe.waterMl,
        waterTempC: recipe.waterTempC,
      }}
      trigger={
        <Button>
          <Plus aria-hidden="true" />
          Log a tasting with this recipe
        </Button>
      }
    />
  );
}
