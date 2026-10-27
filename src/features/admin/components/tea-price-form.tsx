'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ProductSummary } from '@/features/products';
import { createClient } from '@/integrations/supabase/client';

import { setTeaPrice } from '../api/admin-service';

// Both empty clears the price; otherwise both must be positive and within the columns' range.
export const teaPriceSchema = z.union([
  z.object({ price: z.literal(''), grams: z.literal('') }).transform(() => null),
  z.object({
    price: z.coerce.number().positive().max(999_999.99),
    grams: z.coerce.number().positive().max(5000),
  }),
]);

// Sets a catalogue tea's reference price (one pack, in Singapore dollars) and pack size, from
// which its price per gram and band are worked out.
export function TeaPriceForm({ catalogue }: { catalogue: ProductSummary[] }) {
  const router = useRouter();
  const [tea, setTea] = useState('');
  const [price, setPrice] = useState('');
  const [grams, setGrams] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!tea) return;
    const parsed = teaPriceSchema.safeParse({ price: price.trim(), grams: grams.trim() });
    if (!parsed.success) {
      toast.error('Give both a price and a pack size above zero, or leave both empty.');
      return;
    }
    setBusy(true);
    try {
      await setTeaPrice(createClient(), tea, parsed.data);
      toast.success(parsed.data ? 'Price saved.' : 'Price cleared.');
      router.refresh();
    } catch {
      toast.error('Could not save the price. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-4" aria-label="Tea price">
      <div className="space-y-2">
        <Label htmlFor="price-tea">Tea</Label>
        <select
          id="price-tea"
          className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
          value={tea}
          onChange={(e) => setTea(e.target.value)}
        >
          <option value="">Pick a tea</option>
          {catalogue.map((p) => (
            <option key={p.id} value={p.id}>
              {p.brand ? `${p.name} · ${p.brand}` : p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price-sgd">Price (S$)</Label>
          <Input
            id="price-sgd"
            inputMode="decimal"
            placeholder="32.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price-grams">Pack size (g)</Label>
          <Input
            id="price-grams"
            inputMode="decimal"
            placeholder="40"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
          />
        </div>
      </div>
      <p className="text-muted-foreground text-sm">
        The maker&apos;s price for one pack, in Singapore dollars. Leave both empty to remove it.
      </p>
      <Button type="submit" disabled={busy || !tea}>
        Save price
      </Button>
    </form>
  );
}
