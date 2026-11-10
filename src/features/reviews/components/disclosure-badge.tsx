import type { Disclosure } from '../types';

const LABELS: Record<Exclude<Disclosure, 'none'>, string> = {
  invited: 'Invited',
  gifted: 'Gifted',
  paid: 'Paid partnership',
};

// Shown on every surface a disclosed review appears, so a paid or gifted post never passes as
// an unprompted one.
export function DisclosureBadge({ disclosure }: { disclosure: Disclosure }) {
  if (disclosure === 'none') return null;
  return (
    <span className="border-border bg-muted text-foreground inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold">
      {LABELS[disclosure]}
    </span>
  );
}
