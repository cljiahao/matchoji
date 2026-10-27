import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BackLink } from '@/components/widgets';
import {
  COURSES,
  LessonCompleteButton,
  courseHref,
  findLesson,
  findRecipe,
  lessonHref,
  recipeHref,
} from '@/features/learn';
import { cn } from '@/lib/utils';

// Same 40px hit area as BackLink, so the three navigation links on a lesson read as a set.
const LESSON_LINK = 'inline-flex min-h-10 items-center gap-1 py-2 font-semibold hover:underline';

interface LessonPageProps {
  params: Promise<{ course: string; lesson: string }>;
}

export function generateStaticParams() {
  return COURSES.flatMap((course) =>
    course.lessons.map((lesson) => ({ course: course.slug, lesson: lesson.slug }))
  );
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { course, lesson } = await params;
  const found = findLesson(course, lesson);
  if (!found) return { title: 'Lesson not found', robots: { index: false } };
  return { title: `${found.lesson.title} · ${found.course.title}` };
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { course: courseSlug, lesson: lessonSlug } = await params;
  const found = findLesson(courseSlug, lessonSlug);
  if (!found) notFound();
  const { course, lesson, index } = found;
  const previous = course.lessons[index - 1];
  const next = course.lessons[index + 1];
  const recipe = lesson.practice ? findRecipe(lesson.practice.recipeSlug) : undefined;

  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-10 sm:py-14">
      <BackLink href={courseHref(course.slug)} label={course.title} />
      <p className="text-brand mt-3 text-sm font-semibold">
        Lesson {index + 1} of {course.lessons.length} · {lesson.minutes} min
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{lesson.title}</h1>

      {lesson.sections.map((section) => (
        <section key={section.heading} className="mt-8">
          <h2 className="text-xl font-bold tracking-tight">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mt-3 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </section>
      ))}

      {lesson.practice && recipe && (
        <section aria-labelledby="practice-heading" className="bg-muted mt-8 rounded-2xl px-5 py-4">
          <h2 id="practice-heading" className="font-bold tracking-tight">
            Practice
          </h2>
          <p className="mt-1">{lesson.practice.prompt}</p>
          <Link
            href={recipeHref(recipe.slug)}
            className="mt-2 inline-block text-sm font-semibold underline underline-offset-2"
          >
            Open the {recipe.title.toLowerCase()} recipe
          </Link>
        </section>
      )}

      <div className="mt-8">
        <LessonCompleteButton courseSlug={course.slug} lessonSlug={lesson.slug} />
      </div>

      <nav
        aria-label="Lessons"
        className="border-border mt-10 flex justify-between gap-4 border-t pt-4 text-sm"
      >
        {previous ? (
          <Link
            href={lessonHref(course.slug, previous.slug)}
            className={cn(LESSON_LINK, 'text-muted-foreground hover:text-foreground')}
          >
            <ChevronLeft aria-hidden="true" className="size-4 shrink-0" />
            {previous.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={lessonHref(course.slug, next.slug)}
            className={cn(LESSON_LINK, 'text-foreground ml-auto text-right')}
          >
            Next: {next.title}
            <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
          </Link>
        ) : (
          <Link
            href={courseHref(course.slug)}
            className={cn(LESSON_LINK, 'text-foreground ml-auto text-right')}
          >
            Back to the course
            <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
          </Link>
        )}
      </nav>
    </article>
  );
}
