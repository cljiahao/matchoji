import { expect, test } from './fixtures';

test.describe('public pages', () => {
  test('home renders the tea shelves', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Find your next matcha or hojicha' })
    ).toBeVisible();
    await expect(page.locator('main h2').first()).toBeVisible();
    await expect(page.locator('main a[href^="/products/"]').first()).toBeVisible();
  });

  test('searching from the header lands on Explore with results', async ({ page, isMobile }) => {
    // Phones search from the Explore page itself; the header field is a desktop control.
    test.skip(isMobile, 'header search is desktop only');
    await page.goto('/learn');
    await page.getByRole('search').getByRole('searchbox', { name: 'Search teas' }).fill('matcha');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/explore\?.*q=matcha/);
    await expect(page.locator('main a[href^="/products/"]').first()).toBeVisible();
  });

  test('a tea page shows its name, rating and similar teas', async ({ page }) => {
    await page.goto('/explore');
    await page.locator('main a[href^="/products/"]').first().click();
    await expect(page).toHaveURL(/\/products\/[^/]+$/);
    await expect(page.getByRole('heading', { level: 1 })).not.toBeEmpty();
    await expect(page.getByText(/Not yet rated|\d rating/).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Similar teas' })).toBeVisible();
    const ld = await page.locator('script[type="application/ld+json"]').textContent();
    expect(JSON.parse(ld ?? '{}')).toMatchObject({ '@type': 'Product' });
  });

  test('regions shows the map and the list of regions', async ({ page }) => {
    await page.goto('/regions');
    await expect(page.getByRole('heading', { level: 1, name: 'Tea regions' })).toBeVisible();
    const map = page.getByRole('region', { name: 'Map of tea-growing regions' });
    await expect(map).toHaveClass(/leaflet-container/);
    await expect(page.locator('main ul a[href^="/explore"]').first()).toBeVisible();
  });

  test('shops lists shops beside a map', async ({ page }) => {
    await page.goto('/shops');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Where to buy in person' })
    ).toBeVisible();
    await expect(page.getByRole('region', { name: 'Map of shops' })).toHaveClass(
      /leaflet-container/
    );
    await expect(page.getByRole('link', { name: 'Directions' }).first()).toBeVisible();
  });

  test('top lists renders', async ({ page }) => {
    await page.goto('/top');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('interactions', () => {
  test('Log a tasting asks a signed-out visitor to sign in', async ({ page }) => {
    await page.goto('/');
    // Until the session resolves the button does nothing, so retry the click.
    await expect(async () => {
      await page.getByRole('button', { name: 'Log a tasting' }).first().click();
      await expect(page.getByRole('dialog', { name: 'Join Matchoji' })).toBeVisible({
        timeout: 1_500,
      });
    }).toPass();
  });

  test('the theme toggle switches to dark', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Dark', { exact: true }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});

test.describe('search engine files', () => {
  test('robots.txt links the sitemap and the sitemap lists teas', async ({ request }) => {
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toMatch(/Sitemap: https?:\/\/.+\/sitemap\.xml/);
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).toContain('/products/');
  });
});
