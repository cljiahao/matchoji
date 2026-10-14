'use client';

import { useId, useState, type KeyboardEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CategoryBadge, type ProductSummary } from '@/features/products';
import { cn } from '@/lib/utils';

import { useProductSearch } from '../hooks/use-product-search.query';

interface ProductSearchComboboxProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (product: ProductSummary) => void;
  onAddNew: () => void;
}

// WAI-ARIA combobox (list autocomplete): focus stays in the input, arrow keys move the
// active option via aria-activedescendant, Enter picks it.
export function ProductSearchCombobox({
  query,
  onQueryChange,
  onSelect,
  onAddNew,
}: ProductSearchComboboxProps) {
  const listboxId = useId();
  const [activeIndex, setActiveIndex] = useState(-1);
  const { data: results, isFetching, isError } = useProductSearch(query);

  const searchable = query.trim().length >= 2;
  const options = !isFetching && results ? results : [];
  const expanded = options.length > 0;

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!expanded) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? options.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      onSelect(options[activeIndex]);
    } else if (e.key === 'Escape' && activeIndex >= 0) {
      e.preventDefault();
      setActiveIndex(-1);
    }
  }

  return (
    <div className="space-y-3">
      <Input
        autoFocus
        role="combobox"
        aria-label="Search products"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
        placeholder="Search hojicha or matcha by name or brand…"
        value={query}
        onChange={(e) => {
          setActiveIndex(-1);
          onQueryChange(e.target.value);
        }}
        onKeyDown={handleKeyDown}
      />

      {isFetching && (
        <p className="text-muted-foreground text-sm" aria-live="polite">
          Searching…
        </p>
      )}

      <ul
        id={listboxId}
        role="listbox"
        aria-label="Matching products"
        className={cn('divide-border divide-y rounded-md border', !expanded && 'hidden')}
      >
        {options.map((product, index) => (
          <li
            key={product.id}
            id={`${listboxId}-${index}`}
            role="option"
            aria-selected={index === activeIndex}
            onClick={() => onSelect(product)}
            onMouseEnter={() => setActiveIndex(index)}
            className={cn(
              'flex cursor-pointer items-center justify-between gap-2 px-3 py-2',
              index === activeIndex && 'bg-muted'
            )}
          >
            <span className="flex flex-col">
              <span className="font-medium">{product.name}</span>
              {product.brand && (
                <span className="text-muted-foreground text-sm">{product.brand}</span>
              )}
            </span>
            <CategoryBadge category={product.category} />
          </li>
        ))}
      </ul>

      {!isFetching && searchable && options.length === 0 && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-dashed p-3">
          <span className="text-muted-foreground text-sm">
            {isError ? 'Search is unavailable right now.' : <>No match for &ldquo;{query}&rdquo;</>}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={onAddNew}>
            Add as new product
          </Button>
        </div>
      )}
    </div>
  );
}
