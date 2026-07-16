import { expect, Page } from '@playwright/test';
import { ensureParishSelected } from './parish';

export function getAdminCredentials(): { email: string; password: string } | null {
  const email = process.env.E2E_ADMIN_EMAIL?.trim();
  const password = process.env.E2E_ADMIN_PASSWORD?.trim();
  if (!email || !password) return null;
  return { email, password };
}

/** Sign in via sidebar AuthPanel. Assumes signed-out state. */
export async function signInAsAdmin(page: Page) {
  const creds = getAdminCredentials();
  if (!creds) {
    throw new Error('E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD must be set');
  }

  await page.goto('/');
  await ensureParishSelected(page);

  const signInHeading = page.getByText('Sign in', { exact: true }).first();
  await expect(signInHeading).toBeVisible({ timeout: 30_000 });

  await page.getByPlaceholder(/Email or mobile number/i).fill(creds.email);
  await page.getByPlaceholder(/DOB as DDMMYYYY/i).fill(creds.password);
  await page.getByRole('button', { name: /^Sign in$/i }).click();

  await expect(page.getByRole('button', { name: /Sign out/i })).toBeVisible({
    timeout: 60_000,
  });
  await expect(page.getByText(/live sync active/i)).toBeVisible({ timeout: 30_000 });
}
