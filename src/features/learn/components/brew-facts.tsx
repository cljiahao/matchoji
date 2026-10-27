import type { Recipe } from '../types';

// The numbers a recipe hinges on, in the order you measure them.
export function brewFacts(recipe: Recipe): { label: string; value: string }[] {
  return [
    { label: 'Tea', value: `${recipe.doseG} g` },
    { label: 'Water', value: `${recipe.waterMl} ml` },
    { label: 'Temperature', value: `${recipe.waterTempC}°C` },
    ...(recipe.milkMl ? [{ label: 'Milk', value: `${recipe.milkMl} ml` }] : []),
    { label: 'Time', value: `${recipe.minutes} min` },
  ];
}

export function BrewFacts({ recipe }: { recipe: Recipe }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {brewFacts(recipe).map((fact) => (
        <div key={fact.label} className="bg-muted rounded-2xl px-4 py-3">
          <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {fact.label}
          </dt>
          <dd className="mt-0.5 text-lg font-bold tracking-tight">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
