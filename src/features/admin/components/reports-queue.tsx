'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/integrations/supabase/client';

import { resolveReport, type OpenReport } from '../api/admin-service';

function ReportItem({ report }: { report: OpenReport }) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  async function decide(decision: 'removed' | 'dismissed') {
    setBusy(true);
    try {
      await resolveReport(createClient(), report.id, decision, note);
      toast.success(
        decision === 'removed'
          ? 'Removed; the reporter is told why.'
          : 'Kept; the reporter is told why.'
      );
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'That did not work. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="space-y-3 px-4 py-4 text-sm sm:px-5">
      <p>
        <span className="font-semibold break-words">{report.reporterName}</span> reported a{' '}
        {report.targetType}: “{report.reason}”
      </p>
      {report.content ? (
        <blockquote className="bg-muted rounded-xl px-3 py-2 break-words">
          <span className="font-semibold">{report.content.authorName}:</span> {report.content.text}
          {report.content.productId && (
            <>
              {' '}
              <Link href={`/products/${report.content.productId}`} className="underline">
                View tea
              </Link>
            </>
          )}
        </blockquote>
      ) : (
        <p className="text-muted-foreground">Already removed by its author.</p>
      )}
      <Textarea
        aria-label={`Reason the reporter will see for report ${report.id.slice(0, 8)}`}
        placeholder="Reason the reporter will see"
        value={note}
        maxLength={500}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="lg"
          variant="destructive"
          disabled={busy}
          onClick={() => decide('removed')}
        >
          Remove {report.targetType}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          disabled={busy}
          onClick={() => decide('dismissed')}
        >
          Keep it
        </Button>
      </div>
    </li>
  );
}

export function ReportsQueue({ reports }: { reports: OpenReport[] }) {
  return (
    <section aria-labelledby="queue-reports" className="space-y-3">
      <h2 id="queue-reports" className="text-2xl font-bold tracking-tight">
        Reports ({reports.length})
      </h2>
      {reports.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nothing reported.</p>
      ) : (
        <ul className="divide-y rounded-2xl border">
          {reports.map((report) => (
            <ReportItem key={report.id} report={report} />
          ))}
        </ul>
      )}
    </section>
  );
}
