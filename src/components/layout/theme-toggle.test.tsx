// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'next-themes';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { ThemeToggle } from './theme-toggle';

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
});

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = '';
});

function renderToggle() {
  return render(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <ThemeToggle />
    </ThemeProvider>
  );
}

describe('ThemeToggle', () => {
  it('offers Light, Dark and System as a named radio group', () => {
    renderToggle();
    expect(screen.getByRole('group', { name: 'Theme' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio').map((r) => r.closest('label')?.textContent)).toEqual([
      'Light',
      'Dark',
      'System',
    ]);
    for (const name of ['Light', 'Dark', 'System']) {
      expect(screen.getByRole('radio', { name })).toBeInTheDocument();
    }
  });

  it('starts on Light', () => {
    renderToggle();
    expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked();
  });

  it('sets the theme class when an option is chosen', async () => {
    renderToggle();
    await userEvent.click(screen.getByRole('radio', { name: 'Dark' }));
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('theme')).toBe('dark');

    await userEvent.click(screen.getByRole('radio', { name: 'Light' }));
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('stores System so the choice follows the device', async () => {
    renderToggle();
    await userEvent.click(screen.getByRole('radio', { name: 'System' }));
    expect(localStorage.getItem('theme')).toBe('system');
  });

  it('keeps every option at least 44px tall on phones', () => {
    renderToggle();
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio.closest('label')).toHaveClass('min-h-11', 'min-w-11');
    }
  });
});
