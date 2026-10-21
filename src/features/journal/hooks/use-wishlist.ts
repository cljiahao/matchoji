'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useSession, useSignInPrompt } from '@/features/auth';
import { createClient } from '@/integrations/supabase/client';

import { addToWishlist, listWishlistIds, removeFromWishlist } from '../api/wishlist-service';

const EMPTY: string[] = [];

// The user's saved ids live in one cache entry, so a change from any toggle (card, product
// page, journal list) shows everywhere without a refetch.
export function useWishlist() {
  const { session, isLoading: sessionLoading } = useSession();
  const promptSignIn = useSignInPrompt();
  const queryClient = useQueryClient();
  const userId = session?.user.id;
  const key = ['wishlist', userId];

  const query = useQuery({
    queryKey: key,
    queryFn: () => listWishlistIds(createClient(), userId as string),
    enabled: Boolean(userId),
  });
  const ids = query.data ?? EMPTY;

  const mutation = useMutation({
    mutationFn: ({ productId, save }: { productId: string; save: boolean }) =>
      save
        ? addToWishlist(createClient(), userId as string, productId)
        : removeFromWishlist(createClient(), userId as string, productId),
    // Cancel first: a still-running initial fetch would otherwise land after the optimistic
    // value and flip the toggle back.
    onMutate: async ({ productId, save }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<string[]>(key) ?? [];
      queryClient.setQueryData<string[]>(key, (current = []) =>
        save ? [...new Set([...current, productId])] : current.filter((id) => id !== productId)
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(key, context?.previous ?? []);
      toast.error('Could not update your list. Try again.');
    },
  });

  function toggle(productId: string) {
    if (sessionLoading) return;
    if (!userId) {
      promptSignIn({ reason: 'Sign in to save teas you want to try.' });
      return;
    }
    mutation.mutate({ productId, save: !ids.includes(productId) });
  }

  return {
    ids,
    // Until the session resolves, an empty id list means "unknown", not "nothing saved".
    loaded: !sessionLoading && (!userId || query.isSuccess),
    toggle,
    pending: sessionLoading || (Boolean(userId) && query.isPending),
  };
}

export function useWishlistToggle(productId: string) {
  const { ids, toggle, pending } = useWishlist();
  return { saved: ids.includes(productId), toggle: () => toggle(productId), pending };
}
