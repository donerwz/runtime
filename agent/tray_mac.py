import rumps
from agent.config import Config
from agent.api import ApiClient
from agent.tracker import Tracker


class RuntimeTrayApp(rumps.App):
    def __init__(self, tracker: Tracker, config: Config, api: ApiClient):
        import os
        icon_path = os.path.join(os.path.dirname(__file__), "icon.png")
        super().__init__("Runtime", icon=icon_path, quit_button="Quit Runtime", template=True)
        self.tracker = tracker
        self.config = config
        self.api = api
        self._rebuild_menu()

    def run(self):
        super().run()

    # ── menu ──────────────────────────────────────────────────────────────────

    def _rebuild_menu(self):
        self.menu.clear()
        self.menu = [
            rumps.MenuItem("Today: — min"),
            rumps.MenuItem("Total: — min"),
            None,
            *self._app_items(),
            None,
            rumps.MenuItem(
                "⏸ Pause Tracking" if not self.tracker.paused else "▶ Resume Tracking",
                callback=self._toggle_pause,
            ),
            None,
            rumps.MenuItem("Set API Token…", callback=self._set_token),
            rumps.MenuItem("Refresh App List", callback=self._refresh),
        ]

    def _app_items(self) -> list:
        items = []
        for name in self._running_apps():
            label = f"✓ {name}" if name in self.config.tracked_apps else f"   {name}"
            items.append(rumps.MenuItem(label, callback=self._make_toggle(name)))
        return items or [rumps.MenuItem("(no apps running)", callback=None)]

    def _running_apps(self) -> list[str]:
        try:
            import AppKit
            ws = AppKit.NSWorkspace.sharedWorkspace()
            apps = [
                a.localizedName()
                for a in ws.runningApplications()
                if a.activationPolicy() == 0 and a.localizedName()
            ]
            return sorted(set(apps))[:25]
        except Exception:
            return []

    # ── callbacks ─────────────────────────────────────────────────────────────

    def _make_toggle(self, app_name: str):
        def _toggle(_):
            self.config.toggle_app(app_name)
            self._rebuild_menu()
        return _toggle

    def _toggle_pause(self, _):
        self.tracker.toggle_pause()
        self._rebuild_menu()

    def _refresh(self, _):
        self._rebuild_menu()

    def _set_token(self, _):
        resp = rumps.Window(
            message="Paste your Runtime API token:",
            title="Set API Token",
            ok="Save",
            cancel="Cancel",
            dimensions=(360, 60),
        ).run()
        if resp.clicked:
            self.config.token = resp.text.strip()
            self.config.save()
            rumps.notification("Runtime", "Token saved", "Tracking will now send heartbeats.")

    # ── timer ─────────────────────────────────────────────────────────────────

    @rumps.timer(60)
    def _update_minutes(self, _):
        today = self.api.get_today_minutes()
        total = self.api.get_total_minutes()
        try:
            self.menu["Today: — min"].title = f"Today: {today} min"
        except KeyError:
            pass
        try:
            self.menu["Total: — min"].title = f"Total: {total} min"
        except KeyError:
            pass
