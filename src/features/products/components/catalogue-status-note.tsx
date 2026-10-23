import type { ProductStatus } from '../types';

const LABELS: Partial<Record<ProductStatus, string>> = {
  pending: 'Awaiting review',
  rejected: 'Not in the catalogue',
};

// A small text label for lists (journal, want-to-try) that show teas outside the catalogue.
export function CatalogueStatusNote({ status }: { status?: ProductStatus }) {
  const label = status && LABELS[status];
  if (!label) return null;
  return <span className="text-muted-foreground text-xs font-normal">{label}</span>;
}
