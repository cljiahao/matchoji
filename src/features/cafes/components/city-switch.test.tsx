// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const nav = vi.hoisted(() => ({ pathname: '/cafes' }));
vi.mock('next/navigation', () => ({ usePathname: () => nav.pathname }));

import { CITY_COOKIE } from '../lib/city';
import { CitySwitch } from './city-switch';

beforeEach(() => {
  nav.pathname = '/cafes';
  document.cookie = `${CITY_COOKIE}=; path=/; max-age=0`;
});

describe('CitySwitch', () => {
  it('links each city on the current path and marks the chosen one', () => {
    render(<CitySwitch current="johor-bahru" />);
    const singapore = screen.getByRole('link', { name: 'Singapore' });
    const jb = screen.getByRole('link', { name: 'Johor Bahru' });
    expect(singapore).toHaveAttribute('href', '/cafes?city=singapore');
    expect(jb).toHaveAttribute('href', '/cafes?city=johor-bahru');
    expect(jb).toHaveAttribute('aria-current', 'page');
    expect(singapore).not.toHaveAttribute('aria-current');
  });

  it('follows the page it is placed on', () => {
    nav.pathname = '/top';
    render(<CitySwitch current="singapore" />);
    expect(screen.getByRole('link', { name: 'Johor Bahru' })).toHaveAttribute(
      'href',
      '/top?city=johor-bahru'
    );
  });

  it('remembers the clicked city in a cookie', async () => {
    render(<CitySwitch current="singapore" />);
    // jsdom has no navigation; the click handler still runs before the link is followed.
    const jb = screen.getByRole('link', { name: 'Johor Bahru' });
    jb.addEventListener('click', (e) => e.preventDefault());
    await userEvent.click(jb);
    expect(document.cookie).toContain(`${CITY_COOKIE}=johor-bahru`);
  });
});
