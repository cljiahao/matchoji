'use client';

import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useCourseProgress } from '../hooks/use-course-progress';

export function LessonCompleteButton({
  courseSlug,
  lessonSlug,
}: {
  courseSlug: string;
  lessonSlug: string;
}) {
  const { done, toggle } = useCourseProgress(courseSlug);
  const complete = done.includes(lessonSlug);
  return (
    <Button
      variant={complete ? 'outline' : 'default'}
      aria-pressed={complete}
      onClick={() => toggle(lessonSlug)}
    >
      {complete && <Check aria-hidden="true" />}
      {complete ? 'Lesson done' : 'Mark lesson as done'}
    </Button>
  );
}
