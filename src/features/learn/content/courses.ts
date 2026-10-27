import type { Course, Lesson } from '../types';

// Short lessons that build on each other, each ending in something to make and log.
export const COURSES: Course[] = [
  {
    slug: 'matcha-101',
    title: 'Matcha 101',
    summary: 'From your first bowl to buying your next tin, in five short lessons.',
    level: 'Beginner',
    lessons: [
      {
        slug: 'what-matcha-is',
        title: 'What matcha is',
        minutes: 4,
        sections: [
          {
            heading: 'Shaded leaves, ground to powder',
            paragraphs: [
              'Matcha is green tea ground into a fine powder. The leaves are shaded for several weeks before harvest, which makes them greener, sweeter and richer in umami than sun-grown tea.',
              'After picking, the leaves are steamed, dried and stripped of stems and veins. That dried leaf is called tencha, and stone-grinding it slowly gives matcha.',
            ],
          },
          {
            heading: 'Why it tastes so different',
            paragraphs: [
              'With most tea you steep the leaves and throw them away. With matcha you whisk the whole leaf into water and drink all of it, so flavour, colour and caffeine all come through more strongly.',
            ],
          },
        ],
      },
      {
        slug: 'tools-and-setup',
        title: 'Tools and setup',
        minutes: 4,
        sections: [
          {
            heading: 'What you need to start',
            paragraphs: [
              'A bamboo whisk (chasen) and a fine sieve make the biggest difference. A wide bowl helps, but any wide mug works to begin with.',
              'Weigh your matcha once or twice so you learn what 2 g looks like on your spoon or scoop. After that you can measure by eye.',
            ],
          },
          {
            heading: 'Water',
            paragraphs: [
              'Use fresh, soft-tasting water. Matcha is usually made with water around 70–80°C: boiling water brings out bitterness. If you have no thermometer, let boiled water rest for a minute or two, or pour it into another cup first to cool it.',
            ],
          },
        ],
      },
      {
        slug: 'first-usucha',
        title: 'Your first usucha',
        minutes: 6,
        sections: [
          {
            heading: 'The everyday bowl',
            paragraphs: [
              'Usucha, thin matcha, is the best way to get to know a tea: 2 g of matcha and about 70 ml of water, whisked into a fine foam.',
              'The whisking is the part that takes practice. Move from the wrist in a quick zigzag, not in circles, and keep the whisk just off the bottom of the bowl.',
            ],
          },
          {
            heading: 'Judging the result',
            paragraphs: [
              'A good bowl has a fine, even foam with no large bubbles, and no lumps at the bottom. If it tastes bitter, try cooler water or a little less powder next time.',
            ],
          },
        ],
        practice: {
          recipeSlug: 'usucha',
          prompt: 'Make an usucha with the recipe and log it, noting how the foam turned out.',
        },
      },
      {
        slug: 'tasting-it',
        title: 'Tasting it properly',
        minutes: 5,
        sections: [
          {
            heading: 'Four things to notice',
            paragraphs: [
              'Sweetness: a natural, rounded sweetness, strongest in shaded, early-harvest tea.',
              'Umami: the savoury, brothy depth that marks good matcha. Bitterness: some is normal; harsh bitterness usually means water too hot or a tea made for lattes. Body: how thick and creamy it feels.',
            ],
          },
          {
            heading: 'Writing it down',
            paragraphs: [
              'The tasting form has a slider for each of these, and flavour notes such as grassy, creamy or nutty. Logging the same tea a few times, made different ways, shows you what you actually like, and it is what Matchoji uses to suggest teas that suit you.',
            ],
          },
        ],
        practice: {
          recipeSlug: 'usucha',
          prompt: 'Make another usucha and log it, this time setting the four taste sliders.',
        },
      },
      {
        slug: 'buying-your-next-tin',
        title: 'Buying your next tin',
        minutes: 5,
        sections: [
          {
            heading: 'Read past the label',
            paragraphs: [
              '"Ceremonial" and "culinary" are sellers’ words, not an official standard. Look for the harvest, the cultivar or the region, and whether the maker suggests the tea for usucha, koicha or lattes.',
            ],
          },
          {
            heading: 'Compare fairly',
            paragraphs: [
              'Tins come in different sizes, so compare the price per gram. On Matchoji each priced tea shows its price per gram and per cup, and whether it is budget, mid-range or premium among teas of its kind.',
              'Buy a small tin you will finish within about a month of opening, and check other tasters’ ratings, paying attention to how they made it.',
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'hojicha-at-home',
    title: 'Hojicha at home',
    summary: 'Roasted green tea: what it is, brewing the leaves, and a café-style latte.',
    level: 'Next steps',
    lessons: [
      {
        slug: 'what-hojicha-is',
        title: 'What hojicha is',
        minutes: 3,
        sections: [
          {
            heading: 'Green tea, roasted',
            paragraphs: [
              'Hojicha is green tea roasted at a high heat, which turns the leaves reddish-brown and gives a toasty, nutty, caramel taste with little bitterness.',
              'Roasting also lowers the caffeine a little, which makes hojicha a popular evening tea. It comes as loose leaves for steeping and as a powder for lattes.',
            ],
          },
        ],
      },
      {
        slug: 'brewing-leaves',
        title: 'Brewing the leaves',
        minutes: 4,
        sections: [
          {
            heading: 'Hot water, short steeps',
            paragraphs: [
              'Unlike matcha, roasted leaves like water just off the boil. Steep briefly, pour out every drop, and steep the same leaves again two or three times.',
            ],
          },
        ],
        practice: {
          recipeSlug: 'steeped-hojicha',
          prompt: 'Brew a pot of hojicha leaves and log it, noting how the second pot compared.',
        },
      },
      {
        slug: 'hojicha-latte',
        title: 'A hojicha latte',
        minutes: 4,
        sections: [
          {
            heading: 'Powder and milk',
            paragraphs: [
              'Hojicha powder whisked with a little hot water, then topped with warm milk, makes a gentle, toasty latte. The roast stands up to milk well, and a little brown sugar brings it out.',
            ],
          },
        ],
        practice: {
          recipeSlug: 'hojicha-latte',
          prompt: 'Make a hojicha latte and log it.',
        },
      },
    ],
  },
];

export function findCourse(slug: string): Course | undefined {
  return COURSES.find((course) => course.slug === slug);
}

export function findLesson(
  courseSlug: string,
  lessonSlug: string
): { course: Course; lesson: Lesson; index: number } | undefined {
  const course = findCourse(courseSlug);
  const index = course?.lessons.findIndex((lesson) => lesson.slug === lessonSlug) ?? -1;
  return course && index >= 0 ? { course, lesson: course.lessons[index], index } : undefined;
}
