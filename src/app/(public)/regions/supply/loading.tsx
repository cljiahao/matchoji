import { Skeleton } from '@/components/ui/skeleton';

export default function SupplyLoading() {
  return (
    <div
      className="max-w-site mx-auto w-full px-6 py-10 sm:py-14"
      role="status"
      aria-busy="true"
      aria-label="Loading"
    >
      <Skeleton className="h-9 w-64 sm:h-10" />
      <Skeleton className="mt-3 h-5 w-full max-w-2xl" />
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
