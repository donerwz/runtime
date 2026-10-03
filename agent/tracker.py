import sys
import time
import threading
from agent.config import Config
from agent.api import ApiClient


class Tracker(threading.Thread):
    def __init__(self, config: Config, api: ApiClient):
        super().__init__(daemon=True)
        self.config = config
        self.api = api
        self.paused = False
        self._last_sent = 0.0
        self._running = True

    def run(self):
        while self._running:
            if not self.paused:
                app_name, app_bundle = self._get_active_app()
                if app_name and app_name in self.config.tracked_apps:
                    now = time.monotonic()
                    if now - self._last_sent >= 30:
                        try:
                            self.api.post_heartbeat(app_name, app_bundle, focused=True)
                            self._last_sent = now
                        except Exception as e:
                            print(f"[runtime] heartbeat error: {e}", file=sys.stderr)
            time.sleep(5)

    def _get_active_app(self) -> tuple[str | None, str | None]:
        if sys.platform == "darwin":
            return self._active_mac()
        return self._active_win()

    def _active_mac(self) -> tuple[str | None, str | None]:
        try:
            import AppKit
            ws = AppKit.NSWorkspace.sharedWorkspace()
            app = ws.frontmostApplication()
            return app.localizedName(), app.bundleIdentifier()
        except Exception:
            return None, None

    def _active_win(self) -> tuple[str | None, str | None]:
        try:
            import win32gui, win32process, psutil
            hwnd = win32gui.GetForegroundWindow()
            _, pid = win32process.GetWindowThreadProcessId(hwnd)
            name = psutil.Process(pid).name().removesuffix(".exe")
            return name, None
        except Exception:
            return None, None

    def toggle_pause(self):
        self.paused = not self.paused

    def stop(self):
        self._running = False
