import type { MapPin } from '@/components/widgets';

import { SHOP_KIND_LABELS } from '../schemas';
import type { Shop, ShopKind } from '../types';

export interface ShopFilters {
  brand?: string;
  kind?: ShopKind;
  country?: string;
}

export function filterShops(shops: Shop[], filters: ShopFilters): Shop[] {
  return shops.filter(
    (s) =>
      (!filters.brand || s.brand.toLowerCase() === filters.brand.toLowerCase()) &&
      (!filters.kind || s.kind === filters.kind) &&
      (!filters.country || s.country === filters.country)
  );
}

export function distinct(shops: Shop[], key: 'brand' | 'country'): string[] {
  return [...new Set(shops.map((s) => s[key]))].sort((a, b) => a.localeCompare(b));
}

// A plain OpenStreetMap search link built from the address: no API, no key.
export function directionsUrl(shop: Pick<Shop, 'name' | 'address'>): string {
  const query = new URLSearchParams({ query: `${shop.name}, ${shop.address}` });
  return `https://www.openstreetmap.org/search?${query.toString()}`;
}

export function shopsHref(brand: string): string {
  return `/shops?${new URLSearchParams({ brand }).toString()}`;
}

export function shopPins(shops: Shop[]): MapPin[] {
  return shops.map((shop) => ({
    id: shop.id,
    lat: shop.lat,
    lng: shop.lng,
    name: shop.name,
    tone: 'neutral' as const,
    text: shop.brand.slice(0, 1).toUpperCase(),
    description: `${SHOP_KIND_LABELS[shop.kind]}, ${shop.address}`,
    link: { label: 'Directions', href: directionsUrl(shop) },
  }));
}
