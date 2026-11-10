'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/integrations/supabase/client';

import { updateCafe } from '../api/admin-service';
import { cafeFieldsSchema, type CafeFields } from '../schemas';
import type { AdminCafe } from '../types';
import { errorMessage } from './moderation-controls';

const TEXT_FIELDS = [
  ['name', 'Name'],
  ['area', 'Area'],
  ['address', 'Address'],
  ['instagram_handle', 'Instagram handle (no @)'],
  ['website_url', 'Website (https)'],
  ['lat', 'Latitude'],
  ['lng', 'Longitude'],
] as const;
type FieldKey = (typeof TEXT_FIELDS)[number][0];

function initial(cafe: AdminCafe): Record<FieldKey, string> {
  return {
    name: cafe.name,
    area: cafe.area ?? '',
    address: cafe.address ?? '',
    instagram_handle: cafe.instagramHandle ?? '',
    website_url: cafe.websiteUrl ?? '',
    lat: cafe.lat === null ? '' : String(cafe.lat),
    lng: cafe.lng === null ? '' : String(cafe.lng),
  };
}

// Only fields the admin changed are sent. A blank coordinate is left alone: the database can
// set a coordinate but this form does not clear one.
export function changedFields(before: Record<FieldKey, string>, after: Record<FieldKey, string>) {
  const out: Record<string, string | number> = {};
  for (const [key] of TEXT_FIELDS) {
    const value = after[key].trim();
    if (value === before[key].trim()) continue;
    if (key === 'lat' || key === 'lng') {
      if (value !== '') out[key] = Number(value);
    } else out[key] = value;
  }
  return out;
}

function Editor({ cafe }: { cafe: AdminCafe }) {
  const router = useRouter();
  const before = initial(cafe);
  const [values, setValues] = useState(before);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const fields = changedFields(before, values);
    if (Object.keys(fields).length === 0) {
      toast.message('Nothing changed.');
      return;
    }
    const parsed = cafeFieldsSchema.safeParse(fields);
    if (!parsed.success) {
      toast.error(
        'Check the fields: a name, an https website, a handle without @, real coordinates.'
      );
      return;
    }
    setBusy(true);
    try {
      await updateCafe(createClient(), cafe.id, parsed.data satisfies CafeFields);
      toast.success(`${cafe.name} saved.`);
      router.refresh();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-4" aria-label="Edit café">
      {TEXT_FIELDS.map(([key, label]) => (
        <div key={key} className="space-y-2">
          <Label htmlFor={`cafe-${key}`}>{label}</Label>
          <Input
            id={`cafe-${key}`}
            className="h-11"
            value={values[key]}
            onChange={(e) => setValues({ ...values, [key]: e.target.value })}
          />
        </div>
      ))}
      <Button type="submit" size="lg" className="min-h-11" disabled={busy}>
        {busy ? 'Saving…' : 'Save café'}
      </Button>
    </form>
  );
}

export function CafeEditForm({ cafes }: { cafes: AdminCafe[] }) {
  const [id, setId] = useState('');
  const cafe = cafes.find((c) => c.id === id);
  return (
    <section aria-labelledby="edit-cafe" className="space-y-4">
      <h2 id="edit-cafe" className="text-2xl font-bold tracking-tight">
        Edit a café
      </h2>
      <div className="max-w-xl space-y-2">
        <Label htmlFor="edit-cafe-pick">Café</Label>
        <select
          id="edit-cafe-pick"
          className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm"
          value={id}
          onChange={(e) => setId(e.target.value)}
        >
          <option value="">Pick a café</option>
          {cafes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.area ? ` · ${c.area}` : ''}
            </option>
          ))}
        </select>
      </div>
      {cafe && <Editor key={cafe.id} cafe={cafe} />}
    </section>
  );
}
