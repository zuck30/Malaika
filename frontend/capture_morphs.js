const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function captureMorphs() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set viewport to a square for character focus
  await page.setViewportSize({ width: 800, height: 800 });

  const outputDir = 'morph_debug';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  for (let i = 0; i < 17; i++) {
    console.log(`Capturing morph index ${i}...`);
    await page.goto(`http://localhost:3000/?morph=${i}`);

    // Wait for model to load and animation to stabilize
    await page.waitForTimeout(2000);

    await page.screenshot({ path: path.join(outputDir, `morph_${i}.png`) });
  }

  await browser.close();
  console.log('Morph capture complete.');
}

captureMorphs().catch(console.error);
