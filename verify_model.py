import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}"))

        print("Navigating to http://localhost:3000...")
        await page.goto("http://localhost:3000")

        print("Waiting for 15 seconds for model load...")
        await page.wait_for_timeout(15000)

        await page.screenshot(path="verification_v2.png")
        print("Screenshot saved to verification_v2.png")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
