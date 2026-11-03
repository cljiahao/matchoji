import type { ProductCategory } from '@/features/products';
import { tinDesign } from '@/features/products';

// TeaTin's drawing without the label art, whose text and glyphs need fonts satori's SVG path lacks.
export function ShareTin({
  category,
  seed,
  width,
}: {
  category: ProductCategory;
  seed: string;
  width: number;
}) {
  const { c, label, top } = tinDesign(category, seed);
  return (
    <svg width={width} height={(width * 160) / 120} viewBox="0 0 120 160">
      <ellipse cx="60" cy="150" rx="40" ry="5" fill="#000" opacity="0.08" />
      <rect x="22" y={34 + top} width="76" height={114 - top} rx="8" fill={c.body} />
      <rect x="78" y={34 + top} width="20" height={114 - top} rx="8" fill={c.shade} />
      <rect x="30" y={38 + top} width="5" height={106 - top} rx="2.5" fill="#fff" opacity="0.14" />
      <rect x="18" y={16 + top} width="84" height="24" rx="6" fill={c.lid} />
      <rect x="18" y={35 + top} width="84" height="5" fill="#000" opacity="0.12" />
      <rect x="22" y={66 + top / 2} width="76" height="50" fill={label} />
      <rect x="22" y={70 + top / 2} width="76" height="1.5" fill={c.ink} opacity="0.5" />
      <rect x="22" y={110.5 + top / 2} width="76" height="1.5" fill={c.ink} opacity="0.5" />
    </svg>
  );
}
