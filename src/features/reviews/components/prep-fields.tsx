'use client';

import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { CustomFormField } from '@/components/widgets';
import type { ProductCategory } from '@/features/products';
import { cn } from '@/lib/utils';

import { localToday } from '../lib/local-date';
import { PREP_METHODS, PREP_METHOD_LABELS } from '../lib/tasting-vocab';

const PREP_FIELDS = ['prepMethod', 'doseG', 'waterMl', 'waterTempC', 'tastedOn'] as const;

interface PrepFieldsProps {
  category: ProductCategory;
}

// Coffee-tracker style brew log. Collapsed by default so a quick rating stays quick.
export function PrepFields({ category }: PrepFieldsProps) {
  const { control, formState } = useFormContext();
  const [userOpen, setUserOpen] = useState(false);
  // An invalid field inside a closed <details> can't be seen or focused, so errors force it open.
  const hasError = PREP_FIELDS.some((f) => formState.errors[f]);

  return (
    <details
      open={userOpen || hasError}
      onToggle={(e) => setUserOpen(e.currentTarget.open)}
      className="group border-border rounded-lg border"
    >
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium select-none">
        How you made it
      </summary>
      <div className="space-y-4 border-t px-4 py-4">
        <Controller
          name="prepMethod"
          control={control}
          render={({ field }) => (
            <div role="radiogroup" aria-label="Method" className="flex flex-wrap gap-2">
              {PREP_METHODS.map((method) => {
                const checked = field.value === method;
                return (
                  <button
                    key={method}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    onClick={() => field.onChange(checked ? undefined : method)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-sm transition-colors',
                      checked
                        ? 'bg-primary text-primary-foreground border-transparent'
                        : 'border-border hover:border-neutral-400'
                    )}
                  >
                    {PREP_METHOD_LABELS[method]}
                  </button>
                );
              })}
            </div>
          )}
        />
        <div className="grid grid-cols-3 gap-3">
          <CustomFormField name="doseG" label={category === 'matcha' ? 'Matcha (g)' : 'Tea (g)'}>
            <Input type="number" inputMode="decimal" step="0.1" min={0} max={50} />
          </CustomFormField>
          <CustomFormField name="waterMl" label="Water (ml)">
            <Input type="number" inputMode="numeric" min={0} max={1000} />
          </CustomFormField>
          <CustomFormField name="waterTempC" label="Water temp (°C)">
            <Input type="number" inputMode="numeric" min={0} max={100} />
          </CustomFormField>
        </div>
        <CustomFormField name="tastedOn" label="Tasted on">
          <Input type="date" max={localToday()} className="w-44" />
        </CustomFormField>
      </div>
    </details>
  );
}
