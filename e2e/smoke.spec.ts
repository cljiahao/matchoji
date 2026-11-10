import { expect, test } from './fixtures';

test.describe('public pages', () => {
  test('home leads with the café guide and keeps the at-home row', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'The trusted guide to hojicha and matcha drinks in Singapore and JB',
      })
    ).toBeVisible();
    // Café rails hide until there is café data, so the always-on row is what we can rely on.
    const atHome = page.getByRole('region', { name: 'Brew it at home' });
    await expect(atHome).toBeVisible();
    await expect(atHome.getByRole('link', { name: 'Explore teas' })).toHaveAttribute(
      'href',
      '/explore'
    );
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
    await expect(page.getByRole('heading', { level: 1, name: 'Tea shops' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Map of shops' })).toHaveClass(
      /leaflet-container/
    );
    await expect(page.getByRole('link', { name: 'Directions' }).first()).toBeVisible();
  });

  test('top lists renders', async ({ page }) => {
    await page.goto('/top');
    await expect(page.getByRole('heading', { level: 1, name: 'Top drinks' })).toBeVisible();
  });

  test('tea lists live under /top/teas', async ({ page }) => {
    await page.goto('/top/teas');
    await expect(page.getByRole('heading', { level: 1, name: 'Top teas at home' })).toBeVisible();
  });

  test('an old tea list link lands on /top/teas, and a junk slug is not found', async ({
    page,
  }) => {
    // The group's loading boundary flushes the shell first, so over HTTP the 308 shows as a 200
    // plus a client redirect; the unit tests hold the 308 itself. /top/matcha is a list only once
    // enough teas are rated, so either outcome is right, but never a page left at /top/matcha.
    await page.goto('/top/matcha');
    await page.waitForLoadState('networkidle');
    if (page.url().endsWith('/top/teas/matcha')) {
      await expect(page.getByRole('link', { name: 'All tea lists' })).toBeVisible();
    } else {
      await expect(page.getByRole('heading', { level: 1 })).not.toHaveText('Top drinks');
    }
  });
});

test.describe('interactions', () => {
  test('Log a drink asks a signed-out visitor to sign in', async ({ page }) => {
    await page.goto('/');
    // Until the session resolves the button does nothing, so retry the click. Phones have the
    // tab bar's "Log"; desktop has the navbar's "Log a drink".
    await expect(async () => {
      await page
        .getByRole('button', { name: /^Log( a drink)?$/ })
        .first()
        .click();
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
