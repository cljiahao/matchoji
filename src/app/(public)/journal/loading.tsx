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
      <Skeleton className="bg-card mt-8 h-28 w-full rounded-lg border" />
      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="bg-card h-64 w-full rounded-lg border" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="bg-card h-32 w-full rounded-lg border" />
        </div>
      </div>
    </div>
  );
}
