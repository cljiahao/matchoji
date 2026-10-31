// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import HomeLoading from './(public)/loading';
import AuthErrorPage from './auth/error/page';
import GlobalError from './error';

vi.mock('@/lib/errors/error-log-handler', () => ({ logError: vi.fn() }));

describe('standalone error pages', () => {
  it('give the global error boundary a main landmark and one h1', () => {
    render(
      <GlobalError error={Object.assign(new Error('x'), { digest: 'abc' })} reset={vi.fn()} />
    );
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Something went wrong' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('give the sign-in failure page a main landmark and one h1', () => {
    render(<AuthErrorPage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Sign-in failed' })).toBeInTheDocument();
  });

  it('announce the loading skeleton as a busy status', () => {
    render(<HomeLoading />);
    expect(screen.getByRole('status', { name: 'Loading' })).toHaveAttribute('aria-busy', 'true');
  });
});
