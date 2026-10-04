from datetime import date
from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends
from psycopg.rows import dict_row

from backend.auth import get_current_user
from backend.db import get_conn
from backend.models import DailyHours

router = APIRouter(prefix="/hours")


@router.get("", response_model=list[DailyHours])
async def get_hours(
    from_: date,
    to: date,
    user: dict = Depends(get_current_user),
    user_id: Optional[UUID] = None,
):
    uid = str(user_id) if user_id else str(user["id"])
    async with get_conn() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            await cur.execute(
                "SELECT date, tracked_minutes FROM tracked_minutes_per_day(%s, %s, %s)",
                (uid, from_, to),
            )
            rows = await cur.fetchall()
    return rows
