import { expect, test } from '@playwright/test';
import { getAdminCredentials, signInAsAdmin } from './helpers/auth';
import { ensureParishSelected } from './helpers/parish';

/** Protected admin/member tabs — deep-link via page.goto after login to
 * verify session restore no longer bounces to Overview.
 */
const ADMIN_TABS = [
  { path: '/attendance', marker: /Activity Attendance|Choir Attendance/i },
  { path: '/masses', marker: /Liturgy|Mass|Payment|Share/i },
  { path: '/insights', marker: /Insights|Choral|Active Choralists|Attendance/i },
  { path: '/calendar', marker: /Calendar|Event|Mass/i },
  { path: '/planner', marker: /Planner|Feast|Liturg|Mass/i },
  { path: '/rehearsals', marker: /Rehearsal/i },
  { path: '/ministry', marker: /Ministry|Overview|Choir|Profile|Attendance/i },
  { path: '/achievements', marker: /Achievement|Badge|Streak|Gamification/i },
] as const;

const creds = getAdminCredentials();

test.describe('Admin authenticated flows', () => {
  test.skip(!creds, 'E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not set');

  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
  });

  test('parish chrome and sync state visible after login', async ({ page }) => {
    await ensureParishSelected(page);
    await expect(page.getByText(/live sync active/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign out/i })).toBeVisible();
  });

  test('Approval Desk opens and Edit profile shows scroll + Save', async ({ page }) => {
    await page.goto('/people');
    await ensureParishSelected(page);

    await expect(page.locator('#tab-approval-desk')).toBeVisible({ timeout: 30_000 });
    await page.locator('#tab-approval-desk').click();

    await expect(
      page.getByText(/Choral Registration|Approval Desk|Pending|Active|Refresh/i).first(),
    ).toBeVisible({ timeout: 45_000 });

    const editBtn = page.getByRole('button', { name: /Edit profile/i }).first();
    await expect(editBtn).toBeVisible({ timeout: 45_000 });
    await editBtn.click();

    await expect(page.getByRole('heading', { name: /Edit member profile/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Save profile/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Cancel$/i })).toBeVisible();

    // Scroll body should expose emergency contact without clipping Save
    const emergency = page.getByText(/Emergency contact/i);
    await emergency.scrollIntoViewIfNeeded();
    await expect(emergency).toBeVisible();
    await expect(page.getByRole('button', { name: /Save profile/i })).toBeVisible();

    // Non-destructive: close without saving
    await page.getByRole('button', { name: /^Cancel$/i }).click();
    await expect(page.getByRole('heading', { name: /Edit member profile/i })).toBeHidden({
      timeout: 10_000,
    });
  });

  for (const tab of ADMIN_TABS) {
    test(`admin can open ${tab.path} without Access restricted`, async ({ page }) => {
      await page.goto(tab.path);
      await ensureParishSelected(page);
      await expect(page).toHaveURL(new RegExp(`${tab.path.replace('/', '\\/')}(/)?$`));
      await expect(page.getByText(/Access restricted/i)).toHaveCount(0);
      await expect(page.getByText(tab.marker).first()).toBeVisible({ timeout: 45_000 });
    });
  }

  test('global search smoke', async ({ page }) => {
    await page.goto('/');
    await ensureParishSelected(page);
    const search = page.getByPlaceholder(/^Search$/i);
    await expect(search).toBeVisible();
    await search.fill('ma');
    // Dropdown may show matches or empty state
    await expect(
      page.getByText(/No matches for|Mass|Song|People|member/i).first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test('language toggle while signed in', async ({ page }) => {
    await page.goto('/');
    await ensureParishSelected(page);
    const tamil = page.getByRole('button', { name: 'Tamil', exact: true });
    await expect(tamil).toBeVisible();
    await tamil.click();
    await page.getByRole('button', { name: 'EN', exact: true }).click();
  });
});
