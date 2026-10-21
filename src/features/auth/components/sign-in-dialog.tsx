'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { signInWithGoogle } from '../lib/sign-in-with-google';

interface SignInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Where the visitor lands after Google sends them back.
  nextPath: string;
  reason?: string;
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.9-.1-1.5-.2-2.2H12v4.2h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.6Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.7-4.9H1.3v3.1A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.3 14.4a7.2 7.2 0 0 1 0-4.7V6.6H1.3a12 12 0 0 0 0 10.9l4-3.1Z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A11.9 11.9 0 0 0 1.3 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z"
      />
    </svg>
  );
}

// Vivino's "Join | Log in" moment: any write a signed-out visitor starts opens this first.
export function SignInDialog({ open, onOpenChange, nextPath, reason }: SignInDialogProps) {
  const [redirecting, setRedirecting] = useState(false);

  async function handleGoogle() {
    setRedirecting(true);
    const { error } = await signInWithGoogle(nextPath);
    if (error) {
      setRedirecting(false);
      toast.error('Could not reach Google sign-in. Check your connection and try again.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl p-8 text-center">
        <DialogHeader className="items-center text-center">
          <svg viewBox="0 0 64 64" aria-hidden="true" className="mb-2 h-12 w-12">
            <rect width="64" height="64" rx="16" fill="#f5f1e6" />
            <path d="M32 12c9 6 14 13 14 21a14 14 0 0 1-28 0c0-8 5-15 14-21Z" fill="#5c7a4f" />
            <path d="M32 30c6 4 9 8 9 13a9 9 0 0 1-18 0c0-5 3-9 9-13Z" fill="#8f6224" />
          </svg>
          <DialogTitle className="text-2xl font-bold tracking-tight">Join Matchoji</DialogTitle>
          <DialogDescription>
            {reason ?? 'Sign in to rate teas, keep a journal and save teas to try.'}
          </DialogDescription>
        </DialogHeader>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handleGoogle}
          disabled={redirecting}
          className="mt-2 h-12 w-full text-base"
        >
          {redirecting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <GoogleMark />}
          Continue with Google
        </Button>
      </DialogContent>
    </Dialog>
  );
}
