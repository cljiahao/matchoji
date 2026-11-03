'use client';

import { useMemo, useState } from 'react';

import { TeaMap } from '@/components/widgets/tea-map';

import { directionsUrl, distinct, filterShops, shopPins } from '../lib';
import { SHOP_KINDS, SHOP_KIND_LABELS } from '../schemas';
import type { Shop, ShopKind } from '../types';

const SELECT =
  'border-input bg-background text-foreground h-11 w-full rounded-lg border px-3 text-sm';

function Filter({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <select id={id} className={SELECT} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ShopsExplorer({
  shops,
  initialBrand = '',
}: {
  shops: Shop[];
  initialBrand?: string;
}) {
  const brands = useMemo(() => distinct(shops, 'brand'), [shops]);
  const countries = useMemo(() => distinct(shops, 'country'), [shops]);
  // A brand in the link only applies when a shop has it, matched without regard to case.
  const [brand, setBrand] = useState(
    () => brands.find((b) => b.toLowerCase() === initialBrand.toLowerCase()) ?? ''
  );
  const [kind, setKind] = useState('');
  const [country, setCountry] = useState('');

  const shown = useMemo(
    () =>
      filterShops(shops, {
        brand: brand || undefined,
        kind: (kind || undefined) as ShopKind | undefined,
        country: country || undefined,
      }),
    [shops, brand, kind, country]
  );
  const pins = useMemo(() => shopPins(shown), [shown]);

  return (
    <div className="space-y-6">
      <form
        aria-label="Filter shops"
        className="grid gap-3 sm:grid-cols-3"
        onSubmit={(e) => e.preventDefault()}
      >
        <Filter
          id="shop-brand"
          label="Maker"
          value={brand}
          onChange={setBrand}
          options={brands.map((b) => ({ value: b, label: b }))}
        />
        <Filter
          id="shop-kind"
          label="Kind"
          value={kind}
          onChange={setKind}
          options={SHOP_KINDS.map((k) => ({ value: k, label: SHOP_KIND_LABELS[k] }))}
        />
        <Filter
          id="shop-country"
          label="Country"
          value={country}
          onChange={setCountry}
          options={countries.map((c) => ({ value: c, label: c }))}
        />
      </form>

      <p aria-live="polite" className="text-muted-foreground text-sm">
        {shown.length} {shown.length === 1 ? 'shop' : 'shops'}
      </p>

      <TeaMap label="Map of shops" pins={pins} />

      {shown.length > 0 ? (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {shown.map((shop) => (
            <li key={shop.id} className="bg-muted flex flex-col rounded-2xl px-5 py-4">
              <span className="text-muted-foreground text-sm">
                {shop.brand} · {SHOP_KIND_LABELS[shop.kind]}
              </span>
              <span className="text-lg font-bold tracking-tight">{shop.name}</span>
              <span className="mt-1 text-sm">{shop.address}</span>
              <span className="text-muted-foreground text-sm">
                {shop.city}, {shop.country}
              </span>
              <span className="mt-2 flex flex-wrap gap-x-5">
                <a
                  href={directionsUrl(shop)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-2"
                >
                  Directions
                </a>
                <a
                  href={shop.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground inline-flex min-h-11 items-center text-sm underline underline-offset-2"
                >
                  Source
                </a>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="bg-muted text-muted-foreground rounded-3xl py-12 text-center">
          No shops match those filters.
        </p>
      )}
    </div>
  );
}
