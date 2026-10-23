'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ProductSummary } from '@/features/products';
import { createClient } from '@/integrations/supabase/client';

import { setTeaLinks, uploadTeaImage } from '../api/admin-service';

// Sets a catalogue tea's photo (a packshot the maker allows us to use) and its shop link.
// Leaving the photo empty keeps the drawn tin.
export function TeaLinksForm({ catalogue }: { catalogue: ProductSummary[] }) {
  const router = useRouter();
  const [tea, setTea] = useState('');
  const [shop, setShop] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!tea) return;
    if (shop && !shop.startsWith('https://')) {
      toast.error('Use an https:// shop link.');
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const image = file ? await uploadTeaImage(supabase, tea, file) : '';
      await setTeaLinks(supabase, tea, { image, shop });
      toast.success('Tea updated.');
      setFile(null);
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
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
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
        Saving replaces both: an empty photo shows the drawn tin, an empty link removes it.
      </p>
      <Button type="submit" disabled={busy || !tea}>
        Save tea
      </Button>
    </form>
  );
}
