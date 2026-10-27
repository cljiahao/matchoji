'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { CustomFormField, UnitInput } from '@/components/widgets';
import type { ProductCategory } from '@/features/products';
import { cn } from '@/lib/utils';

import { handleRadioKeyDown, radioTabIndex } from '../lib/roving-radio';
import { PREP_METHODS, PREP_METHOD_LABELS } from '../lib/tasting-vocab';

const PREP_FIELDS = ['prepMethod', 'doseG', 'waterMl', 'waterTempC'] as const;

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
      className="group border-border rounded-2xl border"
    >
      <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-medium select-none">
        <span className="flex flex-col">
          How you made it
          <span className="text-muted-foreground text-xs font-normal">
            Optional. Helps you repeat a good cup.
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="text-muted-foreground h-4 w-4 group-open:rotate-180 motion-safe:transition-transform"
        />
      </summary>
      <div className="space-y-4 border-t px-4 py-4">
        <Controller
          name="prepMethod"
          control={control}
          render={({ field }) => {
            const select = (i: number) => field.onChange(PREP_METHODS[i]);
            return (
              <div role="radiogroup" aria-label="Method" className="flex flex-wrap gap-2">
                {PREP_METHODS.map((method, index) => {
                  const checked = field.value === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      tabIndex={radioTabIndex(index, PREP_METHODS.indexOf(field.value))}
                      onKeyDown={(e) => handleRadioKeyDown(e, index, PREP_METHODS.length, select)}
                      onClick={() => field.onChange(checked ? undefined : method)}
                      className={cn(
                        'min-h-10 rounded-full border px-4 py-1 text-sm transition-colors',
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
            );
          }}
        />
        <div className="grid grid-cols-3 items-start gap-3">
          <CustomFormField name="doseG" label={category === 'matcha' ? 'Matcha (g)' : 'Tea (g)'}>
            <UnitInput unit="g" type="number" inputMode="decimal" step="0.1" min={0} max={50} />
          </CustomFormField>
          <CustomFormField name="waterMl" label="Water (ml)">
            <UnitInput unit="ml" type="number" inputMode="numeric" min={0} max={1000} />
          </CustomFormField>
          <CustomFormField name="waterTempC" label="Water temp (°C)">
            <UnitInput unit="°C" type="number" inputMode="numeric" min={0} max={100} />
          </CustomFormField>
        </div>
      </div>
    </details>
  );
}
