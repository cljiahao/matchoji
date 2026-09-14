'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="bg-muted relative overflow-hidden rounded-full p-5 transition-colors duration-100"
      aria-label="Toggle theme"
    >
      <span
        className="flex-center absolute inset-0 transition-all duration-200"
        style={{
          opacity: isDark ? 1 : 0,
          transform: isDark ? 'translateY(0)' : 'translateY(-50%)',
        }}
      >
        <Sun className="h-5 w-5" fill="currentColor" />
      </span>
      <span
        className="flex-center absolute inset-0 transition-all duration-200"
        style={{
          opacity: isDark ? 0 : 1,
          transform: isDark ? 'translateY(50%)' : 'translateY(0)',
        }}
      >
        <Moon className="h-5 w-5" fill="currentColor" />
      </span>
    </button>
  );
}
