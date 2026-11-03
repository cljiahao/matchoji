'use client';

import { useMutation, useQuery } from '@tanstack/react-query';

import { useSession } from '@/features/auth';

import { fetchScanEnabled, scanLabel } from '../lib/scan-label';

// Asks the server whether ANTHROPIC_API_KEY is set, so the button stays hidden until it is.
export function useLabelScanEnabled(): boolean {
  const signedIn = Boolean(useSession().session);
  const { data } = useQuery({
    queryKey: ['label-scan-enabled'],
    queryFn: fetchScanEnabled,
    enabled: signedIn,
    staleTime: Infinity,
    retry: false,
  });
  return signedIn && data === true;
}

export function useScanLabel() {
  return useMutation({ mutationFn: scanLabel });
}
