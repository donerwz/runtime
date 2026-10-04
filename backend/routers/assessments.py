from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends
from psycopg.rows import dict_row

from backend.auth import require_supervisor
from backend.db import get_conn
from backend.models import AssessmentRow

router = APIRouter(prefix="/assessments")


@router.get("", response_model=list[AssessmentRow])
async def get_assessments(
    user_id: UUID,
    from_: date,
    to: date,
    _supervisor=Depends(require_supervisor),
):
    """Stored daily assessments for one user, oldest first.

    The query params use `from_` rather than `from` because `from` is a Python
    keyword; api-contract.md documents this convention for /hours and /shifts.
    """
    async with get_conn() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            await cur.execute(
                """
                SELECT date, scores, summary, evidence
                FROM daily_assessments
                WHERE user_id = %s AND date BETWEEN %s AND %s
                ORDER BY date
                """,
                (str(user_id), from_, to),
            )
            rows = await cur.fetchall()

    return [
        AssessmentRow(
            date=r["date"],
            scores=r["scores"] or {},
            summary=r["summary"],
            evidence=r["evidence"] or [],
        )
        for r in rows
    ]