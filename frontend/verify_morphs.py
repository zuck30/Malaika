import asyncio
from playwright.async_api import async_playwright
import os

async def capture_morphs():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        # Create a directory for morph screenshots
        os.makedirs("frontend/morph_debug", exist_ok=True)

        page = await browser.new_page(viewport={'width': 800, 'height': 800})

        # We assume the dev server is running or we'll start it
        # For now, let's assume it's on localhost:3000
        url_base = "http://localhost:3000?morph="

        for i in range(17):
            print(f"Capturing morph {i}...")
            try:
                await page.goto(f"{url_base}{i}", wait_until="networkidle")
                # Wait a bit for the model to load and animation to settle
                await asyncio.sleep(2)
                await page.screenshot(path=f"frontend/morph_debug/morph_{i}.png")
            except Exception as e:
                print(f"Failed to capture morph {i}: {e}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(capture_morphs())
