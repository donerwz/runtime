from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from psycopg.rows import dict_row

from backend.auth import get_current_user
from backend.db import get_conn
from backend.models import HeartbeatIn

router = APIRouter(prefix="/heartbeat")
limiter = Limiter(key_func=get_remote_address)


@router.post("", status_code=201)
@limiter.limit("2/minute")
async def post_heartbeat(
    request: Request,
    body: HeartbeatIn,
    user: dict = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    async with get_conn() as conn:
        await conn.execute(
            """
            INSERT INTO heartbeats (ts, user_id, app_name, app_bundle, focused, project, language, file_ext)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (now, user["id"], body.app_name, body.app_bundle,
             body.focused, body.project, body.language, body.file_ext),
        )
    return {}
