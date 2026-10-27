import { cn } from 'cn';
import { forwardRef, type ComponentProps } from 'react';

import { Input } from '@/components/ui/input';

interface UnitInputProps extends ComponentProps<'input'> {
  // Shown inside the field, so the label and placeholder do not have to carry the unit.
  unit: string;
  // A currency sits before the number, a measure after it.
  unitPosition?: 'start' | 'end';
  // Width of the whole field; the input fills it.
  className?: string;
}

// An input with its unit as a quiet adornment. The adornment is decorative: the label names
// the unit for assistive tech, so it is hidden from them rather than read twice.
export const UnitInput = forwardRef<HTMLInputElement, UnitInputProps>(function UnitInput(
  { unit, unitPosition = 'end', className, ...props },
  ref
) {
  const atStart = unitPosition === 'start';
  return (
    <div className={cn('relative w-full', className)}>
      <Input
        ref={ref}
        className={cn(
          // The unit sits where a number input's spin buttons would, so they are dropped.
          'h-10 [appearance:textfield] tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          atStart ? 'pl-9' : 'pr-9'
        )}
        {...props}
      />
      <span
        aria-hidden="true"
        className={cn(
          'text-muted-foreground pointer-events-none absolute inset-y-0 flex items-center text-sm',
          atStart ? 'left-3' : 'right-3'
        )}
      >
        {unit}
      </span>
    </div>
  );
});
