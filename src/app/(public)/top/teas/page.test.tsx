// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  lists: [] as { slug: string; title: string; blurb: string; teas: unknown[] }[],
}));

vi.mock('next/server', () => ({ connection: vi.fn(async () => undefined) }));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));
vi.mock('@/integrations/supabase/server', () => ({ createClient: async () => ({}) }));
vi.mock('@/features/products', () => ({ listCatalogue: async () => [] }));
vi.mock('@/features/discovery', () => ({
  buildTopLists: () => state.lists,
  findTopList: (_catalogue: unknown, slug: string) => state.lists.find((l) => l.slug === slug),
  TopListCard: ({ list }: { list: { slug: string; title: string } }) => (
    <a href={`/top/teas/${list.slug}`}>{list.title}</a>
  ),
  TopListRows: () => <p>rows</p>,
}));

import TeaListPage, { generateMetadata } from './[slug]/page';
import TeaListsIndex from './page';

const matcha = { slug: 'matcha', title: 'Top matcha', blurb: 'The best matcha.', teas: [] };

beforeEach(() => {
  state.lists = [];
});

describe('/top/teas', () => {
  it('lists the tea lists that exist, linking under /top/teas', async () => {
    state.lists = [matcha];
    render(await TeaListsIndex());
    expect(screen.getByRole('heading', { level: 1, name: 'Top teas at home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Top matcha' })).toHaveAttribute(
      'href',
      '/top/teas/matcha'
    );
    expect(screen.getByRole('link', { name: 'Top drinks' })).toHaveAttribute('href', '/top');
  });

  it('says so when no tea list exists yet', async () => {
    render(await TeaListsIndex());
    expect(screen.getByText(/No tea lists yet/)).toBeInTheDocument();
  });
});

describe('/top/teas/[slug]', () => {
  const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

  it('shows a tea list that exists and links back to the tea lists', async () => {
    state.lists = [matcha];
    render(await TeaListPage(params('matcha')));
    expect(screen.getByRole('heading', { level: 1, name: 'Top matcha' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All tea lists' })).toHaveAttribute(
      'href',
      '/top/teas'
    );
    expect(await generateMetadata(params('matcha'))).toEqual({
      title: 'Top matcha',
      description: 'The best matcha.',
    });
  });

  it('is not found for a list that does not exist', async () => {
    await expect(TeaListPage(params('hojicha'))).rejects.toThrow('NEXT_NOT_FOUND');
    expect(await generateMetadata(params('hojicha'))).toEqual({ title: 'List not found' });
  });
});
