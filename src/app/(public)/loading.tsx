import { Skeleton } from '@/components/ui/skeleton';

export default function DiscoverLoading() {
  return (
    <div className="max-w-site mx-auto w-full px-6 py-12" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-9 w-40" />
      <Skeleton className="mt-2 h-5 w-80 max-w-full" />
      <Skeleton className="mt-6 h-10 w-52" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="bg-card space-y-3 rounded-lg border p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
