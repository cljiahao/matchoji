'use client';

import { Button } from '@/components/ui/button';

import { useSignInPrompt } from '../hooks/use-sign-in-prompt';

interface SignInButtonProps {
  // The navbar shows it as secondary so "Log a tasting" stays the one primary action.
  variant?: 'default' | 'outline';
  label?: string;
}

// type="button" so it never submits a surrounding form.
export function SignInButton({ variant = 'default', label = 'Sign in' }: SignInButtonProps) {
  const prompt = useSignInPrompt();
  return (
    <Button type="button" variant={variant} onClick={() => prompt()}>
      {label}
    </Button>
  );
}
