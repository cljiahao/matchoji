import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { TopListRows, findTopList } from '@/features/discovery';
import { listCatalogue } from '@/features/products';
import { createClient } from '@/integrations/supabase/server';

interface TopListPageProps {
  params: Promise<{ slug: string }>;
}

// One read per request, shared by the page and its metadata.
const loadCatalogue = cache(async () => listCatalogue(await createClient()));

export async function generateMetadata({ params }: TopListPageProps): Promise<Metadata> {
  const { slug } = await params;
  const list = findTopList(await loadCatalogue(), slug);
  if (!list) return { title: 'List not found' };
  return { title: list.title, description: list.blurb };
}

export default async function TopListPage({ params }: TopListPageProps) {
  const { slug } = await params;
  const catalogue = await loadCatalogue();
  // A list below its threshold does not exist, so a stale link or a typed slug is not-found.
  const list = findTopList(catalogue, slug);
  if (!list) notFound();

  return (
    <div className="max-w-site mx-auto w-full px-6 py-10 sm:py-14">
      <Link href="/top/teas" className="text-brand text-sm font-semibold hover:underline">
        All tea lists
      </Link>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{list.title}</h1>
      <p className="text-muted-foreground mt-2 max-w-xl">{list.blurb}</p>
      <div className="mt-8">
        <TopListRows list={list} catalogue={catalogue} />
      </div>
    </div>
  );
}
