'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { UnitInput } from '@/components/widgets';
import {
  formatMonth,
  formatPerGram,
  formatSgd,
  listPriceHistory,
  type ProductSummary,
} from '@/features/products';
import { createClient } from '@/integrations/supabase/client';

import { setTeaPrice } from '../api/admin-service';
import { TeaSelect } from './tea-select';

const RECENT_PRICES = 5;

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
  const queryClient = useQueryClient();
  const [tea, setTea] = useState('');
  const [price, setPrice] = useState('');
  const [grams, setGrams] = useState('');
  const [busy, setBusy] = useState(false);
  const history = useQuery({
    queryKey: ['tea-price-history', tea],
    queryFn: () => listPriceHistory(createClient(), tea),
    enabled: Boolean(tea),
  });
  // Newest first, the few that matter when deciding whether a price is stale.
  const recent = (history.data ?? []).slice(-RECENT_PRICES).reverse();

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
      void queryClient.invalidateQueries({ queryKey: ['tea-price-history', tea] });
      router.refresh();
    } catch {
      toast.error('Could not save the price. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-6" aria-label="Tea price">
      <div className="space-y-2">
        <Label htmlFor="price-tea">Tea</Label>
        <TeaSelect
          id="price-tea"
          teas={catalogue}
          value={tea}
          onChange={setTea}
          placeholder="Pick a tea"
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <div className="w-36 space-y-2">
          <Label htmlFor="price-sgd">Price (S$)</Label>
          <UnitInput
            id="price-sgd"
            unit="S$"
            unitPosition="start"
            inputMode="decimal"
            placeholder="32.00"
            aria-describedby="price-help"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="w-32 space-y-2">
          <Label htmlFor="price-grams">Pack size (g)</Label>
          <UnitInput
            id="price-grams"
            unit="g"
            inputMode="decimal"
            placeholder="40"
            aria-describedby="price-help"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
          />
        </div>
      </div>
      <p id="price-help" className="text-muted-foreground -mt-2 text-sm">
        The maker&apos;s price for one pack, in Singapore dollars. Leave both empty to remove it.
      </p>
      {recent.length > 0 && (
        <section aria-labelledby="price-history-heading">
          <h3 id="price-history-heading" className="text-sm font-semibold">
            Recent prices
          </h3>
          <ul className="text-muted-foreground mt-1 text-sm tabular-nums">
            {recent.map((p) => (
              <li key={p.recordedAt}>
                {formatMonth(p.recordedAt)}: {formatSgd(p.sgd)} for {p.packGrams} g ·{' '}
                {formatPerGram(p.perGram)}
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" className="min-h-11" disabled={busy || !tea}>
          {busy ? 'Saving…' : 'Save price'}
        </Button>
        {!tea && <p className="text-muted-foreground text-sm">Pick a tea to set its price.</p>}
      </div>
    </form>
  );
}
