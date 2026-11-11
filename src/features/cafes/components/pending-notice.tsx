interface PendingNoticeProps {
  // "café" or "drink", for the sentence.
  kind: 'café' | 'drink';
}

// Shown only to whoever can already see a pending item (its submitter, or an admin): RLS 404s
// everyone else. It stands where the score and the rating button would be.
export function PendingNotice({ kind }: PendingNoticeProps) {
  return (
    <div role="status" className="bg-muted rounded-2xl px-5 py-4 text-sm">
      <p className="font-semibold">Awaiting review</p>
      <p className="text-muted-foreground mt-1">
        Only you can see this {kind} for now. It goes public once we have checked it, and rating
        opens then.
      </p>
    </div>
  );
}
