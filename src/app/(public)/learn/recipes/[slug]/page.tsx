import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BrewFacts, LogRecipeButton, RECIPES, findRecipe } from '@/features/learn';
import { CATEGORY_STYLES, discoverHref } from '@/features/products';
import { PAGE_ROUTES } from '@/lib/constants/routes';

interface RecipePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return RECIPES.map((recipe) => ({ slug: recipe.slug }));
}

export async function generateMetadata({ params }: RecipePageProps): Promise<Metadata> {
  const recipe = findRecipe((await params).slug);
  if (!recipe) return { title: 'Recipe not found', robots: { index: false } };
  return { title: recipe.title, description: recipe.summary };
}

export default async function RecipePage({ params }: RecipePageProps) {
  const recipe = findRecipe((await params).slug);
  if (!recipe) notFound();
  const category = CATEGORY_STYLES[recipe.category];

  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-10 sm:py-14">
      <Link href={PAGE_ROUTES.LEARN} className="text-muted-foreground text-sm hover:underline">
        ← Learn
      </Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{recipe.title}</h1>
      <p className="text-muted-foreground mt-2">{recipe.summary}</p>

      <div className="mt-6">
        <BrewFacts recipe={recipe} />
      </div>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <section aria-labelledby="ingredients-heading">
          <h2 id="ingredients-heading" className="text-lg font-bold tracking-tight">
            You need
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {recipe.ingredients.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="tools-heading">
          <h2 id="tools-heading" className="text-lg font-bold tracking-tight">
            Tools
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {recipe.tools.map((tool) => (
              <li key={tool}>{tool}</li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="steps-heading" className="mt-8">
        <h2 id="steps-heading" className="text-lg font-bold tracking-tight">
          Steps
        </h2>
        <ol className="mt-2 list-decimal space-y-2 pl-5">
          {recipe.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="tips-heading" className="bg-muted mt-8 rounded-2xl px-5 py-4">
        <h2 id="tips-heading" className="font-bold tracking-tight">
          Adjusting it
        </h2>
        <ul className="mt-2 space-y-1.5 text-sm">
          {recipe.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <LogRecipeButton recipe={recipe} />
        <Link
          href={discoverHref({ sort: 'top' }, { category: recipe.category })}
          className="text-sm font-semibold underline underline-offset-2"
        >
          Top-rated {category.label.toLowerCase()}
        </Link>
      </div>
    </article>
  );
}
