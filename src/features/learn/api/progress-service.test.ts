import { describe, expect, it } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import { listCompletedLessons, markLessonDone, unmarkLesson } from './progress-service';

describe('progress-service', () => {
  it('lists a course’s finished lessons', async () => {
    const { client, calls } = createFakeSupabase({
      lesson_progress: {
        data: [{ lesson_slug: 'tools' }, { lesson_slug: 'first-usucha' }],
        error: null,
      },
    });
    expect(await listCompletedLessons(client, 'matcha-101')).toEqual(['tools', 'first-usucha']);
    expect(calls).toContainEqual({
      table: 'lesson_progress',
      method: 'eq',
      args: ['course_slug', 'matcha-101'],
    });
  });

  it('marks a lesson done, treating "already done" as success', async () => {
    const { client, calls } = createFakeSupabase({
      lesson_progress: [
        { data: null, error: null },
        { data: null, error: { code: '23505', message: 'duplicate' } },
        { data: null, error: { code: '42501', message: 'denied' } },
      ],
    });
    await markLessonDone(client, 'matcha-101', 'tools');
    expect(calls).toContainEqual({
      table: 'lesson_progress',
      method: 'insert',
      args: [{ course_slug: 'matcha-101', lesson_slug: 'tools' }],
    });
    await markLessonDone(client, 'matcha-101', 'tools');
    await expect(markLessonDone(client, 'matcha-101', 'tools')).rejects.toMatchObject({
      code: '42501',
    });
  });

  it('unmarks a lesson and throws a refusal', async () => {
    const { client, calls } = createFakeSupabase({
      lesson_progress: [
        { data: null, error: null },
        { data: null, error: new Error('down') },
      ],
    });
    await unmarkLesson(client, 'matcha-101', 'tools');
    expect(calls).toContainEqual({
      table: 'lesson_progress',
      method: 'eq',
      args: ['lesson_slug', 'tools'],
    });
    await expect(unmarkLesson(client, 'matcha-101', 'tools')).rejects.toThrow('down');
  });
});
