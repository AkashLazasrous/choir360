import { Page } from '@playwright/test';

const AMBATTUR_QUERY = 'Ambattur';

/** Dismiss parish onboarding if shown; prefer Ambattur OT parish. */
export async function ensureParishSelected(page: Page) {
  const modalTitle = page.getByRole('heading', { name: /Select your Parish/i });
  const visible = await modalTitle.isVisible({ timeout: 4_000 }).catch(() => false);
  if (!visible) return;

  const search = page.getByPlaceholder(/Search by church name or place/i);
  await search.fill(AMBATTUR_QUERY);
  const option = page
    .getByRole('button')
    .filter({ hasText: /Ambattur|Joseph the Worker/i })
    .first();
  await option.waitFor({ state: 'visible', timeout: 10_000 });
  await option.click();
  await modalTitle.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => undefined);
}
