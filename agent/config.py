import json
from pathlib import Path

_CONFIG_PATH = Path.home() / ".runtime" / "config.json"

class Config:
    def __init__(self):
        _CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
        self.token: str = ""
        self.server_url: str = "http://localhost:8000"
        self.tracked_apps: list[str] = []
        self.load()

    def load(self):
        if _CONFIG_PATH.exists():
            data = json.loads(_CONFIG_PATH.read_text())
            self.token = data.get("token", "")
            self.server_url = data.get("server_url", "http://localhost:8000")
            self.tracked_apps = data.get("tracked_apps", [])

    def save(self):
        _CONFIG_PATH.write_text(json.dumps({
            "token": self.token,
            "server_url": self.server_url,
            "tracked_apps": self.tracked_apps,
        }, indent=2))

    def add_app(self, name: str):
        if name not in self.tracked_apps:
            self.tracked_apps.append(name)
            self.save()

    def remove_app(self, name: str):
        if name in self.tracked_apps:
            self.tracked_apps.remove(name)
            self.save()

    def toggle_app(self, name: str):
        if name in self.tracked_apps:
            self.remove_app(name)
        else:
            self.add_app(name)
