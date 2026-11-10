'use client';

import { forwardRef } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface OptionSelectProps {
  options: readonly { value: string; label: string }[];
  placeholder?: string;
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  'aria-invalid'?: boolean;
}

// Radix Select speaks onValueChange; this adapter takes the props CustomFormField injects so
// selects get the same label, id and inline errors as inputs. The schema, not the select,
// decides which values are valid.
export const OptionSelect = forwardRef<HTMLButtonElement, OptionSelectProps>(function OptionSelect(
  { options, placeholder, id, value, onChange, onBlur, ...aria },
  ref
) {
  return (
    <Select value={value ?? ''} onValueChange={(next) => onChange?.(next)}>
      <SelectTrigger ref={ref} id={id} onBlur={onBlur} className="h-10 w-full" {...aria}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});
