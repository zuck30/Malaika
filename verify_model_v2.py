import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        print("Navigating to http://localhost:3000...")
        await page.goto("http://localhost:3000", wait_until="networkidle")

        print("Waiting for 10 seconds for model load...")
        await asyncio.sleep(10)

        print("Taking screenshot...")
        # Use a large timeout and try to capture just the body to avoid GPU stalls if possible
        await page.screenshot(path="verification_v3.png", timeout=60000)
        print("Screenshot saved to verification_v3.png")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
