'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/integrations/supabase/client';

import { mergeDrink, reviewDrink } from '../api/admin-service';
import type { AdminDrink } from '../types';
import { Decision, dateLabel, useAction } from './moderation-controls';
import { TeaSelect } from './tea-select';

function DrinkItem({ drink, approved }: { drink: AdminDrink; approved: AdminDrink[] }) {
  const { busy, run } = useAction();
  const [keep, setKeep] = useState('');
  const supabase = createClient();
  const targets = approved
    .filter((d) => d.id !== drink.id)
    .map((d) => ({ id: d.id, name: d.name, brand: d.cafeName }));

  return (
    <li className="space-y-3 px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-semibold break-words">
            {drink.name}{' '}
            <span className="text-muted-foreground font-normal">at {drink.cafeName}</span>
          </p>
          <p className="text-muted-foreground text-sm">
            {[drink.base, drink.style.replace('_', ' '), drink.serving].join(' · ')}
          </p>
        </div>
        <p className="text-muted-foreground text-sm">
          Added {dateLabel(drink.createdAt)}
          {drink.addedByName && ` by ${drink.addedByName}`}
        </p>
      </div>
      <Decision
        label={drink.name}
        busy={busy}
        onDecide={(decision, note) =>
          run(
            () => reviewDrink(supabase, drink.id, decision, note),
            decision === 'approved' ? `${drink.name} is live.` : `${drink.name} rejected.`
          )
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <TeaSelect
          aria-label={`Drink that ${drink.name} duplicates`}
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
            run(
              () => mergeDrink(supabase, drink.id, keep),
              `${drink.name} merged; its reviews moved.`
            )
          }
        >
          Merge
        </Button>
      </div>
    </li>
  );
}

interface DrinkQueueProps {
  drinks: AdminDrink[];
  approved: AdminDrink[];
}

export function DrinkQueue({ drinks, approved }: DrinkQueueProps) {
  return (
    <section aria-labelledby="queue-drinks" className="space-y-3">
      <h2 id="queue-drinks" className="text-2xl font-bold tracking-tight">
        Drinks awaiting review ({drinks.length})
      </h2>
      {drinks.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nothing to review.</p>
      ) : (
        <ul className="divide-y rounded-2xl border">
          {drinks.map((drink) => (
            <DrinkItem key={drink.id} drink={drink} approved={approved} />
          ))}
        </ul>
      )}
    </section>
  );
}
