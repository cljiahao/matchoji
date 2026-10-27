import Link from 'next/link';

import { courseHref } from '../lib/hrefs';
import type { Course } from '../types';

export function courseMinutes(course: Course): number {
  return course.lessons.reduce((total, lesson) => total + lesson.minutes, 0);
}

export function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={courseHref(course.slug)}
      className="bg-brand/10 hover:bg-brand/15 flex h-full flex-col rounded-2xl px-5 py-4 transition-colors"
    >
      <span className="text-brand text-sm font-semibold">{course.level}</span>
      <span className="mt-1 text-lg font-bold tracking-tight">{course.title}</span>
      <span className="text-muted-foreground mt-1 text-sm">{course.summary}</span>
      <span className="mt-3 text-sm font-semibold">
        {course.lessons.length} lessons · about {courseMinutes(course)} min
      </span>
    </Link>
  );
}
