'use client';

import dynamic from 'next/dynamic';

import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// The navbar mounts the log dialog on every page, so the form behind it stays out of each page's
// first load and is fetched when the dialog first opens. The fallback keeps the dialog named.
export const LogTastingFlow = dynamic(() => import('./log-tasting-flow'), {
  loading: () => (
    <DialogHeader>
      <DialogTitle>Log a tasting</DialogTitle>
      <DialogDescription>Loading…</DialogDescription>
    </DialogHeader>
  ),
});
