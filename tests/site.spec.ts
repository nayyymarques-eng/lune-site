import { test, expect, type Page } from '@playwright/test';
import { PAGES, LEGAL, FORBIDDEN } from './pages';

// Uncaught errors and console errors, minus resources from other hosts (fonts, analytics) that CI may not reach.
function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR_/.test(m.text())) errors.push(m.text()); });
  return errors;
}

for (const path of PAGES) {
  test(`page ${path}`, async ({ page }) => {
    const errors = watchErrors(page);
    const res = await page.goto(path);
    expect(res?.status(), 'page answers').toBe(200);
    await expect(page.locator('h1'), 'one main heading').toHaveCount(1);
    await expect(page.locator('footer'), 'footer').toBeVisible();
    const width = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(width, 'no sideways scroll').toBeLessThanOrEqual(0);
    if (!LEGAL.includes(path)) {
      const text = await page.locator('body').innerText();
      for (const [rule, why] of FORBIDDEN) expect(text, `copy rule: no ${why}`).not.toMatch(rule);
    }
    expect(errors, 'no script errors').toEqual([]);
  });
}

test('home: hero and the waitlist form', async ({ page }) => {
  await page.route('**/api/waitlist', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await page.goto('/');
  const hero = page.locator('.hero');
  await expect(hero.locator('h1')).toContainText('A ritual for every moon');
  const form = hero.locator('form.signup');
  await form.locator('input[type=email]').fill('test@example.com');
  await form.locator('button[type=submit]').click();
  await expect(form.locator('.ok')).toBeVisible();
  await expect(form.locator('.ok')).toContainText("You're on the list");
});

test('moon compass: a known chart', async ({ page }) => {
  // The city search is mocked: CI must not call Open-Meteo.
  await page.route('**/geocoding-api.open-meteo.com/**', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ results: [
    { name: 'Lisbon', admin1: 'Lisbon', country: 'Portugal', latitude: 38.71667, longitude: -9.13333, timezone: 'Europe/Lisbon' },
  ] }) }));
  await page.goto('/tonight');
  await page.click('button[data-t="go"]');
  await expect(page.locator('[data-t="err"]')).toBeVisible();
  await page.fill('[data-t="bdate"]', '1990-05-15');
  await page.fill('[data-t="btime"]', '14:30');
  await page.fill('#bplace', 'Lisb');
  await page.click('#bplace-list li >> nth=0');
  await page.click('button[data-t="go"]');
  // Lisbon, 15 May 1990, 14:30: Virgo rising, Sun in Taurus, Moon in Capricorn (same maths as the app).
  await expect(page.locator('[data-t="rising"]')).toHaveText('Virgo');
  await expect(page.locator('[data-t="sun"]')).toHaveText('Taurus');
  await expect(page.locator('[data-t="nmoon"]')).toHaveText('Capricorn');
  await expect(page.locator('[data-t="pname"]')).not.toBeEmpty();
});

// Full-page pictures of the main pages, kept with each CI run so a change can be looked at without opening the site.
for (const path of ['/', '/moon', '/tonight', '/journal']) {
  test(`picture ${path}`, async ({ page }, info) => {
    const res = await page.goto(path);
    expect(res?.status(), 'page answers').toBe(200);
    await page.waitForTimeout(1500);
    const name = `${info.project.name}${path === '/' ? '-home' : path.replace(/\//g, '-')}.png`;
    await page.screenshot({ path: `test-results/pictures/${name}`, fullPage: true });
  });
}
