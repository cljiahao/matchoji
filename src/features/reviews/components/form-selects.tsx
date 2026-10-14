'use client';

import { forwardRef } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CATEGORY_STYLES, type ProductCategory } from '@/features/products';

// Radix Select speaks onValueChange, not onChange; these adapters take the props
// CustomFormField injects so selects get the same label, id and inline errors as inputs.
interface FieldSelectProps<T extends string> {
  id?: string;
  value?: T;
  onChange?: (value: T) => void;
  onBlur?: () => void;
  'aria-invalid'?: boolean;
}

export const CategorySelect = forwardRef<HTMLButtonElement, FieldSelectProps<ProductCategory>>(
  function CategorySelect({ id, value, onChange, onBlur, ...aria }, ref) {
    return (
      <Select value={value} onValueChange={(v) => onChange?.(v as ProductCategory)}>
        <SelectTrigger ref={ref} id={id} onBlur={onBlur} className="w-full" {...aria}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(CATEGORY_STYLES) as ProductCategory[]).map((category) => (
            <SelectItem key={category} value={category}>
              {CATEGORY_STYLES[category].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
);

interface RegionSelectProps extends FieldSelectProps<string> {
  regions: { id: string; name: string }[];
}

export const RegionSelect = forwardRef<HTMLButtonElement, RegionSelectProps>(function RegionSelect(
  { id, value, onChange, onBlur, regions, ...aria },
  ref
) {
  return (
    <Select value={value ?? ''} onValueChange={(v) => onChange?.(v)}>
      <SelectTrigger ref={ref} id={id} onBlur={onBlur} className="w-full" {...aria}>
        <SelectValue placeholder="No region" />
      </SelectTrigger>
      <SelectContent>
        {regions.map((region) => (
          <SelectItem key={region.id} value={region.id}>
            {region.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});
