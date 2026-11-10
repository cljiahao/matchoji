'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/integrations/supabase/client';

import { mergeCafe, reviewCafe } from '../api/admin-service';
import type { AdminCafe } from '../types';
import { Decision, dateLabel, useAction } from './moderation-controls';
import { TeaSelect } from './tea-select';

function CafeItem({ cafe, approved }: { cafe: AdminCafe; approved: AdminCafe[] }) {
  const { busy, run } = useAction();
  const [keep, setKeep] = useState('');
  const supabase = createClient();
  const targets = approved
    .filter((c) => c.id !== cafe.id)
    .map((c) => ({ id: c.id, name: c.name, brand: c.area ?? c.citySlug }));

  return (
    <li className="space-y-3 px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-semibold break-words">{cafe.name}</p>
          <p className="text-muted-foreground text-sm break-words">
            {[cafe.area, cafe.citySlug, cafe.address].filter(Boolean).join(' · ')}
          </p>
        </div>
        <p className="text-muted-foreground text-sm">
          Added {dateLabel(cafe.createdAt)}
          {cafe.addedByName && ` by ${cafe.addedByName}`}
        </p>
      </div>
      <Decision
        label={cafe.name}
        busy={busy}
        onDecide={(decision, note) =>
          run(
            () => reviewCafe(supabase, cafe.id, decision, note),
            decision === 'approved' ? `${cafe.name} is live.` : `${cafe.name} rejected.`
          )
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <TeaSelect
          aria-label={`Café that ${cafe.name} duplicates`}
          className="h-11 min-w-0 flex-1"
          teas={targets}
          value={keep}
          onChange={setKeep}
          placeholder="Duplicate of…"
        />
        <Button
          type="button"
          size="lg"
          className="min-h-11"
          variant="outline"
          disabled={busy || !keep}
          onClick={() =>
            run(() => mergeCafe(supabase, cafe.id, keep), `${cafe.name} merged; its drinks moved.`)
          }
        >
          Merge
        </Button>
      </div>
    </li>
  );
}

interface CafeQueueProps {
  cafes: AdminCafe[];
  approved: AdminCafe[];
}

export function CafeQueue({ cafes, approved }: CafeQueueProps) {
  return (
    <section aria-labelledby="queue-cafes" className="space-y-3">
      <h2 id="queue-cafes" className="text-2xl font-bold tracking-tight">
        Cafés awaiting review ({cafes.length})
      </h2>
      {cafes.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nothing to review.</p>
      ) : (
        <ul className="divide-y rounded-2xl border">
          {cafes.map((cafe) => (
            <CafeItem key={cafe.id} cafe={cafe} approved={approved} />
          ))}
        </ul>
      )}
    </section>
  );
}
