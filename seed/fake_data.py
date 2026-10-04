import hashlib
import random
import secrets
from datetime import date, datetime, timedelta, timezone

def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()

_APPS = [
    ("Visual Studio Code", "com.microsoft.VSCode"),
    ("Figma",              "com.figma.Desktop"),
    ("Chrome",             "com.google.Chrome"),
    ("Slack",              "com.tinyspeck.slackmacgap"),
    ("Terminal",           "com.apple.Terminal"),
]

_LANGUAGES = [".py", ".ts", ".sql", ".tsx", ".json"]

# Each profile defines avg daily hours and a weighted app list (indices into _APPS)
_PROFILES = [
    {"name": "Alice Chen",  "avg_hours": 4.0, "apps": [0, 0, 0, 1, 2]},  # heavy coder
    {"name": "Bob Kim",     "avg_hours": 3.0, "apps": [1, 1, 2, 3, 3]},  # designer
    {"name": "Carol Wu",    "avg_hours": 5.0, "apps": [0, 0, 0, 4, 2]},  # very active
    {"name": "David Lee",   "avg_hours": 1.5, "apps": [2, 3, 3, 1, 0]},  # light / needs attention
    {"name": "Emma Park",   "avg_hours": 4.0, "apps": [0, 1, 2, 4, 3]},  # balanced
]


def make_users() -> list[dict]:
    users = []

    raw = secrets.token_urlsafe(32)
    users.append({
        "name": "Supervisor Sam",
        "role": "supervisor",
        "raw_token": raw,
        "api_token_hash": hash_token(raw),
    })

    for profile in _PROFILES:
        raw = secrets.token_urlsafe(32)
        users.append({
            "name": profile["name"],
            "role": "volunteer",
            "raw_token": raw,
            "api_token_hash": hash_token(raw),
            "_profile": profile,
        })

    return users


def make_heartbeats(user_id: str, profile: dict, days: int = 14) -> list[dict]:
    rows = []
    today = date.today()

    for offset in range(days, 0, -1):
        day = today - timedelta(days=offset)
        if day.weekday() >= 5:   # skip weekends
            continue

        total_seconds = max(1800, int(random.gauss(profile["avg_hours"] * 3600,
                                                    profile["avg_hours"] * 900)))
        # start between 9 and 11am UTC
        start_hour = random.uniform(9, 11)
        current = datetime(day.year, day.month, day.day,
                           int(start_hour), int(start_hour % 1 * 60),
                           tzinfo=timezone.utc)

        remaining = total_seconds
        while remaining > 0:
            app_name, app_bundle = _APPS[random.choice(profile["apps"])]
            session = min(remaining, random.randint(900, 5400))  # 15–90 min sessions

            t = current
            session_end = current + timedelta(seconds=session)
            while t < session_end:
                ext = random.choice(_LANGUAGES) if app_name == "Visual Studio Code" else None
                rows.append({
                    "ts":         t,
                    "user_id":    user_id,
                    "app_name":   app_name,
                    "app_bundle": app_bundle,
                    "focused":    True,
                    "project":    "runtime" if app_name == "Visual Studio Code" else None,
                    "language":   ext.lstrip(".") if ext else None,
                    "file_ext":   ext,
                })
                t += timedelta(seconds=30)

            remaining -= session
            # idle gap between sessions (> 2 min so the SQL function counts it as idle)
            current = session_end + timedelta(seconds=random.randint(300, 1800))

    return rows
