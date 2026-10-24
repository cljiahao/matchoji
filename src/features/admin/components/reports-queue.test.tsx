// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import { renderWithQuery } from '../../../../test/support/render';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => supabase.current }));
const router = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

import { ReportsQueue } from './reports-queue';

const report = {
  id: 'rep1-abcdef',
  targetType: 'review' as const,
  targetId: 'r1',
  reason: 'Not about tea',
  createdAt: 'x',
  reporterName: 'Aiko',
  content: { text: '1★ buy my stuff', authorName: 'Spammy', productId: 'p1' },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ReportsQueue', () => {
  it('removes reported content with the reason the reporter sees', async () => {
    const fake = createFakeSupabase({ 'rpc:resolve_report': { data: null, error: null } });
    supabase.current = fake.client;
    renderWithQuery(<ReportsQueue reports={[report]} />);

    expect(screen.getByRole('link', { name: 'View tea' })).toHaveAttribute('href', '/products/p1');
    await userEvent.type(screen.getByPlaceholderText('Reason the reporter will see'), 'Spam');
    await userEvent.click(screen.getByRole('button', { name: 'Remove review' }));

    await waitFor(() => expect(router.refresh).toHaveBeenCalled());
    expect(fake.calls[0].args).toEqual([
      { report: 'rep1-abcdef', decision: 'removed', note: 'Spam' },
    ]);
  });

  it('says when nothing is reported, and when content is already gone', () => {
    const { rerender } = renderWithQuery(<ReportsQueue reports={[]} />);
    expect(screen.getByText('Nothing reported.')).toBeInTheDocument();
    rerender(<ReportsQueue reports={[{ ...report, content: null }]} />);
    expect(screen.getByText('Already removed by its author.')).toBeInTheDocument();
  });
});
