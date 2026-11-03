'use client';

import dynamic from 'next/dynamic';
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

import type { PrepPreset } from '../types';

// The navbar mounts this dialog on every page, so the form behind it stays out of each page's
// first load and is fetched when the dialog first opens. The fallback keeps the dialog named.
const LogTastingFlow = dynamic(() => import('./log-tasting-flow'), {
  loading: () => (
    <DialogHeader>
      <DialogTitle>Log a tasting</DialogTitle>
      <DialogDescription>Loading…</DialogDescription>
    </DialogHeader>
  ),
});

interface LogTastingDialogProps {
  trigger?: ReactNode;
  // A recipe's brew settings, filled into the rating step.
  prep?: PrepPreset;
}

// The app-wide entry point: find or add a product, then rate it. Like Vivino, logging needs
// an account, so a signed-out visitor gets the sign-in dialog instead of the form.
export function LogTastingDialog({ trigger, prep }: LogTastingDialogProps) {
  const [open, setOpen] = useState(false);

  const { session, isLoading: sessionLoading } = useSession();
  const promptSignIn = useSignInPrompt();

  function handleOpenChange(next: boolean) {
    if (next && !session) {
      if (!sessionLoading) promptSignIn({ reason: 'Sign in to log and rate the teas you try.' });
      return;
    }
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? <Button className="min-h-11">Log a tasting</Button>}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-3xl sm:max-w-lg">
        <LogTastingFlow prep={prep} onClose={() => handleOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
