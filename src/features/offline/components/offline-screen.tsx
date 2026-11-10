'use client';

import { Button } from '@/components/ui/button';

// What the service worker shows when a page can't be fetched. It sits outside the site shell
// because the shell's navbar and session need the network.
export function OfflineScreen() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold tracking-tight">You’re offline</h1>
      <p className="text-muted-foreground max-w-md">
        Matchoji needs a connection to load cafés, teas and tastings. Check your signal, then try
        again.
      </p>
      <Button className="min-h-11" onClick={() => window.location.reload()}>
        Try again
      </Button>
    </main>
  );
}
