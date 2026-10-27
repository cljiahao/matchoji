import type { Metadata } from 'next';
import Link from 'next/link';

import { COURSES, CourseCard, GUIDES, RECIPES, RecipeCard, guideHref } from '@/features/learn';

export const metadata: Metadata = {
  title: 'Learn',
  description: 'Courses, recipes and guides for making matcha and hojicha at home.',
};

export default function LearnPage() {
  return (
    <div className="max-w-site mx-auto w-full px-6 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Learn</h1>
      <p className="text-muted-foreground mt-2 max-w-xl">
        How to make matcha and hojicha at home, and what to look for when you buy them. Each recipe
        gives a starting dose, water and temperature you can log your tastings against.
      </p>

      <section aria-labelledby="courses-heading" className="mt-10">
        <h2 id="courses-heading" className="text-xl font-bold tracking-tight">
          Courses
        </h2>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {COURSES.map((course) => (
            <li key={course.slug}>
              <CourseCard course={course} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="recipes-heading" className="mt-12">
        <h2 id="recipes-heading" className="text-xl font-bold tracking-tight">
          Recipes
        </h2>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RECIPES.map((recipe) => (
            <li key={recipe.slug}>
              <RecipeCard recipe={recipe} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="guides-heading" className="mt-12">
        <h2 id="guides-heading" className="text-xl font-bold tracking-tight">
          Guides
        </h2>
        <ul className="divide-border mt-4 divide-y border-y">
          {GUIDES.map((guide) => (
            <li key={guide.slug}>
              <Link
                href={guideHref(guide.slug)}
                className="hover:bg-muted/50 -mx-2 flex flex-col rounded-lg px-2 py-4 transition-colors"
              >
                <span className="font-bold tracking-tight">{guide.title}</span>
                <span className="text-muted-foreground mt-0.5 text-sm">{guide.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
