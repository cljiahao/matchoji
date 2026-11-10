import { NextResponse, type NextRequest } from 'next/server';

import { SlugSchema, cafeHref } from '@/features/cafes';

// Short link for Instagram bios. The café page itself resolves merges, so this never reads the
// database: a stale short link still lands on a page that forwards.
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const parsed = SlugSchema.safeParse(slug);
  if (!parsed.success) return new NextResponse('Not found', { status: 404 });
  return NextResponse.redirect(new URL(cafeHref(parsed.data), request.url), 308);
}
