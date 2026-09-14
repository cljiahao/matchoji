import { cn } from '@/lib/utils';

interface BrandTextProps {
  className?: string;
}

export function BrandText({ className }: BrandTextProps) {
  return (
    <>
      <span className="text-brand-gradient">Match</span>
      <span className={cn('text-foreground', className)}>oji</span>
    </>
  );
}
