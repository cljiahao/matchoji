'use client';

import { Skeleton } from '@/components/ui/skeleton';

import { useSession } from '../hooks/use-session';
import { SignInButton } from './sign-in-button';
import { UserMenu } from './user-menu';

export function AuthStatus() {
  const { session, isLoading } = useSession();

  if (isLoading) return <Skeleton className="h-9 w-9 rounded-full" />;
  if (!session) return <SignInButton />;
  return <UserMenu />;
}
