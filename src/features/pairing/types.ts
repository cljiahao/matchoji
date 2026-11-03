import type { ProductCategory } from '@/features/products';

export interface PairingSource {
  // The maker's page the suggestion comes from.
  label: string;
  url: string;
}

export interface PairingRule {
  id: string;
  category: ProductCategory;
  // 'drinking' skips matcha graded for lattes and baking, which none of the sourced rules cover.
  grade: 'any' | 'drinking';
  sweet: string;
  // What the maker says about the match, in our words.
  note: string;
  source: PairingSource;
}
