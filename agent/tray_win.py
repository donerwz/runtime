import threading
import time
import pystray
from PIL import Image, ImageDraw
from agent.config import Config
from agent.api import ApiClient
from agent.tracker import Tracker


def _make_icon_image() -> Image.Image:
    img = Image.new("RGB", (64, 64), color=(30, 30, 30))
    d = ImageDraw.Draw(img)
    d.text((16, 16), "RT", fill=(255, 255, 255))
    return img


def _running_apps() -> list[str]:
    try:
        import psutil
        seen: set[str] = set()
        for proc in psutil.process_iter(["name"]):
            name = (proc.info["name"] or "").removesuffix(".exe")
            if name and not name.startswith(("svchost", "RuntimeBroker", "conhost")):
                seen.add(name)
        return sorted(seen)[:30]
    except Exception:
        return []


class RuntimeTrayApp:
    def __init__(self, tracker: Tracker, config: Config, api: ApiClient):
        self.tracker = tracker
        self.config = config
        self.api = api
        self._today_min = 0
        self._icon: pystray.Icon | None = None

    def run(self):
        self._icon = pystray.Icon(
            "Runtime",
            _make_icon_image(),
            "Runtime",
            menu=pystray.Menu(self._build_menu),
        )
        threading.Thread(target=self._minute_loop, daemon=True).start()
        self._icon.run()

    # ── menu ──────────────────────────────────────────────────────────────────

    def _build_menu(self):
        items = [
            pystray.MenuItem(f"Today: {self._today_min} min", None, enabled=False),
            pystray.Menu.SEPARATOR,
        ]
        for name in _running_apps():
            n = name
            items.append(pystray.MenuItem(
                n,
                self._make_toggle(n),
                checked=lambda _, app=n: app in self.config.tracked_apps,
            ))
        items += [
            pystray.Menu.SEPARATOR,
            pystray.MenuItem(
                lambda _: "Resume Tracking" if self.tracker.paused else "Pause Tracking",
                self._toggle_pause,
            ),
            pystray.MenuItem("Set API Token…", self._set_token),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Quit", self._quit),
        ]
        return items

    # ── callbacks ─────────────────────────────────────────────────────────────

    def _make_toggle(self, app_name: str):
        def _toggle(_):
            self.config.toggle_app(app_name)
            if self._icon:
                self._icon.update_menu()
        return _toggle

    def _toggle_pause(self, _):
        self.tracker.toggle_pause()
        if self._icon:
            self._icon.update_menu()

    def _set_token(self, _):
        import tkinter as tk
        from tkinter import simpledialog
        root = tk.Tk()
        root.withdraw()
        token = simpledialog.askstring("Set API Token", "Paste your Runtime API token:", parent=root)
        root.destroy()
        if token:
            self.config.token = token.strip()
            self.config.save()

    def _quit(self, _):
        self.tracker.stop()
        if self._icon:
            self._icon.stop()

    # ── background ────────────────────────────────────────────────────────────

    def _minute_loop(self):
        while True:
            time.sleep(60)
            self._today_min = self.api.get_today_minutes()
            if self._icon:
                self._icon.update_menu()
