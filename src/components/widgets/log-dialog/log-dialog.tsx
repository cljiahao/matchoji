'use client';

import { Coffee, Leaf } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useSession, useSignInPrompt } from '@/features/auth';
import { LazyDrinkLogFlow, type DrinkListing } from '@/features/cafes';
import { LogTastingFlow, type PrepPreset } from '@/features/reviews';

type Kind = 'tea' | 'drink';

interface LogDialogProps {
  trigger?: ReactNode;
  // Skips the chooser: a recipe logs a tea with its brew settings, a drink page logs that drink.
  // `addCafe` opens the café path on its add-café form, for pages with no café to pick yet.
  initial?:
    | { kind: 'tea'; prep?: PrepPreset }
    | { kind: 'drink'; drink: DrinkListing }
    | { kind: 'drink'; addCafe: true };
}

const CHOICES: { kind: Kind; title: string; hint: string; icon: typeof Coffee }[] = [
  {
    kind: 'drink',
    title: 'A café drink',
    hint: 'A hojicha or matcha latte you ordered',
    icon: Coffee,
  },
  { kind: 'tea', title: 'A tea I brewed', hint: 'Leaf or powder you made at home', icon: Leaf },
];

// The app-wide entry point for logging. Logging needs an account, so a signed-out visitor gets
// the sign-in dialog instead. Closing unmounts the flow, so each opening starts at the chooser.
export function LogDialog({ trigger, initial }: LogDialogProps) {
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<Kind | undefined>();

  const { session, isLoading: sessionLoading } = useSession();
  const promptSignIn = useSignInPrompt();

  function handleOpenChange(next: boolean) {
    if (next && !session) {
      if (!sessionLoading) promptSignIn({ reason: 'Sign in to log and rate what you try.' });
      return;
    }
    setOpen(next);
    if (!next) setChosen(undefined);
  }

  const close = () => handleOpenChange(false);
  const kind = initial?.kind ?? chosen;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild disabled={sessionLoading}>
        {trigger ?? <Button className="min-h-11">Log a tasting</Button>}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-3xl sm:max-w-lg">
        {kind === undefined && (
          <>
            <DialogHeader>
              <DialogTitle>Log a tasting</DialogTitle>
              <DialogDescription>What did you try?</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              {CHOICES.map(({ kind: choice, title, hint, icon: Icon }) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => setChosen(choice)}
                  className="hover:bg-muted focus-visible:ring-ring flex min-h-16 items-center gap-4 rounded-2xl border p-4 text-left focus-visible:ring-2"
                >
                  <Icon aria-hidden="true" className="text-primary h-6 w-6 shrink-0" />
                  <span>
                    <span className="block font-semibold">{title}</span>
                    <span className="text-muted-foreground block text-sm">{hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
        {kind === 'drink' && (
          <LazyDrinkLogFlow
            initialDrink={
              initial?.kind === 'drink' && 'drink' in initial ? initial.drink : undefined
            }
            startAtAddCafe={initial?.kind === 'drink' && 'addCafe' in initial}
            onDone={close}
          />
        )}
        {kind === 'tea' && (
          <LogTastingFlow
            prep={initial?.kind === 'tea' ? initial.prep : undefined}
            onClose={close}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
