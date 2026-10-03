# DEV B — Phase 3
# HTTP client for the Runtime backend. Read api-contract.md for shapes.
#
# TODO:
#   Class ApiClient:
#
#   __init__(config: Config):
#     Store config reference. Create an httpx.Client (sync — runs in the tracker thread).
#
#   post_heartbeat(app_name: str, app_bundle: str, focused: bool) -> None:
#     POST <config.server_url>/heartbeat
#     Headers: Authorization: Bearer <config.token>
#     Body: { "app_name": app_name, "app_bundle": app_bundle, "focused": focused }
#     Raise on non-2xx so tracker.py can catch and log.
#
#   get_today_minutes() -> int:
#     Needs user_id — read it from config (store it after first successful heartbeat,
#     or add a GET /me endpoint to Dev A's TODO list).
#     GET <config.server_url>/hours?user_id=...&from=<today>&to=<today>
#     Return tracked_minutes for today, or 0 on any error.
