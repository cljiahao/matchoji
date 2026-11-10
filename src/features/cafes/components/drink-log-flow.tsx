'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { DrinkBase } from '@/integrations/supabase/database.types';

import { useCafeSearch } from '../hooks/use-cafe-search.query';
import { useDrinkSearch } from '../hooks/use-drink-search.query';
import { useIsTrustedTaster } from '../hooks/use-trusted-taster.query';
import { cityBySlug } from '../lib/city';
import { BASE_LABELS, SERVING_LABELS, STYLE_LABELS } from '../lib/labels';
import type { Cafe, Drink, DrinkListing } from '../types';
import { AddCafeForm } from './add-cafe-form';
import { AddDrinkForm } from './add-drink-form';
import { DrinkReviewForm } from './drink-review-form';
import { SearchCombobox } from './search-combobox';

type Step = 'cafe' | 'add-cafe' | 'drink' | 'add-drink' | 'rate';

interface DrinkLogFlowProps {
  // Set when logging from a drink's own page: skips straight to rating it.
  initialDrink?: Pick<DrinkListing, 'id' | 'name' | 'base'>;
  onDone: () => void;
}

interface RateTarget {
  id: string;
  name: string;
  base: DrinkBase;
}

function cafeDetail(cafe: Cafe): string {
  const place = [cafe.area, cityBySlug(cafe.citySlug)?.name].filter(Boolean).join(', ');
  return cafe.status === 'pending' ? `${place} · awaiting review` : place;
}

function drinkDetail(drink: Drink): string {
  const parts = [BASE_LABELS[drink.base], STYLE_LABELS[drink.style], SERVING_LABELS[drink.serving]];
  if (drink.status === 'pending') parts.push('awaiting review');
  return parts.join(' · ');
}

// The café-drink path of the log dialog: pick or add a café, pick or add a drink, then rate it.
// Closing unmounts it, so each opening starts fresh. Items the person adds wait for review but
// are theirs to rate straight away.
export default function DrinkLogFlow({ initialDrink, onDone }: DrinkLogFlowProps) {
  const [step, setStep] = useState<Step>(initialDrink ? 'rate' : 'cafe');
  const [cafe, setCafe] = useState<Cafe | undefined>();
  const [target, setTarget] = useState<RateTarget | undefined>(initialDrink);
  const [cafeQuery, setCafeQuery] = useState('');
  const [drinkQuery, setDrinkQuery] = useState('');

  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstStep = useRef(true);

  const { isTaster, isError: tasterError, refetch: retryTaster } = useIsTrustedTaster();
  const cafes = useCafeSearch(cafeQuery);
  const drinks = useDrinkSearch(cafe?.id ?? '', drinkQuery);

  // The comboboxes autofocus themselves; the other steps replace the form the person was in, so
  // focus moves to the new heading rather than being dropped on the dialog.
  useEffect(() => {
    if (firstStep.current) {
      firstStep.current = false;
      return;
    }
    if (step !== 'cafe' && step !== 'drink') headingRef.current?.focus();
  }, [step]);

  function pickCafe(picked: Cafe) {
    setCafe(picked);
    setDrinkQuery('');
    setStep('drink');
  }

  function pickDrink(picked: Drink) {
    setTarget(picked);
    setStep('rate');
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle ref={headingRef} tabIndex={-1} className="outline-none">
          {step === 'rate' && target ? `Rate ${target.name}` : 'Log a café drink'}
        </DialogTitle>
        <DialogDescription>
          {step === 'cafe' && 'Which café was it at?'}
          {step === 'add-cafe' &&
            "Add the café. You can rate its drinks now; it joins Matchoji once we've checked it."}
          {step === 'drink' && `What did you have at ${cafe?.name}?`}
          {step === 'add-drink' &&
            "Add the drink. You can rate it now; it's listed once we've checked it."}
          {step === 'rate' && 'How was it?'}
        </DialogDescription>
      </DialogHeader>

      {step === 'cafe' && (
        <SearchCombobox
          label="Search cafés"
          placeholder="Search for a café…"
          listLabel="Matching cafés"
          query={cafeQuery}
          onQueryChange={setCafeQuery}
          options={(cafes.data ?? []).map((c) => ({
            id: c.id,
            label: c.name,
            detail: cafeDetail(c),
          }))}
          isSearching={cafes.isSearching}
          isError={cafes.isError}
          searchable={cafeQuery.trim().length >= 2}
          onSelect={(id) => {
            const picked = cafes.data?.find((c) => c.id === id);
            if (picked) pickCafe(picked);
          }}
          addLabel="Add this café"
          onAddNew={() => setStep('add-cafe')}
        />
      )}

      {step === 'add-cafe' && (
        <AddCafeForm
          initialName={cafeQuery.trim()}
          onAdded={pickCafe}
          onCancel={() => setStep('cafe')}
        />
      )}

      {step === 'drink' && cafe && (
        <SearchCombobox
          label="Search drinks"
          placeholder="Search this café's drinks…"
          listLabel="Matching drinks"
          query={drinkQuery}
          onQueryChange={setDrinkQuery}
          options={(drinks.data ?? []).map((d) => ({
            id: d.id,
            label: d.name,
            detail: drinkDetail(d),
          }))}
          isSearching={drinks.isSearching}
          isError={drinks.isError}
          searchable
          onSelect={(id) => {
            const picked = drinks.data?.find((d) => d.id === id);
            if (picked) pickDrink(picked);
          }}
          addLabel="Add a drink"
          onAddNew={() => setStep('add-drink')}
        />
      )}

      {step === 'add-drink' && cafe && (
        <AddDrinkForm
          cafeId={cafe.id}
          initialName={drinkQuery.trim()}
          onAdded={pickDrink}
          onCancel={() => setStep('drink')}
        />
      )}

      {step === 'rate' && target && tasterError && (
        <div role="alert" className="space-y-3">
          <p className="text-sm">
            Could not check your tasting badge, so we cannot show the right form.
          </p>
          <Button type="button" variant="outline" onClick={() => void retryTaster()}>
            Try again
          </Button>
        </div>
      )}
      {step === 'rate' && target && !tasterError && isTaster === undefined && (
        <p className="text-muted-foreground text-sm">Loading…</p>
      )}
      {step === 'rate' && target && isTaster !== undefined && (
        <DrinkReviewForm drink={target} isTaster={isTaster} onLogged={onDone} />
      )}
    </>
  );
}
