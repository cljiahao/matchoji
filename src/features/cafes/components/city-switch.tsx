'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

import { CITIES, CITY_COOKIE } from '../lib/city';
import type { CitySlug } from '../types';

const ONE_YEAR = 60 * 60 * 24 * 365;

// Plain links keep the switch working without JavaScript (?city= wins on the server); the click
// also remembers the choice in a cookie so the next visit opens on the same city.
export function CitySwitch({ current }: { current: CitySlug }) {
  const pathname = usePathname();
  return (
    <nav aria-label="City" className="bg-muted inline-flex rounded-full p-1">
      {CITIES.map((city) => (
        <Link
          key={city.slug}
          href={`${pathname}?city=${city.slug}`}
          aria-current={city.slug === current ? 'page' : undefined}
          onClick={() => {
            document.cookie = `${CITY_COOKIE}=${city.slug}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
          }}
          className={cn(
            'inline-flex h-11 items-center rounded-full px-4 text-sm font-semibold transition-colors',
            city.slug === current
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {city.name}
        </Link>
      ))}
    </nav>
  );
}
