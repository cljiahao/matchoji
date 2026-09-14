'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ProductSummary } from '@/features/products';

import { useProductSearch } from '../hooks/use-product-search.query';

interface ProductSearchComboboxProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (product: ProductSummary) => void;
  onAddNew: () => void;
}

export function ProductSearchCombobox({
  query,
  onQueryChange,
  onSelect,
  onAddNew,
}: ProductSearchComboboxProps) {
  const { data: results, isFetching } = useProductSearch(query);

  return (
    <div className="space-y-3">
      <Input
        autoFocus
        placeholder="Search hojicha or matcha by name or brand…"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />

      {isFetching && <p className="text-muted-foreground text-sm">Searching…</p>}

      {!isFetching && results && results.length > 0 && (
        <ul className="divide-border divide-y rounded-md border">
          {results.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                onClick={() => onSelect(product)}
                className="hover:bg-muted flex w-full flex-col items-start px-3 py-2 text-left"
              >
                <span className="font-medium">{product.name}</span>
                {product.brand && (
                  <span className="text-muted-foreground text-sm">{product.brand}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {!isFetching && query.trim().length >= 2 && (!results || results.length === 0) && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-dashed p-3">
          <span className="text-muted-foreground text-sm">No match for &ldquo;{query}&rdquo;</span>
          <Button type="button" variant="outline" size="sm" onClick={onAddNew}>
            Add as new product
          </Button>
        </div>
      )}
    </div>
  );
}
