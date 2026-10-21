import { Skeleton } from '@/components/ui/skeleton';

export default function ExploreLoading() {
  return (
    <div
      className="max-w-site mx-auto w-full px-6 py-10 sm:py-14"
      aria-busy="true"
      aria-label="Loading"
    >
      <Skeleton className="h-9 w-56 sm:h-10" />
      <div className="mt-8 grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-14">
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-5 w-32" />
          ))}
        </div>
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-full sm:w-80" />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl sm:h-44" />
          ))}
        </div>
      </div>
    </div>
  );
}
