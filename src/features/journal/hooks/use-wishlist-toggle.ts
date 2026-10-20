'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';

import { signInWithGoogle, useSession } from '@/features/auth';
import { createClient } from '@/integrations/supabase/client';

import { addToWishlist, isWishlisted, removeFromWishlist } from '../api/wishlist-service';

export function useWishlistToggle(productId: string) {
  const { session } = useSession();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const userId = session?.user.id;
  const key = ['wishlist', userId, productId];

  const { data: saved = false } = useQuery({
    queryKey: key,
    queryFn: () => isWishlisted(createClient(), userId as string, productId),
    enabled: Boolean(userId),
  });

  // Optimistic: the toggle flips immediately and rolls back if the write fails.
  const mutation = useMutation({
    mutationFn: (next: boolean) =>
      next
        ? addToWishlist(createClient(), userId as string, productId)
        : removeFromWishlist(createClient(), userId as string, productId),
    onMutate: (next) => {
      queryClient.setQueryData(key, next);
      return { previous: !next };
    },
    onError: (_error, _next, context) => {
      queryClient.setQueryData(key, context?.previous ?? false);
      toast.error('Could not update your list. Try again.');
    },
  });

  async function toggle() {
    if (!userId) {
      const { error } = await signInWithGoogle(pathname);
      if (error)
        toast.error('Could not reach Google sign-in. Check your connection and try again.');
      return;
    }
    mutation.mutate(!saved);
  }

  return { saved, toggle, pending: mutation.isPending };
}
