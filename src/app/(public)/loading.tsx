import { Skeleton } from '@/components/ui/skeleton';

export default function DiscoverLoading() {
  return (
    <div
      className="max-w-site mx-auto w-full px-6 py-10 sm:py-14"
      aria-busy="true"
      aria-label="Loading"
    >
      <Skeleton className="h-9 w-40 sm:h-10" />
      <Skeleton className="mt-2 h-5 w-80 max-w-full" />
      <Skeleton className="bg-card mt-8 h-11 w-full border" />
      <Skeleton className="mt-3 h-10 w-52" />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="bg-card overflow-hidden rounded-lg border">
            <Skeleton className="aspect-square w-full rounded-none sm:aspect-[4/3]" />
            <div className="space-y-2 p-3 sm:p-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
