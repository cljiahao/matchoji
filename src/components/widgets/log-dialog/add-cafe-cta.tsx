'use client';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SignInButton, useSession } from '@/features/auth';

import { LogDialog } from './log-dialog';

// The call to action on a page with no cafés or drinks yet. The list only grows when a reader
// adds one, so a signed-in reader gets the add-café form and a signed-out one is sent to sign in.
export function AddCafeCta() {
  const { session, isLoading } = useSession();

  if (!isLoading && !session) return <SignInButton label="Sign in to add a café" />;

  return (
    <LogDialog
      initial={{ kind: 'drink', addCafe: true }}
      trigger={
        <Button className="min-h-11" disabled={isLoading}>
          <Plus aria-hidden="true" />
          Add a café
        </Button>
      }
    />
  );
}
