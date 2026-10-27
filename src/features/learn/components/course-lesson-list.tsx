'use client';

import { Check } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

import { useCourseProgress } from '../hooks/use-course-progress';
import { lessonHref } from '../lib/hrefs';
import type { Course } from '../types';

// The course outline, ticking the lessons a signed-in learner has finished.
export function CourseLessonList({ course }: { course: Course }) {
  const { done, signedIn } = useCourseProgress(course.slug);
  const finished = course.lessons.filter((lesson) => done.includes(lesson.slug)).length;

  return (
    <div>
      {signedIn && (
        <p className="text-sm font-semibold" aria-live="polite">
          {finished} of {course.lessons.length} lessons done
        </p>
      )}
      <ol className="mt-3 space-y-2">
        {course.lessons.map((lesson, index) => {
          const complete = done.includes(lesson.slug);
          return (
            <li key={lesson.slug}>
              <Link
                href={lessonHref(course.slug, lesson.slug)}
                className="bg-muted hover:bg-muted/70 flex items-center gap-4 rounded-2xl px-4 py-3 transition-colors"
              >
                <span
                  className={cn(
                    'flex-center h-8 w-8 shrink-0 rounded-full text-sm font-bold',
                    complete ? 'bg-brand text-white' : 'bg-background text-muted-foreground'
                  )}
                >
                  {complete ? <Check aria-label="Done" className="h-4 w-4" /> : index + 1}
                </span>
                <span className="flex-1 font-semibold">{lesson.title}</span>
                <span className="text-muted-foreground text-sm">{lesson.minutes} min</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
