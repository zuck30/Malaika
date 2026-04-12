import os
import subprocess
import logging
import platform
import webbrowser

logger = logging.getLogger(__name__)

class ActionExecutor:
    """
    Executes system actions on behalf of Malaika.
    """
    def __init__(self):
        self.os_type = platform.system()

    def execute_action(self, action_string: str):
        """
        Parses and executes an action string like 'OPEN_APP(chrome)' or 'SEARCH_WEB(weather)'.
        """
        import re
        try:
            logger.info(f"Executing action: {action_string}")

            # Use regex for more robust parsing
            match = re.search(r'(\w+)\((.*)\)', action_string)
            if not match:
                # Handle cases without parentheses like SYSTEM_STATUS
                cmd = action_string.strip()
                args = ""
            else:
                cmd = match.group(1)
                args = match.group(2).strip()

            if cmd == "OPEN_APP":
                return self.open_application(args.lower())
            elif cmd == "SEARCH_WEB":
                return self.search_web(args)
            elif cmd == "SYSTEM_STATUS":
                return self.get_system_status()
            else:
                return f"Unknown action: {action_string}"
        except Exception as e:
            logger.error(f"Error executing action {action_string}: {e}")
            return f"Failed to execute action: {e}"

    def open_application(self, app_name: str):
        """Opens a local application."""
        if not app_name:
            return "No application name provided."

        try:
            if self.os_type == "Darwin":  # macOS
                # Use shlex to safely split or just pass as list to Popen
                subprocess.Popen(["open", "-a", app_name])
            elif self.os_type == "Windows":
                # os.startfile is safer than subprocess with shell=True
                os.startfile(app_name)
            elif self.os_type == "Linux":
                # Try to use xdg-open for better compatibility with desktop apps
                try:
                    subprocess.Popen(["xdg-open", app_name])
                except FileNotFoundError:
                    subprocess.Popen([app_name])
            return f"Opening {app_name}..."
        except Exception as e:
            # Fallback to web search if app not found or error
            logger.warning(f"Could not open {app_name} locally, trying web search. Error: {e}")
            webbrowser.open(f"https://www.google.com/search?q={app_name}")
            return f"I couldn't find {app_name} on your PC, so I searched for it on the web."

    def search_web(self, query: str):
        """Performs a web search."""
        url = f"https://www.google.com/search?q={query}"
        webbrowser.open(url)
        return f"Searching the web for '{query}'..."

    def get_system_status(self):
        """Returns basic system info."""
        import psutil
        cpu = psutil.cpu_percent()
        ram = psutil.virtual_memory().percent
        return f"Your system is running at {cpu}% CPU and {ram}% RAM usage."

action_executor = ActionExecutor()
