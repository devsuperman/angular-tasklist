import { expect, test } from '@playwright/test';

test('first visit shows the demo data', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveURL(/\/angular-tasklist\/tasks$/);
  await expect(page.locator('app-task-item')).toHaveCount(7);
  await expect(page.getByRole('heading', { name: 'Tasks', level: 2 })).toBeVisible();
});

test('create, complete, persist and delete a task', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: 'New task' }).click();
  await page.getByLabel('Title').fill('Learn Playwright');
  await page.getByRole('button', { name: 'Create' }).click();

  const row = page.getByRole('listitem').filter({ hasText: 'Learn Playwright' });
  await expect(row).toHaveCount(1);
  await row.getByRole('checkbox').check();

  await page.reload();
  await expect(row.getByRole('checkbox')).toBeChecked();

  await row.getByRole('button', { name: /delete/i }).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click(); // the confirmation dialog
  await expect(row).toHaveCount(0);

  await page.reload();
  await expect(page.locator('app-task-item').first()).toBeVisible();
  await expect(row).toHaveCount(0);
});

test('deep links load on refresh, through the 404.html fallback', async ({ page }) => {
  const response = await page.goto('projects');
  expect(response?.status()).toBe(404); // GitHub Pages answers 404 with our 404.html
  await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
  await expect(page).toHaveTitle('Projects');

  await page.goto('this/does/not/exist');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});

test('search waits for the user to stop typing', async ({ page }) => {
  await page.goto('tasks');
  await expect(page.locator('app-task-item')).toHaveCount(7);
  await page.getByLabel('Search').fill('report');
  await expect(page.locator('app-task-item')).toHaveCount(1);
  await expect(page.locator('app-task-item')).toContainText('Send the weekly report');
});
