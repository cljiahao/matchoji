'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AdminTabsProps {
  queueCount: number;
  reportCount: number;
  queue: ReactNode;
  reports: ReactNode;
  photo: ReactNode;
  price: ReactNode;
}

function Count({ n }: { n: number }) {
  if (n === 0) return null;
  return (
    <span className="bg-primary text-primary-foreground rounded-full px-1.5 text-xs tabular-nums">
      <span aria-hidden="true">{n}</span>
      <span className="sr-only">, {n} waiting</span>
    </span>
  );
}

// Four jobs on one page: two queues that empty out, two forms that edit a single tea. The
// counts sit on the queue tabs so a quiet day reads at a glance.
const TABS = ['queue', 'reports', 'photo', 'price'] as const;
type Tab = (typeof TABS)[number];

const fromHash = (hash: string): Tab => TABS.find((t) => `#${t}` === hash) ?? 'queue';

export function AdminTabs({
  queueCount,
  reportCount,
  queue,
  reports,
  photo,
  price,
}: AdminTabsProps) {
  const trigger = 'h-10 flex-none px-3';
  // The hash is read after mount so the server render and first client render agree.
  const [tab, setTab] = useState<Tab>('queue');
  useEffect(() => {
    const sync = () => setTab(fromHash(window.location.hash));
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  function change(next: string) {
    const picked = fromHash(`#${next}`);
    setTab(picked);
    window.history.replaceState(null, '', `#${picked}`);
  }

  // Panels stay mounted (just hidden) so a half-filled form survives a tab switch.
  const panel = 'data-[state=inactive]:hidden';
  return (
    <Tabs value={tab} onValueChange={change} className="gap-6">
      <TabsList className="grid w-full grid-cols-2 group-data-[orientation=horizontal]/tabs:h-auto sm:inline-flex sm:w-fit">
        <TabsTrigger value="queue" className={trigger}>
          Review queue
          <Count n={queueCount} />
        </TabsTrigger>
        <TabsTrigger value="reports" className={trigger}>
          Reports
          <Count n={reportCount} />
        </TabsTrigger>
        <TabsTrigger value="photo" className={trigger}>
          Tea photo
        </TabsTrigger>
        <TabsTrigger value="price" className={trigger}>
          Tea price
        </TabsTrigger>
      </TabsList>
      <TabsContent value="queue" forceMount className={panel}>
        {queue}
      </TabsContent>
      <TabsContent value="reports" forceMount className={panel}>
        {reports}
      </TabsContent>
      <TabsContent value="photo" forceMount className={panel}>
        {photo}
      </TabsContent>
      <TabsContent value="price" forceMount className={panel}>
        {price}
      </TabsContent>
    </Tabs>
  );
}
