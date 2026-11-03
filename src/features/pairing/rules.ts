import type { PairingRule } from './types';

const IPPODO = 'https://global.ippodo-tea.co.jp';

// Every rule restates a pairing Ippodo itself publishes; a pairing no tea house states is not
// listed. Culinary and latte matcha have no sourced rule, so those teas show no section.
export const PAIRING_RULES: PairingRule[] = [
  {
    id: 'matcha-higashi',
    category: 'matcha',
    grade: 'drinking',
    sweet: 'Higashi (dry wagashi)',
    note: 'Ippodo serves its Sayaka-no-mukashi matcha with seasonal higashi on a tray.',
    source: { label: 'Ippodo, Sayaka-no-mukashi', url: `${IPPODO}/products/matcha5010331` },
  },
  {
    id: 'matcha-cream-puffs',
    category: 'matcha',
    grade: 'drinking',
    sweet: 'Cream puffs',
    note: 'A light matcha with a mild aftertaste suits sweets rich with cream.',
    source: { label: 'Ippodo, cream puffs', url: `${IPPODO}/blogs/recipe/cream-puffs` },
  },
  {
    id: 'matcha-kashiwa-mochi',
    category: 'matcha',
    grade: 'drinking',
    sweet: 'Kashiwa mochi',
    note: 'Ippodo suggests it for early-afternoon teatime with whisked matcha.',
    source: { label: 'Ippodo, kashiwa mochi', url: `${IPPODO}/blogs/recipe/kashiwa-mochi` },
  },
  {
    id: 'hojicha-daifuku',
    category: 'hojicha',
    grade: 'any',
    sweet: 'Ichigo daifuku',
    note: 'Hojicha’s aroma is said to make strawberry mochi exquisite.',
    source: { label: 'Ippodo, ichigo daifuku', url: `${IPPODO}/blogs/recipe/daifuku` },
  },
  {
    id: 'hojicha-castella',
    category: 'hojicha',
    grade: 'any',
    sweet: 'Castella',
    note: 'The sponge cake’s soft, gentle egg flavour goes well with the roast.',
    source: { label: 'Ippodo, castella', url: `${IPPODO}/blogs/recipe/castella` },
  },
  {
    id: 'hojicha-zenzai',
    category: 'hojicha',
    grade: 'any',
    sweet: 'Zenzai (sweet azuki soup)',
    note: 'Aromatic but lightly flavoured hojicha makes the sweet soup more relaxing.',
    source: { label: 'Ippodo, zenzai', url: `${IPPODO}/blogs/recipe/zenzai-with-hojicha` },
  },
];
