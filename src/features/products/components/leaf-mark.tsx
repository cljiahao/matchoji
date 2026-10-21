import { cn } from '@/lib/utils';

// A single tea leaf with its midrib, drawn to sit in an empty image well.
export function LeafMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('h-12 w-12', className)}
    >
      <path d="M10 38C10 20 22 9 39 9c0 17-11 29-29 29Z" />
      <path d="M10 38 30 18" />
      <path d="M20 28h6M24 24v-6" />
    </svg>
  );
}
