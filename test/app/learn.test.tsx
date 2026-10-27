// @vitest-environment jsdom
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeBrowserClient } from '../support/fake-browser-client';
import { renderWithQuery } from '../support/render';

const browser = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => browser.current }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => '/learn',
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

import LessonPage, {
  generateMetadata as lessonMetadata,
  generateStaticParams as lessonParams,
} from '@/app/(public)/learn/courses/[course]/[lesson]/page';
import CoursePage, {
  generateMetadata as courseMetadata,
  generateStaticParams as courseParams,
} from '@/app/(public)/learn/courses/[course]/page';
import GuidePage, {
  generateMetadata as guideMetadata,
  generateStaticParams as guideParams,
} from '@/app/(public)/learn/guides/[slug]/page';
import LearnPage from '@/app/(public)/learn/page';
import RecipePage, {
  generateMetadata as recipeMetadata,
  generateStaticParams as recipeParams,
} from '@/app/(public)/learn/recipes/[slug]/page';
import { SessionProvider, SignInPromptProvider } from '@/features/auth';
import { COURSES, GUIDES, RECIPES } from '@/features/learn';

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

beforeEach(() => {
  browser.current = createFakeBrowserClient().client;
});

describe('Learn page', () => {
  it('lists every course, every recipe with its brew numbers, and every guide', () => {
    renderWithQuery(<LearnPage />);

    const courses = within(screen.getByRole('region', { name: 'Courses' }));
    expect(courses.getAllByRole('link')).toHaveLength(COURSES.length);
    expect(courses.getByRole('link', { name: /Matcha 101/ })).toHaveAttribute(
      'href',
      '/learn/courses/matcha-101'
    );

    const recipes = within(screen.getByRole('region', { name: 'Recipes' }));
    expect(recipes.getAllByRole('link')).toHaveLength(RECIPES.length);
    expect(recipes.getByRole('link', { name: /Usucha \(thin matcha\)/ })).toHaveAttribute(
      'href',
      '/learn/recipes/usucha'
    );
    expect(recipes.getByRole('link', { name: /Matcha latte/ })).toHaveTextContent(
      '2 g · 40 ml · 80°C · 150 ml milk'
    );

    const guides = within(screen.getByRole('region', { name: 'Guides' }));
    expect(guides.getAllByRole('link')).toHaveLength(GUIDES.length);
    expect(guides.getByRole('link', { name: /Keeping matcha fresh/ })).toHaveAttribute(
      'href',
      '/learn/guides/storing-matcha'
    );
  });
});

