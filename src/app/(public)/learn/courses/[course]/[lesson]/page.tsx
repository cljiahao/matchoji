import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  COURSES,
  LessonCompleteButton,
  courseHref,
  findLesson,
  findRecipe,
  lessonHref,
  recipeHref,
} from '@/features/learn';

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
      <Link
        href={courseHref(course.slug)}
        className="text-muted-foreground text-sm hover:underline"
      >
        ← {course.title}
      </Link>
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
        className="border-border mt-10 flex justify-between gap-4 border-t pt-6 text-sm"
      >
        {previous ? (
          <Link href={lessonHref(course.slug, previous.slug)} className="hover:underline">
            ← {previous.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={lessonHref(course.slug, next.slug)}
            className="text-right font-semibold hover:underline"
          >
            Next: {next.title} →
          </Link>
        ) : (
          <Link href={courseHref(course.slug)} className="text-right font-semibold hover:underline">
            Back to the course
          </Link>
        )}
      </nav>
    </article>
  );
}
