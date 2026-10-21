import { Skeleton } from '@/components/ui/skeleton';

export default function ProductLoading() {
  return (
    <div
      className="max-w-site mx-auto w-full px-6 py-10 sm:py-14"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="grid gap-6 sm:grid-cols-[14rem_1fr] sm:gap-10">
        <Skeleton className="aspect-square w-full max-w-56 rounded-lg" />
        <div className="flex flex-col justify-center gap-3">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-10 w-72 max-w-full" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-12 w-36" />
        </div>
      </div>
      <Skeleton className="bg-card mt-10 h-48 w-full rounded-lg border" />
      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Skeleton className="bg-card h-80 w-full rounded-lg border lg:order-2" />
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
