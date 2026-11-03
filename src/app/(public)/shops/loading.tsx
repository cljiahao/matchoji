import { Skeleton } from '@/components/ui/skeleton';

export default function ShopsLoading() {
  return (
    <div
      className="max-w-site mx-auto w-full px-6 py-10 sm:py-14"
      role="status"
      aria-busy="true"
      aria-label="Loading"
    >
      <Skeleton className="h-9 w-64 sm:h-10" />
      <Skeleton className="mt-3 h-5 w-full max-w-md" />
      <Skeleton className="mt-8 h-80 rounded-2xl" />
    </div>
  );
}
