'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useSession, useSignInPrompt } from '@/features/auth';

import type { DrinkListing } from '../types';
import { LazyDrinkLogFlow } from './lazy-drink-log-flow';

interface RateThisDrinkProps {
  drink: Pick<DrinkListing, 'id' | 'name' | 'base'>;
}

// The drink page's call to action. Rating needs an account, so a signed-out visitor gets the
// sign-in dialog instead of the form.
export function RateThisDrink({ drink }: RateThisDrinkProps) {
  const [open, setOpen] = useState(false);
  const { session, isLoading: sessionLoading } = useSession();
  const promptSignIn = useSignInPrompt();

  function handleOpenChange(next: boolean) {
    if (next && !session) {
      if (!sessionLoading) promptSignIn({ reason: 'Sign in to rate café drinks.' });
      return;
    }
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="min-h-11">
          Rate this drink
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-3xl sm:max-w-lg">
        <LazyDrinkLogFlow initialDrink={drink} onDone={() => handleOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
