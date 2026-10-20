'use client';

import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createClient } from '@/integrations/supabase/client';
import { PAGE_ROUTES } from '@/lib/constants/routes';

import { useSession } from '../hooks/use-session';

export function UserMenu() {
  const { session } = useSession();
  const router = useRouter();

  if (!session) return null;

  const email = session.user.email ?? '';
  const avatarUrl = session.user.user_metadata.avatar_url as string | undefined;
  const initial = email.charAt(0).toUpperCase();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full" aria-label="Account menu">
        <Avatar>
          <AvatarImage src={avatarUrl} alt={email} />
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled className="text-muted-foreground">
          {email}
        </DropdownMenuItem>
        {/* The navbar hides its section links on narrow screens; they live here instead. */}
        <DropdownMenuItem asChild className="sm:hidden">
          <Link href={PAGE_ROUTES.HOME}>Discover</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
