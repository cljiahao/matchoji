'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useSession, useSignInPrompt } from '@/features/auth';
import { createClient } from '@/integrations/supabase/client';

import { getLatestStockReport, reportStock } from '../api/stock-service';
import type { StockReport, StockStatus } from '../types';

// Raised by the database's rate brake; its message is written for people, so it is shown as is.
const RATE_LIMITED = 'P0001';

function isRateLimited(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' && error !== null && 'code' in error && error.code === RATE_LIMITED
  );
}

// The page renders the latest report on the server; the query takes it as its starting value
// so a new report replaces it without a reload.
export function useStockReport(productId: string, initial: StockReport | null) {
  const { session, isLoading: sessionLoading } = useSession();
  const promptSignIn = useSignInPrompt();
  const queryClient = useQueryClient();
  const key = ['stock', productId];

  const query = useQuery({
    queryKey: key,
    queryFn: () => getLatestStockReport(createClient(), productId),
    initialData: initial,
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: (status: StockStatus) => reportStock(createClient(), productId, status),
    onSuccess: (report) => {
      queryClient.setQueryData(key, report);
      toast.success('Thanks, your report is in.');
    },
    onError: (error) => {
      toast.error(isRateLimited(error) ? error.message : 'Could not send your report. Try again.');
    },
  });

  function report(status: StockStatus) {
    if (sessionLoading) return;
    if (!session) {
      promptSignIn({ reason: 'Sign in to report whether a tea is in stock.' });
      return;
    }
    mutation.mutate(status);
  }

  return { latest: query.data, report, pending: sessionLoading || mutation.isPending };
}
