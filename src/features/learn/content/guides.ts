import { PAGE_ROUTES } from '@/lib/constants/routes';

import { recipeHref } from '../lib/hrefs';
import type { Guide } from '../types';

export const GUIDES: Guide[] = [
  {
    slug: 'matcha-grades',
    title: 'Matcha grades, explained',
    summary:
      'What "ceremonial", "premium" and "culinary" really tell you, and what to look at instead.',
    sections: [
      {
        heading: 'The labels are marketing, not a standard',
        paragraphs: [
          'There is no official grading of matcha in Japan. "Ceremonial", "premium", "barista" and "culinary" are words sellers choose, so two teas with the same label can be very different.',
          'What matters more is how the tea was grown and processed: how long the plants were shaded, which harvest the leaves came from, and how finely the tencha (the dried leaf) was stone-ground.',
        ],
      },
      {
        heading: 'Signs of a matcha for drinking straight',
        paragraphs: [
          'A bright, vivid green rather than a dull or yellowish one, a sweet grassy smell, and a silky powder that clings together when pressed.',
          'Makers who name the first harvest (ichibancha), the cultivar, or the region are usually selling a tea meant to be drunk as usucha or koicha.',
        ],
      },
      {
        heading: 'Usucha, koicha and lattes',
        paragraphs: [
          'Most matcha is made for usucha, the thin, frothy bowl. Only the smoothest teas suit koicha, which uses twice the powder; makers say when a tea is good for it.',
          'For lattes and baking a bolder, more astringent matcha holds up better against milk and sugar, and costs less.',
        ],
      },
      {
        heading: 'Use the ratings',
        paragraphs: [
          'On Matchoji the grade a maker gives is shown on each tea, alongside how tasters rated it and how they made it. A high rating as a latte says less about a tea as usucha, so check the prep line on each tasting.',
        ],
      },
    ],
    related: [
      { label: 'Browse matcha by grade', href: `${PAGE_ROUTES.EXPLORE}?category=matcha` },
      { label: 'Make usucha', href: recipeHref('usucha') },
    ],
  },
  {
    slug: 'matcha-tools',
    title: 'The tools you need (and the ones you don’t)',
    summary: 'A whisk and a sieve make the biggest difference. Here is what each tool does.',
    sections: [
      {
        heading: 'Bamboo whisk (chasen)',
        paragraphs: [
          'The one tool worth buying first. Its fine tines whip air into the tea for a smooth foam that a spoon or fork cannot make. Whisks with around 80–100 tines suit usucha; thicker, sturdier ones are used for koicha.',
          'Soak it in warm water for a minute before using it so the tines bend instead of snapping, rinse it after, and let it dry upright or on a holder.',
        ],
      },
      {
        heading: 'Sieve',
        paragraphs: [
          'Matcha clumps as it sits. Pushing it through a fine tea or kitchen sieve takes ten seconds and is the easiest way to avoid lumps in the bowl.',
        ],
      },
      {
        heading: 'Bowl (chawan)',
        paragraphs: [
          'A wide, flat-bottomed bowl gives the whisk room to move. Any wide mug or cereal bowl works while you are starting out.',
        ],
      },
      {
        heading: 'Scoop (chashaku)',
        paragraphs: [
          'The bamboo scoop holds roughly 1 g of matcha when heaped, so two scoops make an usucha. A teaspoon does the same job: about 2 g level.',
        ],
      },
      {
        heading: 'Milk frother',
        paragraphs: [
          'A cheap handheld frother mixes matcha well enough for lattes and iced drinks, though it will not give usucha its fine foam.',
        ],
      },
    ],
    related: [{ label: 'Make usucha', href: recipeHref('usucha') }],
  },
  {
    slug: 'storing-matcha',
    title: 'Keeping matcha fresh',
    summary: 'Light, air, heat and smells fade matcha fast. A few habits keep it green.',
    sections: [
      {
        heading: 'Why it fades',
        paragraphs: [
          'Matcha is a fine powder with a lot of surface, so air, light and warmth dull its colour and flavour much faster than loose-leaf tea. Stale matcha turns olive-brown and tastes flat or bitter.',
        ],
      },
      {
        heading: 'Before opening',
        paragraphs: [
          'Keep sealed tins or pouches somewhere cool and dark, away from the stove and strong smells. Many makers suggest the fridge.',
        ],
      },
      {
        heading: 'After opening',
        paragraphs: [
          'Close it tightly every time, keep it cool and dark, and try to finish it within about a month.',
          'If you keep it in the fridge, let it reach room temperature before opening so moisture does not condense on the powder.',
        ],
      },
      {
        heading: 'Buy what you will drink',
        paragraphs: [
          'Smaller tins finished quickly taste better than a large one opened for months. Your stash on Matchoji can record when you opened each tin.',
        ],
      },
    ],
    related: [{ label: 'Your journal and stash', href: PAGE_ROUTES.JOURNAL }],
  },
  {
    slug: 'why-matcha-is-scarce',
    title: 'Why good matcha keeps selling out',
    summary: 'Demand has grown far faster than the shaded tea that matcha is made from.',
    sections: [
      {
        heading: 'Matcha starts as tencha',
        paragraphs: [
          'Matcha is ground from tencha: tea grown under shade for weeks before harvest, then steamed, dried and de-veined. Shading, the extra processing and slow stone-grinding mean supply cannot simply be turned up from one season to the next.',
        ],
      },
      {
        heading: 'Demand outran it',
        paragraphs: [
          'Interest in matcha has grown quickly around the world, driven by cafés and social media, and many shops have limited how much each customer can buy or sold out of their best teas.',
          'Growers are shading more fields, but new plantings take years to reach full harvests.',
        ],
      },
      {
        heading: 'What it means for you',
        paragraphs: [
          'Hojicha and less famous regions are often easier to find and better value. Matchoji shows each region’s supply and the official harvest figures, so you can see where it is tight.',
        ],
      },
    ],
    related: [
      { label: 'See the harvest numbers', href: PAGE_ROUTES.SUPPLY },
      { label: 'Regions by scarcity', href: `${PAGE_ROUTES.REGIONS}?sort=scarce` },
    ],
  },
];

export function findGuide(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}
