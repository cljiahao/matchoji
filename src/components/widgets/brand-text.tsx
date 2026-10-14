import { cn } from '@/lib/utils';

interface BrandTextProps {
  className?: string;
}

export function BrandText({ className }: BrandTextProps) {
  return <span className={cn('text-foreground', className)}>Matchoji</span>;
}
