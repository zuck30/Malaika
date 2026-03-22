import { test, expect } from '@playwright/test';

test('verify elysia character rendering', async ({ page }) => {
  await page.goto('http://localhost:3000');
  // Wait for the canvas to be present
  await page.waitForSelector('canvas');
  // Wait a bit for the model to load and animations to start
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'elysia_fixed_view.png' });
});
