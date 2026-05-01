import os
import subprocess
import logging
import platform
import webbrowser
import re
import difflib

logger = logging.getLogger(__name__)

class ActionExecutor:
    """
    Executes system actions on behalf of Malaika.
    Optimized for macOS (Apple Silicon) with AppleScript integration.
    """
    def __init__(self):
        self.os_type = platform.system()
        # Common application mapping
        self.app_map = {
            "chrome": "Google Chrome",
            "browser": "Google Chrome",
            "spotify": "Spotify",
            "music": "Music",
            "settings": "System Settings",
            "terminal": "Terminal",
            "code": "Visual Studio Code",
            "finder": "Finder",
            "youtube": "https://www.youtube.com",
            "netflix": "https://www.netflix.com",
            "github": "https://www.github.com"
        }

    def execute_action(self, action_string: str):
        """
        Parses and executes an action string.
        Returns a descriptive result or error message.
        """
        try:
            logger.info(f"Executing action: {action_string}")

            # Use regex for more robust parsing
            match = re.search(r'(\w+)\((.*)\)', action_string)
            if not match:
                cmd = action_string.strip()
                args = ""
            else:
                cmd = match.group(1)
                args = match.group(2).strip()

            if cmd == "OPEN_APP":
                return self.open_application(args)
            elif cmd == "SEARCH_WEB":
                return self.search_web(args)
            elif cmd == "SYSTEM_STATUS":
                return self.get_system_status()
            elif cmd == "SET_VOLUME":
                return self.set_volume(args)
            elif cmd == "SET_BRIGHTNESS":
                return self.set_brightness(args)
            else:
                return f"Error: Unknown action '{cmd}'."
        except Exception as e:
            logger.error(f"Error executing action {action_string}: {e}")
            return f"Error: {str(e)}"

    def _run_applescript(self, script: str):
        """Helper to run AppleScript on macOS."""
        if self.os_type != "Darwin":
            return False, "AppleScript is only available on macOS."

        try:
            process = subprocess.run(
                ['osascript', '-e', script],
                capture_output=True,
                text=True,
                check=True
            )
            return True, process.stdout.strip()
        except subprocess.CalledProcessError as e:
            error_msg = e.stderr.strip() or e.stdout.strip() or str(e)
            return False, error_msg

    def _fuzzy_find_app(self, app_name: str):
        """Finds the best match for an application name."""
        app_name_lower = app_name.lower().strip('"\'')

        # 1. Direct mapping check
        if app_name_lower in self.app_map:
            return self.app_map[app_name_lower]

        # 2. Fuzzy match against map keys
        matches = difflib.get_close_matches(app_name_lower, self.app_map.keys(), n=1, cutoff=0.6)
        if matches:
            return self.app_map[matches[0]]

        return app_name_lower

    def open_application(self, app_name: str):
        """Opens a local application or a mapped URL."""
        if not app_name:
            return "Error: No application name provided."

        target = self._fuzzy_find_app(app_name)

        # If target is a URL, open in browser
        if target.startswith("http"):
            webbrowser.open(target)
            return f"Opening {app_name} in your browser."

        try:
            if self.os_type == "Darwin":  # macOS
                # Try AppleScript for better reliability with some apps
                script = f'tell application "{target}" to activate'
                success, output = self._run_applescript(script)
                if success:
                    return f"Successfully opened {target}."
                else:
                    # Fallback to 'open -a'
                    try:
                        subprocess.run(["open", "-a", target], check=True, capture_output=True)
                        return f"Opening {target}..."
                    except subprocess.CalledProcessError as e:
                        error_detail = e.stderr.decode().strip()
                        return f"Error: Unable to find or open application '{target}'. {error_detail}"

            elif self.os_type == "Windows":
                os.startfile(target)
                return f"Opening {target}..."

            elif self.os_type == "Linux":
                subprocess.Popen(["xdg-open", target])
                return f"Opening {target}..."

            return f"Opening {target}..."
        except Exception as e:
            logger.warning(f"Could not open {target} locally: {e}")
            return f"Error: Failed to open {target}. {str(e)}"

    def set_volume(self, level: str):
        """Sets system volume (0-100) on macOS."""
        try:
            # Clean and validate level
            level_int = int(re.search(r'\d+', level).group())
            level_int = max(0, min(100, level_int))

            if self.os_type == "Darwin":
                script = f"set volume output volume {level_int}"
                success, error = self._run_applescript(script)
                if success:
                    return f"System volume set to {level_int}%."
                return f"Error setting volume: {error}"
            else:
                return f"Volume control not implemented for {self.os_type} yet."
        except Exception as e:
            return f"Error: Invalid volume level. {str(e)}"

    def set_brightness(self, level: str):
        """Sets system brightness (0-100) on macOS using pyobjc if available."""
        try:
            level_int = int(re.search(r'\d+', level).group())
            level_float = max(0.0, min(1.0, level_int / 100.0))

            if self.os_type == "Darwin":
                try:
                    import ScreenBrightness
                    # Some versions might use this, but standard is often via CoreGraphics/DisplayServices
                    # Using pyobjc for a more robust M3 compatible way:
                    from Quartz import (
                        CGDisplayModeGetDisplay,
                        CGMainDisplayID,
                        DisplayServicesSetBrightness
                    )
                    DisplayServicesSetBrightness(CGMainDisplayID(), level_float)
                    return f"Brightness adjusted to {level_int}%."
                except ImportError:
                    # Fallback to a common shell command or AppleScript
                    return f"Brightness adjustment to {level_int}% requires 'pyobjc-framework-Quartz' to be installed."
                except Exception as e:
                    return f"Error adjusting brightness: {str(e)}"
            else:
                return f"Brightness control not implemented for {self.os_type}."
        except Exception as e:
            return f"Error: Invalid brightness level. {str(e)}"

    def search_web(self, query: str):
        """Performs a web search."""
        if not query:
            return "Error: No search query provided."
        url = f"https://www.google.com/search?q={query.strip()}"
        webbrowser.open(url)
        return f"Searching the web for '{query}'..."

    def get_system_status(self):
        """Returns basic system info."""
        try:
            import psutil
            cpu = psutil.cpu_percent()
            ram = psutil.virtual_memory().percent
            return f"Your system is currently at {cpu}% CPU and {ram}% RAM usage."
        except ImportError:
            return "Error: psutil library not installed."
        except Exception as e:
            return f"Error getting system status: {str(e)}"

action_executor = ActionExecutor()
