import Link from 'next/link';

// Offered only for years with enough tastings to recap, so every link leads somewhere.
export function YearLinks({ years }: { years: number[] }) {
  if (years.length === 0) return null;
  return (
    <nav aria-label="Year in tea" className="flex flex-wrap items-center gap-x-4 gap-y-1">
      <span className="text-muted-foreground text-sm">Year in tea</span>
      {years.map((year) => (
        <Link
          key={year}
          href={`/journal/year/${year}`}
          className="text-brand inline-flex min-h-11 items-center font-semibold hover:underline"
        >
          {year}
        </Link>
      ))}
    </nav>
  );
}
