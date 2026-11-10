import { beforeEach, describe, expect, it, vi } from 'vitest';

const renderCafeImage = vi.fn();
const renderDrinkImage = vi.fn();

vi.mock('@/features/share', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/share')>()),
  renderCafeImage: (...a: unknown[]) => renderCafeImage(...a),
  renderDrinkImage: (...a: unknown[]) => renderDrinkImage(...a),
}));

import DrinkImage, * as drinkFile from './(public)/cafes/[slug]/[drink]/opengraph-image';
import CafeImage, * as cafeFile from './(public)/cafes/[slug]/opengraph-image';

beforeEach(() => vi.clearAllMocks());

describe('café and drink opengraph-image routes', () => {
  it('declare a 1200×630 PNG with alt text', () => {
    for (const file of [cafeFile, drinkFile]) {
      expect(file.size).toEqual({ width: 1200, height: 630 });
      expect(file.contentType).toBe('image/png');
      expect(file.alt).toBeTruthy();
    }
  });

  it('café image renders the café from its route param', async () => {
    renderCafeImage.mockResolvedValue('cafe');
    expect(await CafeImage({ params: Promise.resolve({ slug: 'kurasu-bugis' }) })).toBe('cafe');
    expect(renderCafeImage).toHaveBeenCalledWith('kurasu-bugis');
  });

  it('drink image renders the drink from both route params', async () => {
    renderDrinkImage.mockResolvedValue('drink');
    expect(
      await DrinkImage({
        params: Promise.resolve({ slug: 'kurasu-bugis', drink: 'hojicha-latte' }),
      })
    ).toBe('drink');
    expect(renderDrinkImage).toHaveBeenCalledWith('kurasu-bugis', 'hojicha-latte');
  });
});
