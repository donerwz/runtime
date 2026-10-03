from datetime import date, timedelta
from fastapi import APIRouter, Depends
from psycopg.rows import dict_row

from backend.auth import require_supervisor
from backend.db import get_conn
from backend.models import StudentSummary

router = APIRouter(prefix="/students")


@router.get("", response_model=list[StudentSummary])
async def get_students(supervisor: dict = Depends(require_supervisor)):
    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    async with get_conn() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            # Get all students in this supervisor's cohorts
            await cur.execute(
                """
                SELECT DISTINCT u.id, u.name
                FROM cohort_members cm
                JOIN cohorts c ON c.id = cm.cohort_id
                JOIN users u ON u.id = cm.user_id
                WHERE c.supervisor_id = %s
                """,
                (str(supervisor["id"]),),
            )
            students = await cur.fetchall()

            result = []
            for s in students:
                uid = str(s["id"])

                await cur.execute(
                    "SELECT COALESCE(SUM(tracked_minutes), 0) AS mins FROM tracked_minutes_per_day(%s, %s, %s)",
                    (uid, today, today),
                )
                today_row = await cur.fetchone()

                await cur.execute(
                    "SELECT COALESCE(SUM(tracked_minutes), 0) AS mins FROM tracked_minutes_per_day(%s, %s, %s)",
                    (uid, week_start, today),
                )
                week_row = await cur.fetchone()

                result.append(StudentSummary(
                    user_id=s["id"],
                    name=s["name"],
                    today_min=today_row["mins"],
                    week_min=week_row["mins"],
                ))

    return result
