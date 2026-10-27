'use client';

import { forwardRef } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TeaOption {
  id: string;
  name: string;
  brand: string | null;
}

interface TeaSelectProps {
  id?: string;
  teas: TeaOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  'aria-label'?: string;
  className?: string;
}

const teaLabel = (tea: TeaOption) => (tea.brand ? `${tea.name} · ${tea.brand}` : tea.name);

// The catalogue picker the admin forms share. An empty value shows the placeholder, which is
// how a form clears its pick after saving.
export const TeaSelect = forwardRef<HTMLButtonElement, TeaSelectProps>(function TeaSelect(
  { id, teas, value, onChange, placeholder, className, ...aria },
  ref
) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger ref={ref} id={id} className={className ?? 'h-10 w-full'} {...aria}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-w-[calc(100vw-3rem)]">
        {teas.map((tea) => (
          <SelectItem key={tea.id} value={tea.id}>
            {teaLabel(tea)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});
