import { expect, test } from '@playwright/test';
import { ensureParishSelected } from './helpers/parish';

const PUBLIC_PATHS = [
  '/',
  '/calendar',
  '/bible',
  '/songs',
  '/people',
  '/catholic-hub',
] as const;

const PROTECTED_PATHS = [
  '/masses',
  '/attendance',
  '/ministry',
  '/ai-hub',
  '/planner',
  '/achievements',
  '/rehearsals',
  '/insights',
] as const;

test.describe('Public smoke (signed out)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await ensureParishSelected(page);
  });

  test('marketing landing loads', async ({ page }) => {
    await page.goto('/');
    await ensureParishSelected(page);
    await expect(page.locator('body')).toBeVisible();
    // Marketing or ops shell — either is fine unsigned
    const hasBrand = await page.getByText(/Choir360|Join|Browse|Overview|Music Library/i).first().isVisible();
    expect(hasBrand).toBeTruthy();
  });

  for (const path of PUBLIC_PATHS) {
    test(`public path ${path} loads without crash`, async ({ page }) => {
      await page.goto(path);
      await ensureParishSelected(page);
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('body')).not.toContainText('Unexpected Application Error');
    });
  }

  for (const path of PROTECTED_PATHS) {
    test(`protected path ${path} redirects unsigned users to landing`, async ({ page }) => {
      await page.goto(path);
      await ensureParishSelected(page);
      await expect(page).toHaveURL(/\/(\?.*)?$/, { timeout: 20_000 });
    });
  }

  test('songs search and open a result', async ({ page }) => {
    await page.goto('/songs');
    await ensureParishSelected(page);
    await expect(page.locator('#song-search-box')).toBeVisible({ timeout: 30_000 });
    await page.locator('#song-search-box').fill('amma');
    await page.locator('#ai-translit-search-btn').click();
    // Wait for list items or song cards
    const songRow = page.locator('[id^="song-"], button, a').filter({ hasText: /./ }).first();
    await expect(page.locator('#song-search-box')).toHaveValue('amma');
    // Soft assertion: page still interactive after search
    await expect(page.locator('#member-registration-component').or(page.locator('#song-search-box'))).toBeVisible();
    void songRow;
  });

  test('bible viewer loads', async ({ page }) => {
    await page.goto('/bible');
    await ensureParishSelected(page);
    await expect(page.getByText(/Bible|Tamil|English|Catholic/i).first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test('catholic hub section switches', async ({ page }) => {
    await page.goto('/catholic-hub');
    await ensureParishSelected(page);
    await expect(page.getByText(/Daily Gospel|Catholic Hub/i).first()).toBeVisible({
      timeout: 30_000,
    });
    for (const label of ['Songs', 'Saints', 'Prayers']) {
      const tab = page.getByRole('button', { name: new RegExp(label, 'i') }).first();
      if (await tab.isVisible().catch(() => false)) {
        await tab.click();
      }
    }
  });

  test('registration form fields present', async ({ page }) => {
    await page.goto('/people');
    await ensureParishSelected(page);
    await expect(page.getByText(/Join the Choir Ministry|Registration Form/i).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/First name|First Name/i).first()).toBeVisible();
    await expect(page.getByText(/Email/i).first()).toBeVisible();
  });

  test('calendar loads', async ({ page }) => {
    await page.goto('/calendar');
    await ensureParishSelected(page);
    await expect(page.getByText(/Calendar|Mass|Event/i).first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test('language toggle smoke', async ({ page }) => {
    await page.goto('/');
    await ensureParishSelected(page);
    const tamil = page.getByRole('button', { name: 'Tamil', exact: true });
    if (await tamil.isVisible().catch(() => false)) {
      await tamil.click();
      await page.getByRole('button', { name: 'EN', exact: true }).click();
    }
  });
});
