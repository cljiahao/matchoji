import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { COURSES, CourseLessonList, courseMinutes, findCourse } from '@/features/learn';
import { PAGE_ROUTES } from '@/lib/constants/routes';

interface CoursePageProps {
  params: Promise<{ course: string }>;
}

export function generateStaticParams() {
  return COURSES.map((course) => ({ course: course.slug }));
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const course = findCourse((await params).course);
  if (!course) return { title: 'Course not found', robots: { index: false } };
  return { title: course.title, description: course.summary };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const course = findCourse((await params).course);
  if (!course) notFound();

  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-10 sm:py-14">
      <Link href={PAGE_ROUTES.LEARN} className="text-muted-foreground text-sm hover:underline">
        ← Learn
      </Link>
      <p className="text-brand mt-3 text-sm font-semibold">
        {course.level} · {course.lessons.length} lessons · about {courseMinutes(course)} min
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{course.title}</h1>
      <p className="text-muted-foreground mt-2">{course.summary}</p>
      <section aria-labelledby="lessons-heading" className="mt-8">
        <h2 id="lessons-heading" className="text-lg font-bold tracking-tight">
          Lessons
        </h2>
        <CourseLessonList course={course} />
      </section>
    </article>
  );
}
