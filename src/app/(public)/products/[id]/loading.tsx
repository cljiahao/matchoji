import { Skeleton } from '@/components/ui/skeleton';

export default function ProductLoading() {
  return (
    <div className="max-w-site mx-auto w-full px-6 py-12" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-9 w-64 max-w-full" />
      <Skeleton className="mt-2 h-5 w-40" />
      <Skeleton className="mt-3 h-4 w-48" />
      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4 lg:order-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="space-y-4 lg:order-1">
          <Skeleton className="h-6 w-24" />
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="space-y-2 border-b py-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full max-w-prose" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
