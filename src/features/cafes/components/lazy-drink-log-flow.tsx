'use client';

import dynamic from 'next/dynamic';

import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Like the tea flow, the café-drink form stays out of each page's first load and is fetched when
// the log dialog first opens on this path.
export const LazyDrinkLogFlow = dynamic(() => import('./drink-log-flow'), {
  loading: () => (
    <DialogHeader>
      <DialogTitle>Log a café drink</DialogTitle>
      <DialogDescription>Loading…</DialogDescription>
    </DialogHeader>
  ),
});
