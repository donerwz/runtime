# Runtime: Build Plan for Claude Code

Hackathon: StormHacks 2026. Target prize: Best Use of Gemini API.
Machine: macOS. Editor: VS Code. Database: Tiger Data (Postgres + TimescaleDB).

## How to work (read first)

- Build one phase at a time. Stop at the end of each phase and wait for me to verify the acceptance checks.
- Do not invent API details. For Tiger Data/TimescaleDB syntax and for the Gemini SDK (current model names, Live API, structured output), check the official docs first.
- Keep commits small, one per task. Write a short commit message.
- Secrets live in `.env` (never commit it). Provide `.env.example`.
- Store all timestamps in UTC. Convert to local time only in the dashboard.
- Privacy rules: never collect keystrokes, file contents, or full file paths. Only send project name, language, file extension, and a focused flag. The user must be able to pause tracking.
- Prefer the simplest thing that demos well. Skip anything not listed.

## Stack

- Backend: Python 3.11+, FastAPI, psycopg (v3), uvicorn
- Database: Tiger Data service (Postgres + TimescaleDB hypertables)
- Extension: TypeScript VS Code extension (scaffold with `yo code`)
- AI: Gemini via the official `google-genai` SDK
- Dashboard: React + Vite + a small chart library (Recharts or similar), talking to the FastAPI backend

## Repo layout

```
/backend        FastAPI app, SQL migrations, Gemini pipeline
/extension      VS Code extension
/dashboard      Supervisor dashboard
/seed           Fake data scripts for the demo
PLAN.md
.env.example
```

## Phase 0: Setup (15 min)

1. Create the repo layout above, `.gitignore`, `.env.example`.
2. Backend venv, install FastAPI, uvicorn, psycopg, python-dotenv, google-genai.
3. Add a `GET /health` endpoint.

Accept: `uvicorn` runs and `/health` returns ok.

## Phase 1: Database

1. `backend/migrations/001_init.sql` creating:
   - `users` (id uuid, name, role: volunteer or supervisor, supervisor_id, api_token_hash)
   - `cohorts` and `cohort_members` (so a supervisor can group selected students)
   - `heartbeats` (ts timestamptz, user_id, project, language, file_ext, focused bool) and convert it to a hypertable on `ts`
   - `shifts` (user_id, date, tracked_minutes, approved_minutes, status: pending/approved/adjusted)
   - `daily_assessments` (user_id, date, scores jsonb, summary text, evidence jsonb, created_at)
2. A migration runner script.
3. A SQL view or function that computes tracked minutes per user per day: sum the gaps between consecutive heartbeats, capping each gap at 2 minutes (longer gaps count as idle).
4. `seed/seed.py` to insert 5 fake students, 1 supervisor, and about 2 weeks of realistic heartbeats.

Accept: running the hours query on seeded data gives plausible numbers per student per day, and a hand-checked case matches.

## Phase 2: Ingest + read API

1. Auth: a bearer token per user, stored hashed. A script to generate and print a token for a user.
2. `POST /heartbeat`: validate the token, validate the body, insert a row.
3. `GET /hours?user_id&from&to`: daily tracked minutes.
4. `GET /students` (supervisor only): students with today's and this week's minutes.
5. Reject unknown fields, and rate-limit `/heartbeat` per user.

Accept: curl a heartbeat in, then see it reflected in `/hours`. Wrong token returns 401.

## Phase 3: VS Code extension

1. Scaffold TypeScript extension in `/extension`.
2. Listen for: text document changes, saves, active editor changes, window focus changes.
3. Throttle to at most one heartbeat per 30 seconds, and send nothing when the window is unfocused.
4. Token in VS Code SecretStorage with a "Set Tracker Token" command. Server URL as a setting.
5. Status bar item showing today's tracked time, clicking toggles pause/resume.
6. Payload contains only: project (workspace folder name), language id, file extension, focused flag.
7. Package with `vsce package` into a `.vsix`.

Accept: press F5, edit a file, and a row appears in the DB within 30 seconds. Pausing sends nothing. Walking away for 10 minutes adds about 0 minutes.

## Phase 4: Gemini assessment pipeline (the prize part)

1. Daily job (and a manual `POST /assess/{user_id}/{date}` for demos) that gathers evidence:
   - tracked minutes, projects, languages
   - the day's GitHub commits and PRs for that user (GitHub API, with a token in `.env`)
   - the volunteer's end-of-shift check-in text
2. Call Gemini with a fixed rubric and a **structured JSON schema**: `progress`, `difficulty_handled`, `collaboration`, `consistency`, `blockers[]`, `highlights[]`, and `evidence[]` where every score cites a specific commit, file type, or quote.
3. Validate the response against the schema. Retry once on invalid output, and save a clear error state if it still fails.
4. Store the result in `daily_assessments`.
5. Weekly synthesis: feed a week of assessments into one long-context call and produce a supervisor-facing summary (trends, who is stuck, who deserves recognition).
6. Function calling: give Gemini tools like `get_commits(user, date)` and `get_recent_assessments(user, n)` so it fetches evidence itself instead of being handed everything.
7. Framing: scores are advisory feedback, not grades. Rubric is identical for everyone, and non-coding work (reviews, meetings) must not be penalized.

Accept: assessments on seeded users produce valid JSON with evidence for every score, and the weekly summary reads sensibly.

## Phase 5: Supervisor dashboard

1. Login by token (simple is fine).
2. Cohort overview: table/heatmap of selected students by day, sortable by "needs attention."
3. Student page: hours, score trend chart, blockers, Gemini summary with clickable evidence.
4. Shift approval: supervisor can approve or adjust hours (updates `shifts`).
5. Weekly digest view with export.

Accept: a supervisor can open the cohort view, drill into a student, and approve a shift, all against seeded data.

## Phase 6: Stretch (only if time remains)

- Voice check-in with the Gemini Live API (60-second spoken end-of-shift update, with one or two follow-up questions from Gemini).
- Alert when a student has been blocked 2 days in a row.

## Phase 7: Demo prep

1. Rich seed data so every dashboard view looks alive.
2. A recorded backup demo video.
3. README with an architecture diagram and a "Why Gemini" section listing each Gemini feature used and why.
4. A 2-minute script: problem, live demo, architecture, impact.

## Open decisions (ask me before assuming)

- Hosting: tunnel for the demo or free-tier deploy?
- Is the GitHub integration in scope, or only tracked time plus check-in text?
- Are volunteers possibly under 18? If yes, add a consent screen and a data-minimization note.

## Fallback

If the extension takes too long, use WakaTime and pull each user's stats from its API into the same tables, then move on to Phase 4.
