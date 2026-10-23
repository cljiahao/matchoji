'use client';

import { CircleCheck, CircleSlash, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useStockReport } from '../hooks/use-stock-report';
import { isStale, reportedAgo } from '../lib';
import type { StockReport, StockStatus } from '../types';

const STATUS: Record<StockStatus, { label: string; Icon: typeof CircleCheck }> = {
  in_stock: { label: 'In stock', Icon: CircleCheck },
  sold_out: { label: 'Sold out', Icon: CircleSlash },
};

interface StockPanelProps {
  productId: string;
  brand: string | null;
  shopUrl: string | null;
  initialReport: StockReport | null;
  className?: string;
}

// Matchoji never checks shops itself (their terms rule out scraping), so the status is what
// tea drinkers last saw, with its age, next to a link to check the shop directly.
export function StockPanel({
  productId,
  brand,
  shopUrl,
  initialReport,
  className,
}: StockPanelProps) {
  const { latest, report, pending } = useStockReport(productId, initialReport);
  const now = new Date();
  const current = latest && !isStale(latest, now) ? latest : null;
  const status = current ? STATUS[current.status] : null;

  return (
    <section aria-labelledby="stock-heading" className={cn('space-y-3', className)}>
      <h2 id="stock-heading" className="text-sm font-semibold">
        Stock at the official shop
      </h2>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {status && current ? (
          <>
            <span className="flex items-center gap-1.5 font-semibold">
              <status.Icon aria-hidden="true" className="h-4 w-4" />
              {status.label}
            </span>
            {/* Server and browser clocks differ by the render delay, so the age may too. */}
            <span className="text-muted-foreground" suppressHydrationWarning>
              reported {reportedAgo(current.reportedAt, now)}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">No recent reports</span>
        )}
        {shopUrl && (
          <a
            href={shopUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 underline underline-offset-2"
          >
            Check {brand ? `${brand}’s` : 'the'} shop
            <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        )}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-sm">Checked it lately?</span>
        {(Object.keys(STATUS) as StockStatus[]).map((value) => (
          <Button
            key={value}
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => report(value)}
            className="bg-background rounded-full"
          >
            {STATUS[value].label}
          </Button>
        ))}
      </div>
    </section>
  );
}
