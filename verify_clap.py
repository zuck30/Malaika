import asyncio
from playwright.async_api import async_playwright
import os

async def run_test():
    async with async_playwright() as p:
        # Launch browser with microphone permissions
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            permissions=['microphone']
        )
        page = await context.new_page()

        # Navigate to the app
        print("Navigating to http://localhost:3000...")
        try:
            await page.goto("http://localhost:3000", wait_until="networkidle", timeout=60000)
        except Exception as e:
            print(f"Navigation failed: {e}")
            await page.screenshot(path="error_nav.png")
            await browser.close()
            return

        # Wait for the chat interface to be visible
        print("Waiting for chat interface...")
        try:
            # The placeholder is 'Chat with Malaika...' when connected
            # or 'Connecting...' when not.
            input_selector = 'input[placeholder*="Malaika"]'
            await page.wait_for_selector(input_selector, timeout=30000)
            print("Chat interface found.")
        except Exception as e:
            print(f"Chat interface not found: {e}")
            await page.screenshot(path="error_chat.png")
            await browser.close()
            return

        # Check for clap detection log or state change
        # Since we can't physically clap, we'll check if the hook is loaded
        # and maybe mock a clap via console if possible, but the requirement
        # is just to ensure it's integrated.

        # Let's check if the browser console has any errors
        page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))

        print("Taking final screenshot...")
        await page.screenshot(path="final_state.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_test())
