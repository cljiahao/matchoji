'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/integrations/supabase/client';

import { updateDrink } from '../api/admin-service';
import { drinkFieldsSchema } from '../schemas';
import type { AdminDrink, CatalogueTea } from '../types';
import { errorMessage } from './moderation-controls';

const selectClass = 'border-input bg-background h-11 w-full rounded-md border px-3 text-sm';

interface Draft {
  name: string;
  base: AdminDrink['base'];
  style: AdminDrink['style'];
  serving: AdminDrink['serving'];
  price: string;
  photo_url: string;
  photo_credit: string;
  tea_product_id: string;
}

const draftOf = (d: AdminDrink): Draft => ({
  name: d.name,
  base: d.base,
  style: d.style,
  serving: d.serving,
  price: d.price === null ? '' : String(d.price),
  photo_url: d.photoUrl ?? '',
  photo_credit: d.photoCredit ?? '',
  tea_product_id: d.teaProductId ?? '',
});

// Only changed fields are sent; a blank price is left alone (this form sets a price, it does
// not clear one).
export function changedDrinkFields(before: Draft, after: Draft) {
  const out: Record<string, string | number> = {};
  for (const key of Object.keys(before) as (keyof Draft)[]) {
    const value = after[key].trim();
    if (value === before[key].trim()) continue;
    if (key === 'price') {
      if (value !== '') out.price = Number(value);
    } else out[key] = value;
  }
  return out;
}

function Editor({ drink, teas }: { drink: AdminDrink; teas: CatalogueTea[] }) {
  const router = useRouter();
  const before = draftOf(drink);
  const [v, setV] = useState(before);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setV({ ...v, [key]: value });

  async function submit(event: FormEvent) {
    event.preventDefault();
    const fields = changedDrinkFields(before, v);
    if (Object.keys(fields).length === 0) {
      toast.message('Nothing changed.');
      return;
    }
    const parsed = drinkFieldsSchema.safeParse(fields);
    if (!parsed.success) {
      toast.error('Check the fields: a name, a price of zero or more, and an https photo link.');
      return;
    }
    setBusy(true);
    try {
      await updateDrink(createClient(), drink.id, parsed.data);
      toast.success(`${drink.name} saved.`);
      router.refresh();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-4" aria-label="Edit drink">
      <div className="space-y-2">
        <Label htmlFor="drink-name">Name</Label>
        <Input
          id="drink-name"
          className="h-11"
          value={v.name}
          onChange={(e) => set('name', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="drink-base">Base</Label>
          <select
            id="drink-base"
            className={selectClass}
            value={v.base}
            onChange={(e) => set('base', e.target.value as Draft['base'])}
          >
            <option value="hojicha">Hojicha</option>
            <option value="matcha">Matcha</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="drink-style">Style</Label>
          <select
            id="drink-style"
            className={selectClass}
            value={v.style}
            onChange={(e) => set('style', e.target.value as Draft['style'])}
          >
            <option value="latte">Latte</option>
            <option value="straight">Straight</option>
            <option value="iced_latte">Iced latte</option>
            <option value="float">Float</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="drink-serving">Serving</Label>
          <select
            id="drink-serving"
            className={selectClass}
            value={v.serving}
            onChange={(e) => set('serving', e.target.value as Draft['serving'])}
          >
            <option value="hot">Hot</option>
            <option value="iced">Iced</option>
            <option value="both">Both</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="drink-price">Price</Label>
        <Input
          id="drink-price"
          className="h-11"
          inputMode="decimal"
          value={v.price}
          onChange={(e) => set('price', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="drink-photo-url">Photo link (https)</Label>
        <Input
          id="drink-photo-url"
          className="h-11"
          value={v.photo_url}
          onChange={(e) => set('photo_url', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="drink-photo-credit">Photo credit</Label>
        <Input
          id="drink-photo-credit"
          className="h-11"
          value={v.photo_credit}
          onChange={(e) => set('photo_credit', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="drink-tea">Tea it is made with</Label>
        <select
          id="drink-tea"
          className={selectClass}
          value={v.tea_product_id}
          onChange={(e) => set('tea_product_id', e.target.value)}
        >
          <option value="">No tea linked</option>
          {teas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.brand ? `${t.name} · ${t.brand}` : t.name}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" size="lg" className="min-h-11" disabled={busy}>
        {busy ? 'Saving…' : 'Save drink'}
      </Button>
    </form>
  );
}

export function DrinkEditForm({ drinks, teas }: { drinks: AdminDrink[]; teas: CatalogueTea[] }) {
  const [id, setId] = useState('');
  const drink = drinks.find((d) => d.id === id);
  return (
    <section aria-labelledby="edit-drink" className="space-y-4">
      <h2 id="edit-drink" className="text-2xl font-bold tracking-tight">
        Edit a drink
      </h2>
      <div className="max-w-xl space-y-2">
        <Label htmlFor="edit-drink-pick">Drink</Label>
        <select
          id="edit-drink-pick"
          className={selectClass}
          value={id}
          onChange={(e) => setId(e.target.value)}
        >
          <option value="">Pick a drink</option>
          {drinks.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} · {d.cafeName}
            </option>
          ))}
        </select>
      </div>
      {drink && <Editor key={drink.id} drink={drink} teas={teas} />}
    </section>
  );
}
