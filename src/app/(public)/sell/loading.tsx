import { Skeleton } from '@/components/ui/skeleton';

export default function SellLoading() {
  return (
    <div
      className="max-w-site mx-auto w-full px-6 py-10 sm:py-14"
      aria-busy="true"
      aria-label="Loading"
    >
      <Skeleton className="h-10 w-64 sm:h-12" />
      <Skeleton className="mt-3 h-5 w-full max-w-xl" />
      <div className="mt-8 max-w-xl space-y-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-9 rounded-md" />
        ))}
      </div>
    </div>
  );
}
