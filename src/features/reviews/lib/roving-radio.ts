import type { KeyboardEvent } from 'react';

// WAI-ARIA radiogroup keyboard pattern for button-based radios: the group is one tab stop,
// arrows move focus and selection together, and they wrap at the ends.
export function radioTabIndex(index: number, selectedIndex: number): 0 | -1 {
  const focusable = selectedIndex >= 0 ? selectedIndex : 0;
  return index === focusable ? 0 : -1;
}

export function handleRadioKeyDown(
  event: KeyboardEvent<HTMLElement>,
  index: number,
  count: number,
  select: (index: number) => void
): void {
  const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
  if (delta === undefined) return;
  event.preventDefault();
  const next = (index + delta + count) % count;
  const group = event.currentTarget.parentElement;
  const target = group?.querySelectorAll<HTMLElement>('[role="radio"]')[next];
  target?.focus();
  select(next);
}
