import { expect, test } from '@playwright/test';

test.describe('in Portuguese', () => {
  test.use({ locale: 'pt-BR' });

  test('follows the browser language, with translated demo data', async ({ page }) => {
    await page.goto('./');
    await expect(page.getByRole('heading', { name: 'Tarefas', level: 2 })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(page.getByText('Enviar o relatório semanal')).toBeVisible();
    await expect(page.getByLabel('Idioma')).toHaveValue('pt-BR');
  });

  test('can switch to English, and remembers it', async ({ page }) => {
    await page.goto('projects');
    await page.getByLabel('Idioma').selectOption('en-US');
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
  });
});

test('works offline once the service worker is installed', async ({ page, context }) => {
  await page.goto('./');
  await expect(page.locator('app-task-item')).toHaveCount(7);
  // The worker registers once the app is stable, and is ready after caching the app files
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // now the page is controlled by the worker

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('app-task-item')).toHaveCount(7);
  await page.getByRole('link', { name: 'Projects' }).click();
  await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
});
