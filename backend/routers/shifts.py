from datetime import date
from uuid import UUID
from fastapi import APIRouter, Depends
from psycopg.rows import dict_row

from backend.auth import require_supervisor
from backend.db import get_conn
from backend.models import ShiftRow, ShiftPatch

router = APIRouter(prefix="/shifts")


@router.get("", response_model=list[ShiftRow])
async def get_shifts(
    user_id: UUID,
    from_: date,
    to: date,
    _supervisor=Depends(require_supervisor),
):
    async with get_conn() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            await cur.execute(
                """
                SELECT date, tracked_minutes, approved_minutes, status
                FROM shifts
                WHERE user_id = %s AND date BETWEEN %s AND %s
                ORDER BY date
                """,
                (str(user_id), from_, to),
            )
            return await cur.fetchall()


@router.patch("/{user_id}/{date_}", status_code=200)
async def patch_shift(
    user_id: UUID,
    date_: date,
    body: ShiftPatch,
    _supervisor=Depends(require_supervisor),
):
    async with get_conn() as conn:
        await conn.execute(
            """
            UPDATE shifts
            SET approved_minutes = %s, status = %s
            WHERE user_id = %s AND date = %s
            """,
            (body.approved_minutes, body.status, str(user_id), date_),
        )
    return {}