describe('Recipe page', () => {
  it('shows the brew numbers, steps and tips, and links to top-rated teas', async () => {
    renderWithQuery(
      <SignInPromptProvider>{await RecipePage(params('koicha'))}</SignInPromptProvider>
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Koicha (thick matcha)');
    expect(screen.getByText('Tea').nextSibling).toHaveTextContent('4 g');
    expect(screen.getByText('Water').nextSibling).toHaveTextContent('30 ml');
    expect(screen.getByText('Temperature').nextSibling).toHaveTextContent('80°C');
    expect(screen.queryByText('Milk')).not.toBeInTheDocument();
    const steps = within(screen.getByRole('region', { name: 'Steps' })).getAllByRole('listitem');
    expect(steps).toHaveLength(RECIPES.find((r) => r.slug === 'koicha')?.steps.length ?? 0);
    expect(steps[3]).toHaveTextContent(/^Knead slowly/);
    expect(screen.getByRole('region', { name: 'Adjusting it' })).toHaveTextContent('koicha');
    expect(screen.getByRole('link', { name: 'Top-rated matcha' })).toHaveAttribute(
      'href',
      '/explore?category=matcha'
    );
  });

  it('asks a signed-out visitor to sign in before logging with the recipe', async () => {
    renderWithQuery(
      <SignInPromptProvider>{await RecipePage(params('usucha'))}</SignInPromptProvider>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Log a tasting with this recipe' }));
    expect(
      await screen.findByText('Sign in to log and rate the teas you try.')
    ).toBeInTheDocument();
  });

  it('is 404 for an unknown recipe, and builds a page per recipe', async () => {
    await expect(RecipePage(params('nope'))).rejects.toThrow('NEXT_NOT_FOUND');
    expect(await recipeMetadata(params('nope'))).toMatchObject({ robots: { index: false } });
    expect(await recipeMetadata(params('usucha'))).toMatchObject({
      title: 'Usucha (thin matcha)',
    });
    expect(recipeParams()).toEqual(RECIPES.map((r) => ({ slug: r.slug })));
  });
});

describe('Guide page', () => {
  it('shows the sections and related links', async () => {
    renderWithQuery(await GuidePage(params('why-matcha-is-scarce')));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Why good matcha keeps selling out'
    );
    expect(screen.getByRole('heading', { name: 'Matcha starts as tencha' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See the harvest numbers' })).toHaveAttribute(
      'href',
      '/regions/supply'
    );
  });

  it('is 404 for an unknown guide, and builds a page per guide', async () => {
    await expect(GuidePage(params('nope'))).rejects.toThrow('NEXT_NOT_FOUND');
    expect(await guideMetadata(params('nope'))).toMatchObject({ robots: { index: false } });
    expect(await guideMetadata(params('matcha-tools'))).toMatchObject({
      description: expect.stringContaining('whisk'),
    });
    expect(guideParams()).toEqual(GUIDES.map((g) => ({ slug: g.slug })));
  });
});

const withProviders = (ui: React.ReactElement) =>
  renderWithQuery(
    <SessionProvider>
      <SignInPromptProvider>{ui}</SignInPromptProvider>
    </SessionProvider>
  );
const courseParam = (course: string) => ({ params: Promise.resolve({ course }) });
const lessonParam = (course: string, lesson: string) => ({
  params: Promise.resolve({ course, lesson }),
});

describe('Course page', () => {
  it('shows the course and links every lesson in order', async () => {
    withProviders(await CoursePage(courseParam('hojicha-at-home')));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hojicha at home');
    expect(screen.getByText(/Next steps · 3 lessons · about 11 min/)).toBeInTheDocument();
    const lessons = within(screen.getByRole('region', { name: 'Lessons' })).getAllByRole('link');
    expect(lessons.map((l) => l.getAttribute('href'))).toEqual([
      '/learn/courses/hojicha-at-home/what-hojicha-is',
      '/learn/courses/hojicha-at-home/brewing-leaves',
      '/learn/courses/hojicha-at-home/hojicha-latte',
    ]);
  });

  it('is 404 for an unknown course, and builds a page per course', async () => {
    await expect(CoursePage(courseParam('nope'))).rejects.toThrow('NEXT_NOT_FOUND');
    expect(await courseMetadata(courseParam('nope'))).toMatchObject({ robots: { index: false } });
    expect(await courseMetadata(courseParam('matcha-101'))).toMatchObject({
      title: 'Matcha 101',
    });
    expect(courseParams()).toEqual(COURSES.map((c) => ({ course: c.slug })));
  });
});

describe('Lesson page', () => {
  it('shows the lesson, its practice recipe, the done button and the next lesson', async () => {
    withProviders(await LessonPage(lessonParam('matcha-101', 'first-usucha')));
    expect(screen.getByText('Lesson 3 of 5 · 6 min')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Your first usucha');
    expect(
      within(screen.getByRole('region', { name: 'Practice' })).getByRole('link')
    ).toHaveAttribute('href', '/learn/recipes/usucha');
    expect(screen.getByRole('button', { name: 'Mark lesson as done' })).toBeInTheDocument();
    const nav = within(screen.getByRole('navigation', { name: 'Lessons' }));
    expect(nav.getByRole('link', { name: /Tools and setup/ })).toHaveAttribute(
      'href',
      '/learn/courses/matcha-101/tools-and-setup'
    );
    expect(nav.getByRole('link', { name: /Next: Tasting it properly/ })).toHaveAttribute(
      'href',
      '/learn/courses/matcha-101/tasting-it'
    );
  });

  it('ends the course with a link back, and has no practice where none is set', async () => {
    withProviders(await LessonPage(lessonParam('matcha-101', 'buying-your-next-tin')));
    expect(screen.queryByRole('region', { name: 'Practice' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the course' })).toHaveAttribute(
      'href',
      '/learn/courses/matcha-101'
    );
  });

  it('is 404 for an unknown lesson, and builds a page per lesson', async () => {
    await expect(LessonPage(lessonParam('matcha-101', 'nope'))).rejects.toThrow('NEXT_NOT_FOUND');
    expect(await lessonMetadata(lessonParam('nope', 'x'))).toMatchObject({
      robots: { index: false },
    });
    expect(await lessonMetadata(lessonParam('matcha-101', 'tools-and-setup'))).toMatchObject({
      title: 'Tools and setup · Matcha 101',
    });
    expect(lessonParams()).toHaveLength(8);
  });
});
