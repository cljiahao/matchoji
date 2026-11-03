import {
  ProductShelf,
  discoverHref,
  type CatalogueTea,
  type ProductCategory,
} from '@/features/products';

// "Similar teas" shelf for a tea's page; hidden when there is nothing like it.
export function SimilarTeas({
  teas,
  category,
}: {
  teas: CatalogueTea[];
  category: ProductCategory;
}) {
  if (teas.length === 0) return null;
  return (
    <ProductShelf
      title="Similar teas"
      seeAllHref={discoverHref({ sort: 'top' }, { category })}
      products={teas}
    />
  );
}
