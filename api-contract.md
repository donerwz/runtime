# API Contract

> **Ownership:** Dev A writes and maintains this file.
> Dev B (extension) and Dev C (dashboard) read this file to implement their HTTP clients.
> Do not change endpoint shapes without a team sync — it will break B and C.

All requests use `Authorization: Bearer <token>` except `/health`.
All timestamps are UTC ISO 8601. All bodies are JSON.

---

## Health

```
GET /health
→ 200 { "status": "ok" }
```

---

## Heartbeat (used by Dev B — desktop agent)

Sent by the system tray agent whenever a tracked app is in the foreground.
The VS Code extension (if still used) sends the optional coding fields too.

```
POST /heartbeat
Authorization: Bearer <user_token>

Body:
{
  "app_name":   string,            // e.g. "Figma", "Visual Studio Code"
  "app_bundle": string | null,     // macOS bundle ID, e.g. "com.figma.Desktop"
  "focused":    boolean,           // true if the app window has OS focus
  "project":    string | null,     // VS Code only: workspace folder name
  "language":   string | null,     // VS Code only: language id
  "file_ext":   string | null      // VS Code only: e.g. ".py"
}

→ 201 {}
→ 401 if token invalid
→ 429 if rate limit exceeded (1 per 30s per user)
```

---

## Hours (used by Dev C — dashboard)

```
GET /hours?user_id=<uuid>&from=<YYYY-MM-DD>&to=<YYYY-MM-DD>
Authorization: Bearer <any_token>

→ 200 [
    { "date": "2026-01-01", "tracked_minutes": 142 },
    ...
  ]
```

---

## Students (used by Dev C — dashboard, supervisor view)

```
GET /students
Authorization: Bearer <supervisor_token>

→ 200 [
    {
      "user_id":      string (uuid),
      "name":         string,
      "today_min":    number,
      "week_min":     number
    },
    ...
  ]
```

---

## Assessment (used by Dev C — dashboard student page)

```
POST /assess/<user_id>/<date>
Authorization: Bearer <supervisor_token>

→ 202 { "job_id": string }   // assessment runs async; poll /assess/<job_id>/result

GET /assess/<job_id>/result
→ 200 {
    "progress":            number (0-10),
    "difficulty_handled":  number (0-10),
    "collaboration":       number (0-10),
    "consistency":         number (0-10),
    "blockers":            string[],
    "highlights":          string[],
    "evidence":            [{ "score_key": string, "citation": string }]
  }
→ 202 { "status": "pending" }  // still running
```

---

## Shifts (used by Dev C — shift approval page)

```
GET /shifts?user_id=<uuid>&from=<date>&to=<date>
→ 200 [{ "date", "tracked_minutes", "approved_minutes", "status" }]

PATCH /shifts/<user_id>/<date>
Authorization: Bearer <supervisor_token>
Body: { "approved_minutes": number, "status": "approved" | "adjusted" }
→ 200 {}
```
