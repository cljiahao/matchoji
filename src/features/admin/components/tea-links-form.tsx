'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProductImageWell } from '@/features/products';
import { createClient } from '@/integrations/supabase/client';

import { setTeaLinks, uploadTeaImage } from '../api/admin-service';
import type { CatalogueTea } from '../types';
import { TeaSelect } from './tea-select';

// Matches the products.image_credit check, so a long credit is refused before the upload.
export const teaCreditSchema = z.string().trim().max(120);

function photoStatus({ imageUrl, imageCredit }: CatalogueTea) {
  if (!imageUrl) return 'No photo yet; the drawn tin shows.';
  return imageCredit ? `Photo: ${imageCredit}` : 'Photo, no credit';
}

// Sets a catalogue tea's photo (a packshot the maker allows us to use), who it is credited to
// and its shop link. Choosing no file keeps the current photo; "Remove photo" brings back the
// drawn tin.
export function TeaLinksForm({ catalogue }: { catalogue: CatalogueTea[] }) {
  const router = useRouter();
  const [tea, setTea] = useState('');
  const [shop, setShop] = useState('');
  const [credit, setCredit] = useState('');
  const [remove, setRemove] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  // The credit and shop link are saved as typed, so the form starts from the tea's current
  // values: leaving one untouched keeps it.
  function pick(id: string) {
    const picked = catalogue.find((p) => p.id === id);
    setTea(id);
    setCredit(picked?.imageCredit ?? '');
    setShop(picked?.shopUrl ?? '');
    setRemove(false);
    setFile(null);
  }

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
      pick('');
      router.refresh();
    } catch {
      toast.error('Could not update the tea. Try again.');
    } finally {
      setBusy(false);
    }
  }

  const picked = catalogue.find((p) => p.id === tea);

  return (
    <form onSubmit={submit} className="max-w-xl space-y-6" aria-label="Tea photo and shop link">
      <div className="space-y-2">
        <Label htmlFor="links-tea">Tea</Label>
        <TeaSelect
          id="links-tea"
          teas={catalogue}
          value={tea}
          onChange={pick}
          placeholder="Pick a tea"
        />
      </div>

      {picked && (
        <div className="bg-muted flex items-center gap-4 rounded-2xl p-3">
          <ProductImageWell
            imageUrl={picked.imageUrl}
            category={picked.category}
            name={`Current photo of ${picked.name}`}
            seed={picked.id}
            className="size-20 shrink-0"
          />
          <div className="min-w-0 text-sm">
            <p className="font-semibold break-words" title={picked.name}>
              {picked.name}
            </p>
            <p className="text-muted-foreground break-words">{photoStatus(picked)}</p>
          </div>
        </div>
      )}

      <fieldset className="space-y-4">
        <legend className="mb-3 text-sm font-semibold">Photo and credit</legend>
        <div className="space-y-2">
          <Label htmlFor="links-photo">Photo (optional)</Label>
          <Input
            id="links-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="h-10 py-1.5"
            disabled={remove}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div className="flex items-center gap-2">
            <input
              id="links-remove"
              type="checkbox"
              className="size-4"
              checked={remove}
              onChange={(e) => setRemove(e.target.checked)}
            />
            <Label htmlFor="links-remove" className="min-h-10 flex-1">
              Remove photo
            </Label>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="links-credit">Photo credit (optional)</Label>
          <Input
            id="links-credit"
            className="h-10"
            maxLength={120}
            placeholder="Marukyu Koyamaen"
            aria-describedby="links-credit-count"
            value={credit}
            onChange={(e) => setCredit(e.target.value)}
          />
          <p
            id="links-credit-count"
            className="text-muted-foreground text-right text-sm tabular-nums"
          >
            {credit.length}/120
          </p>
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="links-shop">Shop link (optional)</Label>
        <Input
          id="links-shop"
          type="url"
          className="h-10"
          placeholder="https://"
          aria-describedby="links-help"
          value={shop}
          onChange={(e) => setShop(e.target.value)}
        />
        <p id="links-help" className="text-muted-foreground text-sm">
          Saving replaces the credit and the shop link with what the fields show (empty removes
          them). No file keeps the current photo; Remove photo clears it and its credit, and the
          drawn tin shows again.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="lg" disabled={busy || !tea}>
          {busy ? 'Saving…' : 'Save tea'}
        </Button>
        <Button type="button" size="lg" variant="outline" disabled={!tea} onClick={() => pick(tea)}>
          Reset
        </Button>
        {!tea && <p className="text-muted-foreground text-sm">Pick a tea to edit it.</p>}
      </div>
    </form>
  );
}
