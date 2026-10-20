import { sortByRating } from '../api/product-ratings';
import type { Product } from '../types';
import type { DiscoverSort } from './discover-params';

export function sortProducts(products: Product[], sort: DiscoverSort): Product[] {
  if (sort === 'top') return sortByRating(products);
  if (sort === 'reviewed') {
    return [...products].sort(
      (a, b) => b.reviewCount - a.reviewCount || (b.avgStars ?? 0) - (a.avgStars ?? 0)
    );
  }
  return [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
