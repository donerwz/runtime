# Dashboard — Frontend Dev Notes

Design it however you want. These notes tell you what data each page has, what actions it needs to support, and any tricky wiring to be aware of. All API calls are already written in `src/api/client.ts` — just import and call them.

---

## Setup

```bash
npm install
npm run dev          # starts at localhost:5173, proxies /api → FastAPI on :8000
```

The proxy is in `vite.config.ts`. You don't need to hardcode any URLs.

---

## Auth

Token is stored in `localStorage` under `"tracker_token"`. The `getToken()` helper in `client.ts` reads it. All API functions call it automatically.

Protected routes already redirect to `/` if no token is found (`src/main.tsx`).

---

## Pages

### `/` — Login (`src/pages/Login.tsx`)

Simple token entry screen. No API call needed on submit — just save the token:

```ts
localStorage.setItem('tracker_token', token)
navigate('/cohort')
```

Show an error if the field is empty. That's it.

---

### `/cohort` — Cohort Overview (`src/pages/CohortView.tsx`)

**Data:** `getStudents()` → `StudentSummary[]`

```ts
{ user_id, name, today_min, week_min }
```

**What to show:**
- A table or card grid of all students
- Each student: name, today's minutes, this week's minutes
- A status indicator: flag students below 300 min/week as "needs attention"
- Sortable by name, today_min, week_min
- Clicking a student navigates to `/student/:user_id`

**Nav links to:** `/shifts`, `/digest`

---

### `/student/:id` — Student Detail (`src/pages/StudentPage.tsx`)

**Data:**
- `getHours(userId, from, to)` → `DailyHours[]` — use last 14 days
- `triggerAssessment(userId, date)` → `{ job_id }` — on button click
- `pollAssessmentResult(jobId)` → `AssessmentResult | { status: 'pending' }` — poll until done

```ts
// AssessmentResult shape:
{
  progress: number,            // 0–10
  difficulty_handled: number,  // 0–10
  collaboration: number,       // 0–10
  consistency: number,         // 0–10
  blockers: string[],
  highlights: string[],
  evidence: [{ score_key, citation }]
}
```

**What to show:**
- Hours bar chart or heatmap for the last 14 days (Recharts is installed)
- Score chart: 4 lines (progress, difficulty_handled, collaboration, consistency) over time — needs multiple assessment calls or store results in state
- Latest assessment: scores displayed visually (bars, gauges, whatever looks good), blockers list, highlights list
- Evidence section: each `{ score_key, citation }` pair — cite what Gemini used to score
- "Run Assessment" button for a specific date — triggers `triggerAssessment`, then polls `pollAssessmentResult` every 2s until it returns a result (not `{ status: 'pending' }`)
- "Back" link to `/cohort`

**Polling pattern:**

```ts
const { job_id } = await triggerAssessment(userId, date)
const interval = setInterval(async () => {
  const result = await pollAssessmentResult(job_id)
  if (!('status' in result)) {
    clearInterval(interval)
    setAssessment(result)
  }
}, 2000)
```

---

### `/shifts` — Shift Approval (`src/pages/ShiftApproval.tsx`)

**Data:**
- `getShifts(userId, from, to)` → `Shift[]`
- `approveShift(userId, date, approvedMinutes, status)` — on approve action

```ts
// Shift shape:
{ date, tracked_minutes, approved_minutes, status: 'pending' | 'approved' | 'adjusted' }
```

**What to show:**
- A student selector (use the student list from `getStudents()`) and a date range picker
- Table: date | tracked min | approved min (editable number) | status | action button
- "Approve" button sets `status = 'approved'` with the (possibly edited) approved_minutes
- Highlight pending rows
- After approval, re-fetch or update the row in state

---

### `/digest` — Weekly Digest (`src/pages/WeeklyDigest.tsx`)

**Data:** `POST /api/assess/weekly/:supervisorId/:weekStart` — triggers a Gemini weekly synthesis

There's no `client.ts` function for this one yet — you'll need to add it:

```ts
export async function triggerWeeklySynthesis(supervisorId: string, weekStart: string) {
  return req(getToken(), `/assess/weekly/${supervisorId}/${weekStart}`, { method: 'POST' })
}
// Then poll the job_id with pollAssessmentResult — same pattern as the student page.
// The result will have: { summary: string } instead of scores.
```

**What to show:**
- Week picker (Monday of the target week)
- "Generate Digest" button — triggers the synthesis and shows a loading state (this call takes 5–10s)
- The returned `summary` is a plain text narrative — render it as a readable block
- "Export" button: download as `.txt` using `Blob` + an `<a>` click
- Optional: per-student score sparklines for the week (fetch each student's assessments)

---

## Components

These are in `src/components/`. Design them however — they're just called from the pages above.

| File | Used by | Receives |
|------|---------|----------|
| `StudentTable.tsx` | CohortView | `students: StudentSummary[], onSelect: (id) => void` |
| `HoursHeatmap.tsx` | StudentPage | `data: DailyHours[]` |
| `ScoreChart.tsx` | StudentPage | `assessments: ScorePoint[]` — define the shape yourself |

Recharts is already installed. For the heatmap, a plain grid of colored `<div>` squares is fine and probably easier than a chart library component.

---

## Things to watch out for

**Query param name:** The hours and shifts endpoints use `from_` (not `from`) because `from` is a Python reserved word. The `client.ts` functions already handle this correctly — don't change the param name.

**UUIDs:** `user_id` comes back as a UUID string. Pass it as-is to the API functions.

**Empty states:** `getHours` returns `[]` (not a 404) when there's no data. Handle empty arrays in charts.

**Token not set:** If `getToken()` returns `""`, all API calls will get a 401. Redirect to `/` on any 401 response — a small wrapper around `req()` or an error boundary handles this cleanly.
