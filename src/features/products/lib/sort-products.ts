import { sortByRating } from '../api/product-ratings';
import type { Product } from '../types';
import type { DiscoverSort } from './discover-params';
import { supplyRank } from './supply';

export function sortProducts(products: Product[], sort: DiscoverSort): Product[] {
  if (sort === 'top') return sortByRating(products);
  if (sort === 'reviewed') {
    return [...products].sort(
      (a, b) => b.reviewCount - a.reviewCount || (b.avgStars ?? 0) - (a.avgStars ?? 0)
    );
  }
  if (sort === 'newest') {
    return [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  // Within a supply level, the top-rated tea leads (sort is stable over the rating order).
  return sortByRating(products).sort((a, b) => supplyRank(a.supply) - supplyRank(b.supply));
}
