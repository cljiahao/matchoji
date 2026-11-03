'use client';

import { Skeleton } from '@/components/ui/skeleton';

import { useSession } from '../hooks/use-session';
import { SignInButton } from './sign-in-button';
import { UserMenu } from './user-menu';

export function AuthStatus() {
  const { session, isLoading } = useSession();

  // Sized like the Sign in button it usually becomes, so the navbar does not shift when the session resolves.
  if (isLoading) return <Skeleton className="h-11 w-[4.75rem] rounded-md md:h-9" />;
  if (!session) return <SignInButton variant="outline" />;
  return <UserMenu />;
}
