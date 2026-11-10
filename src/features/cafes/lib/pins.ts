import type { MapPin } from '@/components/widgets/tea-map';

import type { CafeListing } from '../types';
import { cafeHref } from './hrefs';

// A café without coordinates stays in the list but has no pin; the pin's text is its drink count.
export function cafePins(cafes: CafeListing[]): MapPin[] {
  return cafes.flatMap((cafe) =>
    cafe.lat === null || cafe.lng === null
      ? []
      : [
          {
            id: cafe.id,
            lat: cafe.lat,
            lng: cafe.lng,
            name: cafe.name,
            text: String(cafe.drinkCount),
            tone: 'neutral' as const,
            description: cafe.area ?? undefined,
            href: cafeHref(cafe.slug),
          },
        ]
  );
}
