// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { YearShareButton } from './year-share-button';

afterEach(() => {
  Reflect.deleteProperty(navigator, 'share');
  vi.restoreAllMocks();
});

describe('YearShareButton', () => {
  it('opens the Web Share sheet with the absolute public link', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    render(<YearShareButton path="/u/abc/year/2026" title="My 2026 in tea" />);

    await userEvent.click(screen.getByRole('button', { name: 'Share your year' }));

    expect(share).toHaveBeenCalledWith({
      title: 'My 2026 in tea',
      url: `${window.location.origin}/u/abc/year/2026`,
    });
  });

  it('copies the link when the browser cannot share, and says so', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<YearShareButton path="/u/abc/year/2026" title="My 2026 in tea" />);

    await userEvent.click(screen.getByRole('button', { name: 'Share your year' }));

    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/u/abc/year/2026`);
    expect(await screen.findByRole('status')).toHaveTextContent('Link copied');
  });

  it('stays quiet when the share sheet is dismissed', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('dismissed', 'AbortError'));
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    render(<YearShareButton path="/u/abc/year/2026" title="t" />);
    await userEvent.click(screen.getByRole('button', { name: 'Share your year' }));
    expect(screen.getByRole('status')).toHaveTextContent('');
  });
});
