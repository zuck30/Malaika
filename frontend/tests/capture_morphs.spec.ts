import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.setTimeout(120000); // Increased timeout to 2 minutes

test('capture morph targets', async ({ page }) => {
  const screenshotDir = 'morph_targets';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir);
  }

  for (let i = 0; i <= 16; i++) {
    console.log(`Capturing morph target ${i}...`);
    await page.goto(`http://localhost:3000?morph=${i}`);
    await page.waitForSelector('canvas');
    // On the first load, wait longer for the model to fetch and parse
    if (i === 0) {
       await page.waitForTimeout(5000);
    } else {
       await page.waitForTimeout(1000);
    }
    await page.screenshot({ path: path.join(screenshotDir, `morph_${i}.png`) });
  }
});
