'use client';

import type { ReactNode } from 'react';

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
export function AdminTabs({
  queueCount,
  reportCount,
  queue,
  reports,
  photo,
  price,
}: AdminTabsProps) {
  const trigger = 'h-10 flex-none px-3';
  return (
    <Tabs defaultValue="queue" className="gap-6">
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
      <TabsContent value="queue">{queue}</TabsContent>
      <TabsContent value="reports">{reports}</TabsContent>
      <TabsContent value="photo">{photo}</TabsContent>
      <TabsContent value="price">{price}</TabsContent>
    </Tabs>
  );
}
