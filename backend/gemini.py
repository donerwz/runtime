import os
from google import genai
from google.genai import types
from backend.models import AssessmentResult

_client: genai.Client | None = None

def _get_client() -> genai.Client:
    global _client
    if not _client:
        _client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    return _client

_RUBRIC = """
You are evaluating a volunteer developer's daily activity. Scores are advisory feedback, not grades.
Non-coding work (reviews, meetings, design) must not be penalized.
The rubric is identical for all volunteers.

Score each dimension 0-10:
- progress: did they make meaningful forward movement on their work?
- difficulty_handled: did they tackle non-trivial problems?
- collaboration: evidence of teamwork, PR reviews, communication?
- consistency: steady activity throughout the day vs. bursts?

For every score, cite a specific piece of evidence (commit, app used, time block).
"""

_SCHEMA = types.Schema(
    type=types.Type.OBJECT,
    properties={
        "progress":           types.Schema(type=types.Type.NUMBER),
        "difficulty_handled": types.Schema(type=types.Type.NUMBER),
        "collaboration":      types.Schema(type=types.Type.NUMBER),
        "consistency":        types.Schema(type=types.Type.NUMBER),
        "blockers":   types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
        "highlights": types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
        "evidence": types.Schema(
            type=types.Type.ARRAY,
            items=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "score_key": types.Schema(type=types.Type.STRING),
                    "citation":  types.Schema(type=types.Type.STRING),
                },
            ),
        ),
    },
    required=["progress", "difficulty_handled", "collaboration", "consistency",
              "blockers", "highlights", "evidence"],
)


async def assess_day(user_id: str, date: str) -> dict:
    from backend.db import get_conn
    from psycopg.rows import dict_row

    async with get_conn() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            await cur.execute(
                """
                SELECT app_name, COUNT(*) AS heartbeats,
                       SUM(CASE WHEN language IS NOT NULL THEN 1 ELSE 0 END) AS coding_beats
                FROM heartbeats
                WHERE user_id = %s AND (ts AT TIME ZONE 'UTC')::date = %s
                GROUP BY app_name ORDER BY heartbeats DESC
                """,
                (user_id, date),
            )
            app_rows = await cur.fetchall()

    evidence_text = "\n".join(
        f"- {r['app_name']}: {r['heartbeats']} heartbeats" for r in app_rows
    )
    prompt = f"{_RUBRIC}\n\nActivity on {date}:\n{evidence_text or 'No activity recorded.'}"

    client = _get_client()
    for attempt in range(2):
        response = await client.aio.models.generate_content(
            model="gemini-3.8-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=_SCHEMA,
            ),
        )
        try:
            data = response.parsed
            return AssessmentResult(**data).model_dump()
        except Exception:
            if attempt == 1:
                raise


async def weekly_synthesis(supervisor_id: str, week_start: str) -> str:
    from backend.db import get_conn
    from psycopg.rows import dict_row

    async with get_conn() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            await cur.execute(
                """
                SELECT u.name, da.date, da.scores
                FROM daily_assessments da
                JOIN users u ON u.id = da.user_id
                JOIN cohort_members cm ON cm.user_id = da.user_id
                JOIN cohorts c ON c.id = cm.cohort_id
                WHERE c.supervisor_id = %s AND da.date >= %s::date
                ORDER BY u.name, da.date
                """,
                (supervisor_id, week_start),
            )
            rows = await cur.fetchall()

    if not rows:
        return "No assessment data available for this week."

    summary_input = "\n".join(
        f"{r['name']} on {r['date']}: {r['scores']}" for r in rows
    )
    prompt = (
        "You are a volunteer program supervisor. Given the weekly assessment data below, "
        "write a 2-3 paragraph narrative summary covering: overall trends, who may need support, "
        "and who deserves recognition. Be encouraging and specific.\n\n"
        + summary_input
    )

    client = _get_client()
    response = await client.aio.models.generate_content(
        model="gemini-3.8-flash",
        contents=prompt,
    )
    return response.text
