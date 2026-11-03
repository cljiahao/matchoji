'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  SHOP_KINDS,
  SHOP_KIND_LABELS,
  createShop,
  deleteShop,
  shopSchema,
  updateShop,
  type Shop,
  type ShopKind,
} from '@/features/shops';
import { createClient } from '@/integrations/supabase/client';

type FormValues = Record<
  'brand' | 'name' | 'address' | 'city' | 'country' | 'lat' | 'lng' | 'sourceUrl',
  string
> & { kind: ShopKind };

const EMPTY: FormValues = {
  brand: '',
  name: '',
  kind: 'maker_store',
  address: '',
  city: '',
  country: '',
  lat: '',
  lng: '',
  sourceUrl: '',
};

const FIELDS: {
  key: Exclude<keyof FormValues, 'kind'>;
  label: string;
  type?: string;
  hint?: string;
}[] = [
  { key: 'brand', label: 'Maker' },
  { key: 'name', label: 'Shop name' },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'country', label: 'Country' },
  { key: 'lat', label: 'Latitude', hint: '-90 to 90' },
  { key: 'lng', label: 'Longitude', hint: '-180 to 180' },
  {
    key: 'sourceUrl',
    label: 'Source link',
    type: 'url',
    hint: 'The shop’s own page showing this address (https)',
  },
];

const toInput = (shop: Shop): FormValues => ({
  brand: shop.brand,
  name: shop.name,
  kind: shop.kind,
  address: shop.address,
  city: shop.city,
  country: shop.country,
  lat: String(shop.lat),
  lng: String(shop.lng),
  sourceUrl: shop.sourceUrl,
});

// Adds, edits and removes shop locations. Only addresses read from the shop's own site belong
// here, with that page as the source.
export function ShopsForm({ shops }: { shops: Shop[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [busy, setBusy] = useState(false);

  function start(shop: Shop | null) {
    setEditing(shop?.id ?? null);
    setValues(shop ? toInput(shop) : EMPTY);
  }

  const submitLabel = editing ? 'Save shop' : 'Add shop';

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = shopSchema.safeParse(values);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Check the shop details.');
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      if (editing) await updateShop(supabase, editing, parsed.data);
      else await createShop(supabase, parsed.data);
      toast.success(editing ? 'Shop updated.' : 'Shop added.');
      start(null);
      router.refresh();
    } catch {
      toast.error('Could not save the shop. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(shop: Shop) {
    setBusy(true);
    try {
      await deleteShop(createClient(), shop.id);
      toast.success('Shop removed.');
      if (editing === shop.id) start(null);
      router.refresh();
    } catch {
      toast.error('Could not remove the shop. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={submit} className="max-w-xl space-y-5" aria-label="Shop location">
        <p className="text-sm font-semibold">{editing ? 'Edit shop' : 'Add a shop'}</p>
        {FIELDS.map(({ key, label, type, hint }) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={`shop-${key}`}>{label}</Label>
            <Input
              id={`shop-${key}`}
              type={type}
              className="h-11"
              aria-describedby={hint ? `shop-${key}-hint` : undefined}
              value={values[key]}
              onChange={(e) => setValues({ ...values, [key]: e.target.value })}
            />
            {hint && (
              <p id={`shop-${key}-hint`} className="text-muted-foreground text-sm">
                {hint}
              </p>
            )}
          </div>
        ))}
        <div className="space-y-2">
          <Label htmlFor="shop-kind">Kind</Label>
          <select
            id="shop-kind"
            className="border-input bg-background text-foreground h-11 w-full rounded-lg border px-3 text-sm"
            value={values.kind}
            onChange={(e) => setValues({ ...values, kind: e.target.value as ShopKind })}
          >
            {SHOP_KINDS.map((k) => (
              <option key={k} value={k}>
                {SHOP_KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="lg" className="min-h-11" disabled={busy}>
            {busy ? 'Saving…' : submitLabel}
          </Button>
          {editing && (
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="min-h-11"
              onClick={() => start(null)}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>

      <section aria-labelledby="shops-listed" className="space-y-3">
        <h3 id="shops-listed" className="text-lg font-bold tracking-tight">
          Listed shops ({shops.length})
        </h3>
        <ul className="space-y-2">
          {shops.map((shop) => (
            <li
              key={shop.id}
              className="bg-muted flex flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-2"
            >
              <span className="min-w-0 text-sm">
                <span className="font-semibold">{shop.name}</span>
                <span className="text-muted-foreground"> · {shop.city}</span>
              </span>
              <span className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={busy}
                  aria-label={`Edit ${shop.name}`}
                  onClick={() => start(shop)}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={busy}
                  aria-label={`Remove ${shop.name}`}
                  onClick={() => remove(shop)}
                >
                  Remove
                </Button>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
