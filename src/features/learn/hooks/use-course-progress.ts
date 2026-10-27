'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useSession, useSignInPrompt } from '@/features/auth';
import { createClient } from '@/integrations/supabase/client';

import { listCompletedLessons, markLessonDone, unmarkLesson } from '../api/progress-service';

const EMPTY: string[] = [];

// One cache entry per course, so the lesson list and a lesson's button agree without a refetch.
export function useCourseProgress(courseSlug: string) {
  const { session, isLoading: sessionLoading } = useSession();
  const promptSignIn = useSignInPrompt();
  const queryClient = useQueryClient();
  const userId = session?.user.id;
  const key = ['lesson-progress', userId, courseSlug];

  const query = useQuery({
    queryKey: key,
    queryFn: () => listCompletedLessons(createClient(), courseSlug),
    enabled: Boolean(userId),
  });
  const done = query.data ?? EMPTY;

  const mutation = useMutation({
    mutationFn: ({ lessonSlug, complete }: { lessonSlug: string; complete: boolean }) =>
      complete
        ? markLessonDone(createClient(), courseSlug, lessonSlug)
        : unmarkLesson(createClient(), courseSlug, lessonSlug),
    onMutate: async ({ lessonSlug, complete }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<string[]>(key) ?? [];
      queryClient.setQueryData<string[]>(key, (current = []) =>
        complete
          ? [...new Set([...current, lessonSlug])]
          : current.filter((slug) => slug !== lessonSlug)
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(key, context?.previous ?? []);
      toast.error('Could not save your progress. Try again.');
    },
  });

  function toggle(lessonSlug: string) {
    if (sessionLoading) return;
    if (!userId) {
      promptSignIn({ reason: 'Sign in to keep track of the lessons you finish.' });
      return;
    }
    mutation.mutate({ lessonSlug, complete: !done.includes(lessonSlug) });
  }

  return { done, signedIn: Boolean(userId), toggle };
}
