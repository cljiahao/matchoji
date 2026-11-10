import { Button } from '@/components/ui/button';

import type { CitySlug } from '../types';

const SELECT =
  'border-input bg-background text-foreground h-11 w-full rounded-lg border px-3 text-sm';

interface CafeFiltersProps {
  city: CitySlug;
  areas: string[];
  area: string | undefined;
  tasterOnly: boolean;
}

// A GET form: the filters live in the URL, so a filtered list can be shared and needs no script.
export function CafeFilters({ city, areas, area, tasterOnly }: CafeFiltersProps) {
  return (
    <form
      action="/cafes"
      method="get"
      aria-label="Filter cafés"
      className="grid gap-3 sm:grid-cols-3"
    >
      <input type="hidden" name="city" value={city} />
      <div className="space-y-1.5">
        <label htmlFor="cafe-area" className="text-sm font-semibold">
          Area
        </label>
        <select id="cafe-area" name="area" defaultValue={area ?? ''} className={SELECT}>
          <option value="">All areas</option>
          {areas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
      <label className="flex h-11 items-center gap-2 self-end text-sm font-semibold">
        <input
          type="checkbox"
          name="taster"
          value="1"
          defaultChecked={tasterOnly}
          className="size-5"
        />
        Taster-reviewed only
      </label>
      <Button type="submit" className="h-11 self-end">
        Apply
      </Button>
    </form>
  );
}
