'use client';

import { usePathname } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { signInWithGoogle } from '../lib/sign-in-with-google';

export function SignInButton() {
  const pathname = usePathname();

  async function handleSignIn() {
    const { error } = await signInWithGoogle(pathname);
    if (error) toast.error('Could not reach Google sign-in. Check your connection and try again.');
  }

  // type="button" so it never submits a surrounding form.
  return (
    <Button type="button" onClick={handleSignIn}>
      Sign in with Google
    </Button>
  );
}
