import { Skeleton } from '@/components/ui/skeleton';

// The tasters page never 404s or redirects, so a skeleton above it cannot swallow a status code.
export default function TastersLoading() {
  return (
    <div
      className="max-w-site mx-auto w-full px-6 py-10 sm:py-14"
      role="status"
      aria-busy="true"
      aria-label="Loading"
    >
      <Skeleton className="h-10 w-64" />
      <Skeleton className="mt-3 h-5 w-full max-w-xl" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
