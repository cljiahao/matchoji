'use client';

import { useId, useState, type KeyboardEvent, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface SearchOption {
  id: string;
  label: string;
  detail?: string;
}

interface SearchComboboxProps {
  label: string;
  placeholder: string;
  listLabel: string;
  query: string;
  onQueryChange: (query: string) => void;
  options: SearchOption[];
  isSearching: boolean;
  isError: boolean;
  // False while the query is too short to search; the add-new prompt waits until then.
  searchable: boolean;
  onSelect: (id: string) => void;
  addLabel: string;
  onAddNew: () => void;
}

// WAI-ARIA combobox (list autocomplete): focus stays in the input, arrow keys move the active
// option via aria-activedescendant, Enter picks it. Shared by the café and drink searches.
export function SearchCombobox({
  label,
  placeholder,
  listLabel,
  query,
  onQueryChange,
  options,
  isSearching,
  isError,
  searchable,
  onSelect,
  addLabel,
  onAddNew,
}: SearchComboboxProps) {
  const listboxId = useId();
  const [activeIndex, setActiveIndex] = useState(-1);
  const visible = isSearching ? [] : options;
  const expanded = visible.length > 0;
  let emptyMessage: ReactNode = 'Nothing listed yet.';
  if (isError) emptyMessage = 'Search is unavailable right now.';
  else if (query.trim()) emptyMessage = <>No match for &ldquo;{query}&rdquo;</>;

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!expanded) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % visible.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? visible.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      onSelect(visible[activeIndex].id);
    } else if (e.key === 'Escape' && activeIndex >= 0) {
      e.preventDefault();
      setActiveIndex(-1);
    }
  }

  return (
    <div className="space-y-3">
      <Input
        autoFocus
        maxLength={80}
        role="combobox"
        aria-label={label}
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setActiveIndex(-1);
          onQueryChange(e.target.value);
        }}
        onKeyDown={handleKeyDown}
      />

      {isSearching && (
        <p className="text-muted-foreground text-sm" aria-live="polite">
          Searching…
        </p>
      )}

      <ul
        id={listboxId}
        role="listbox"
        aria-label={listLabel}
        className={cn('divide-border divide-y rounded-md border', !expanded && 'hidden')}
      >
        {visible.map((option, index) => (
          <li
            key={option.id}
            id={`${listboxId}-${index}`}
            role="option"
            aria-selected={index === activeIndex}
            onClick={() => onSelect(option.id)}
            onMouseEnter={() => setActiveIndex(index)}
            className={cn(
              'flex min-h-11 cursor-pointer flex-col justify-center px-3 py-2',
              index === activeIndex && 'bg-muted'
            )}
          >
            <span className="font-medium">{option.label}</span>
            {option.detail && (
              <span className="text-muted-foreground text-sm">{option.detail}</span>
            )}
          </li>
        ))}
      </ul>

      {!isSearching && searchable && isError && (
        <p role="alert" className="text-destructive text-sm">
          {emptyMessage}
        </p>
      )}

      {!isSearching && searchable && !isError && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed p-3">
          <span className="text-muted-foreground text-sm">
            {options.length === 0 ? emptyMessage : "Can't find it?"}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={onAddNew}>
            {addLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
