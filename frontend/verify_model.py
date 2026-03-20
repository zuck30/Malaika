import asyncio
from playwright.async_api import async_playwright
import os
import time

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        # Increased viewport for better visibility
        page = await browser.new_page(viewport={'width': 1280, 'height': 800})

        print("Navigating to http://localhost:3000...")
        try:
            await page.goto("http://localhost:3000", wait_until="networkidle", timeout=30000)
        except Exception as e:
            print(f"Navigation failed (is server running?): {e}")
            await browser.close()
            return

        print("Waiting for 3D model to load (look for canvas)...")
        try:
            await page.wait_for_selector("canvas", timeout=15000)
            # Give some time for textures and environment to settle
            await asyncio.sleep(5)

            # Take a screenshot
            screenshot_path = "model_view.png"
            await page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

            # Optionally record a short video (if supported by playwright config)
            # Since we want to see animations, we'll just take another one after a bit
            await asyncio.sleep(2)
            await page.screenshot(path="model_view_2.png")

        except Exception as e:
            print(f"Model canvas not found or timeout: {e}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify())
