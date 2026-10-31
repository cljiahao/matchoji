// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeBrowserClient, makeSession } from '../../../../test/support/fake-browser-client';
import { renderWithQuery } from '../../../../test/support/render';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => supabase.current }));
const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

import { SessionProvider, SignInPromptProvider } from '@/features/auth';

import { findCourse } from '../content/courses';
import { CourseCard } from './course-card';
import { CourseLessonList } from './course-lesson-list';
import { LessonCompleteButton } from './lesson-complete-button';

const course = findCourse('matcha-101')!;

function setup(ui: React.ReactElement, options: Parameters<typeof createFakeBrowserClient>[0]) {
  const fake = createFakeBrowserClient(options);
  supabase.current = fake.client;
  renderWithQuery(
    <SessionProvider>
      <SignInPromptProvider>{ui}</SignInPromptProvider>
    </SessionProvider>
  );
  return fake;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CourseCard', () => {
  it('links the course with its level, lesson count and length', () => {
    renderWithQuery(<CourseCard course={course} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/learn/courses/matcha-101');
    expect(link).toHaveTextContent('Beginner');
    expect(link).toHaveTextContent('5 lessons · about 24 min');
  });
});

describe('CourseLessonList', () => {
  it('ticks a signed-in learner’s finished lessons and counts them', async () => {
    setup(<CourseLessonList course={course} />, {
      session: makeSession(),
      results: { lesson_progress: { data: [{ lesson_slug: 'tools-and-setup' }], error: null } },
    });
    expect(await screen.findByText('1 of 5 lessons done')).toBeInTheDocument();
    const second = screen.getByRole('link', { name: /Tools and setup/ });
    expect(second).toHaveAttribute('href', '/learn/courses/matcha-101/tools-and-setup');
    expect(screen.getByRole('img', { name: 'Done' })).toBeInTheDocument();
  });

  it('shows the plain outline to a visitor', async () => {
    setup(<CourseLessonList course={course} />, {});
    expect(await screen.findAllByRole('link')).toHaveLength(5);
    expect(screen.queryByText(/lessons done/)).not.toBeInTheDocument();
  });
});

describe('LessonCompleteButton', () => {
  it('marks the lesson done and can undo it', async () => {
    const fake = setup(
      <LessonCompleteButton courseSlug="matcha-101" lessonSlug="tools-and-setup" />,
      {
        session: makeSession(),
        results: {
          lesson_progress: [
            { data: [], error: null },
            { data: null, error: null },
            { data: null, error: null },
          ],
        },
      }
    );
    const button = await screen.findByRole('button', { name: 'Mark lesson as done' });
    await waitFor(() => expect(fake.calls.some((c) => c.method === 'select')).toBe(true));
    await userEvent.click(button);
    expect(await screen.findByRole('button', { name: 'Lesson done' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await waitFor(() =>
      expect(fake.calls).toContainEqual({
        table: 'lesson_progress',
        method: 'insert',
        args: [{ course_slug: 'matcha-101', lesson_slug: 'tools-and-setup' }],
      })
    );
    await userEvent.click(screen.getByRole('button', { name: 'Lesson done' }));
    expect(await screen.findByRole('button', { name: 'Mark lesson as done' })).toBeInTheDocument();
  });

  it('rolls back and says so when saving fails', async () => {
    setup(<LessonCompleteButton courseSlug="matcha-101" lessonSlug="tools-and-setup" />, {
      session: makeSession(),
      results: {
        lesson_progress: [
          { data: [], error: null },
          { data: null, error: { code: '42501', message: 'denied' } },
        ],
      },
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Mark lesson as done' }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Could not save your progress. Try again.')
    );
    expect(screen.getByRole('button', { name: 'Mark lesson as done' })).toBeInTheDocument();
  });

  it('asks a visitor to sign in', async () => {
    setup(<LessonCompleteButton courseSlug="matcha-101" lessonSlug="tools-and-setup" />, {});
    await userEvent.click(await screen.findByRole('button', { name: 'Mark lesson as done' }));
    expect(
      await screen.findByText('Sign in to keep track of the lessons you finish.')
    ).toBeInTheDocument();
  });
});
