import { Skeleton } from '@/components/ui/skeleton';

export default function HomeLoading() {
  return (
    <div
      className="max-w-site mx-auto w-full px-6 pt-12 sm:pt-20"
      aria-busy="true"
      aria-label="Loading"
    >
      <Skeleton className="mx-auto h-12 w-full max-w-xl sm:h-16" />
      <Skeleton className="mx-auto mt-4 h-6 w-80 max-w-full" />
      <Skeleton className="mx-auto mt-8 h-14 w-full max-w-xl rounded-full" />
      <div className="mt-12 flex justify-center gap-6 sm:gap-12">
        <Skeleton className="h-28 w-28 rounded-full sm:h-36 sm:w-36" />
        <Skeleton className="h-28 w-28 rounded-full sm:h-36 sm:w-36" />
      </div>
      <Skeleton className="mt-16 h-8 w-56" />
      <div className="mt-5 flex gap-4 overflow-hidden sm:gap-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="w-40 shrink-0 space-y-2 sm:w-52">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-5 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
