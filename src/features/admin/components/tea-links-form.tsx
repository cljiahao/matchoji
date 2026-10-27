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

import { setTeaLinks, uploadTeaImage } from '../api/admin-service';

// Matches the products.image_credit check, so a long credit is refused before the upload.
export const teaCreditSchema = z.string().trim().max(120);

// Sets a catalogue tea's photo (a packshot the maker allows us to use), who it is credited to
// and its shop link. Choosing no file keeps the current photo; "Remove photo" brings back the
// drawn tin.
export function TeaLinksForm({ catalogue }: { catalogue: ProductSummary[] }) {
  const router = useRouter();
  const [tea, setTea] = useState('');
  const [shop, setShop] = useState('');
  const [credit, setCredit] = useState('');
  const [remove, setRemove] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!tea) return;
    if (shop && !shop.startsWith('https://')) {
      toast.error('Use an https:// shop link.');
      return;
    }
    const parsedCredit = teaCreditSchema.safeParse(credit);
    if (!parsedCredit.success) {
      toast.error('Keep the photo credit to 120 characters.');
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      let image: string | null = null;
      if (remove) image = '';
      else if (file) image = await uploadTeaImage(supabase, tea, file);
      await setTeaLinks(supabase, tea, { image, shop, credit: parsedCredit.data });
      toast.success('Tea updated.');
      setFile(null);
      setRemove(false);
      router.refresh();
    } catch {
      toast.error('Could not update the tea. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-4" aria-label="Tea photo and shop link">
      <div className="space-y-2">
        <Label htmlFor="links-tea">Tea</Label>
        <select
          id="links-tea"
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
      <div className="space-y-2">
        <Label htmlFor="links-photo">Photo (optional)</Label>
        <Input
          id="links-photo"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          disabled={remove}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <div className="flex items-center gap-2">
          <input
            id="links-remove"
            type="checkbox"
            checked={remove}
            onChange={(e) => setRemove(e.target.checked)}
          />
          <Label htmlFor="links-remove">Remove photo</Label>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="links-credit">Photo credit (optional)</Label>
        <Input
          id="links-credit"
          maxLength={120}
          placeholder="Marukyu Koyamaen"
          value={credit}
          onChange={(e) => setCredit(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="links-shop">Shop link (optional)</Label>
        <Input
          id="links-shop"
          type="url"
          placeholder="https://"
          value={shop}
          onChange={(e) => setShop(e.target.value)}
        />
      </div>
      <p className="text-muted-foreground text-sm">
        Saving replaces the credit and the shop link (empty removes them). No file keeps the current
        photo; Remove photo clears it and its credit, and the drawn tin shows again.
      </p>
      <Button type="submit" disabled={busy || !tea}>
        Save tea
      </Button>
    </form>
  );
}
