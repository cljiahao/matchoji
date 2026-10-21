import { Skeleton } from '@/components/ui/skeleton';

export default function ProductLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="bg-muted/60">
        <div className="max-w-site mx-auto grid w-full gap-8 px-6 py-10 sm:grid-cols-[minmax(0,18rem)_1fr] sm:gap-12 sm:py-14 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <Skeleton className="aspect-square w-full max-w-72 rounded-2xl bg-white/70 sm:max-w-none" />
          <div className="flex flex-col justify-center gap-3">
            <Skeleton className="h-6 w-32 bg-white/70" />
            <Skeleton className="h-12 w-80 max-w-full bg-white/70" />
            <Skeleton className="h-6 w-48 rounded-full bg-white/70" />
            <Skeleton className="mt-3 h-16 w-40 bg-white/70" />
          </div>
        </div>
      </div>
      <div className="max-w-site mx-auto w-full space-y-4 px-6 py-12 sm:py-16">
        <Skeleton className="h-8 w-72" />
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-2 w-full max-w-xl rounded-full" />
        ))}
      </div>
    </div>
  );
}
