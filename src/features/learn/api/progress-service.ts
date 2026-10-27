import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/integrations/supabase/database.types';

type Client = SupabaseClient<Database>;

// The learner's finished lessons in one course; row-level security limits it to their own.
export async function listCompletedLessons(
  supabase: Client,
  courseSlug: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('lesson_slug')
    .eq('course_slug', courseSlug);
  if (error) throw error;
  return data.map((row) => row.lesson_slug);
}

export async function markLessonDone(supabase: Client, courseSlug: string, lessonSlug: string) {
  const { error } = await supabase
    .from('lesson_progress')
    .insert({ course_slug: courseSlug, lesson_slug: lessonSlug });
  // Already done (a double tap or a second tab) is not a failure.
  if (error && error.code !== '23505') throw error;
}

export async function unmarkLesson(supabase: Client, courseSlug: string, lessonSlug: string) {
  const { error } = await supabase
    .from('lesson_progress')
    .delete()
    .eq('course_slug', courseSlug)
    .eq('lesson_slug', lessonSlug);
  if (error) throw error;
}
