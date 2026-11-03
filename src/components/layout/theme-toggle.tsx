'use client';

import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';

import { cn } from '@/lib/utils';

const OPTIONS: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
];

const subscribe = () => () => {};

// The server cannot know the stored theme, so nothing is checked until the client has hydrated;
// otherwise the checked radio would differ between the server HTML and the first client render.
function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}

// Native radios inside labels give arrow-key movement and a group name for free.
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <fieldset className={cn('min-w-0', className)}>
      <legend className="text-muted-foreground mb-2 text-sm">Theme</legend>
      <div className="border-input inline-flex rounded-full border p-0.5">
        {OPTIONS.map(({ value, label, Icon }) => (
          <label
            key={value}
            className="has-checked:bg-brand has-checked:text-brand-foreground has-focus-visible:outline-ring flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold has-focus-visible:outline-2 has-focus-visible:outline-offset-2"
          >
            <input
              type="radio"
              name="theme"
              value={value}
              checked={mounted && theme === value}
              onChange={() => setTheme(value)}
              className="sr-only"
            />
            <Icon aria-hidden="true" className="h-4 w-4" />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
