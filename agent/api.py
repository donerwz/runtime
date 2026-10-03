from datetime import date
import httpx
from agent.config import Config


class ApiClient:
    def __init__(self, config: Config):
        self.config = config

    def _headers(self) -> dict:
        return {"Authorization": f"Bearer {self.config.token}"}

    def post_heartbeat(self, app_name: str, app_bundle: str | None, focused: bool) -> None:
        with httpx.Client(timeout=5) as client:
            r = client.post(
                f"{self.config.server_url}/heartbeat",
                json={"app_name": app_name, "app_bundle": app_bundle, "focused": focused},
                headers=self._headers(),
            )
            r.raise_for_status()

    def get_today_minutes(self) -> int:
        if not self.config.token:
            return 0
        today = date.today().isoformat()
        try:
            with httpx.Client(timeout=5) as client:
                r = client.get(
                    f"{self.config.server_url}/hours",
                    params={"from_": today, "to": today},
                    headers=self._headers(),
                )
                r.raise_for_status()
                rows = r.json()
                return rows[0]["tracked_minutes"] if rows else 0
        except Exception:
            return 0
