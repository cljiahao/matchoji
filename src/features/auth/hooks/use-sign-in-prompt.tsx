'use client';

import { usePathname } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { SignInDialog } from '../components/sign-in-dialog';
import { signInWithGoogle } from '../lib/sign-in-with-google';

interface PromptOptions {
  // Defaults to the current page, so the visitor comes back to what they were doing.
  nextPath?: string;
  reason?: string;
}

type Prompt = (options?: PromptOptions) => void;

// Outside the provider (isolated component tests) there is no dialog to open, so the
// prompt falls back to going straight to Google.
const SignInPromptContext = createContext<Prompt>((options) => {
  void signInWithGoogle(options?.nextPath ?? window.location.pathname);
});

export function SignInPromptProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [request, setRequest] = useState<PromptOptions | null>(null);

  const prompt = useCallback<Prompt>((options = {}) => setRequest(options), []);
  const value = useMemo(() => prompt, [prompt]);

  return (
    <SignInPromptContext.Provider value={value}>
      {children}
      <SignInDialog
        open={request !== null}
        onOpenChange={(open) => !open && setRequest(null)}
        nextPath={request?.nextPath ?? pathname}
        reason={request?.reason}
      />
    </SignInPromptContext.Provider>
  );
}

export function useSignInPrompt(): Prompt {
  return useContext(SignInPromptContext);
}
