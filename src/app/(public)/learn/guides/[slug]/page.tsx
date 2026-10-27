import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BackLink } from '@/components/widgets';
import { GUIDES, findGuide } from '@/features/learn';
import { PAGE_ROUTES } from '@/lib/constants/routes';

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const guide = findGuide((await params).slug);
  if (!guide) return { title: 'Guide not found', robots: { index: false } };
  return { title: guide.title, description: guide.summary };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const guide = findGuide((await params).slug);
  if (!guide) notFound();

  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-10 sm:py-14">
      <BackLink href={PAGE_ROUTES.LEARN} label="Learn" />
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{guide.title}</h1>
      <p className="text-muted-foreground mt-2 text-lg">{guide.summary}</p>

      {guide.sections.map((section) => (
        <section key={section.heading} className="mt-8">
          <h2 className="text-xl font-bold tracking-tight">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mt-3 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </section>
      ))}

      {guide.related.length > 0 && (
        <nav aria-label="Related" className="mt-10 flex flex-wrap gap-2">
          {guide.related.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-muted hover:text-foreground text-muted-foreground rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </article>
  );
}
