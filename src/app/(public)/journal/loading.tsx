import { Skeleton } from '@/components/ui/skeleton';

export default function JournalLoading() {
  return (
    <div
      className="max-w-site mx-auto w-full px-6 py-10 sm:py-14"
      aria-busy="true"
      aria-label="Loading"
    >
      <Skeleton className="h-10 w-56" />
      <Skeleton className="mt-2 h-5 w-96 max-w-full" />
      <Skeleton className="mt-8 h-28 w-full rounded-3xl" />
      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-28" />
          {Array.from({ length: 2 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
