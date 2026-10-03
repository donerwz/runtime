import hashlib
import secrets
import sys
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from psycopg.rows import dict_row
from backend.db import get_conn

_bearer = HTTPBearer()

def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()

def generate_token() -> tuple[str, str]:
    raw = secrets.token_urlsafe(32)
    return raw, hash_token(raw)

async def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(_bearer),
) -> dict:
    token_hash = hash_token(creds.credentials)
    async with get_conn() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            await cur.execute(
                "SELECT id, name, role, supervisor_id FROM users WHERE api_token_hash = %s",
                (token_hash,),
            )
            user = await cur.fetchone()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user

async def require_supervisor(user: dict = Depends(get_current_user)) -> dict:
    if user["role"] != "supervisor":
        raise HTTPException(status_code=403, detail="Supervisor access required")
    return user


if __name__ == "__main__":
    # python -m backend.auth <user_id>
    # Prints a raw token and stores the hash in the DB.
    import asyncio, os
    from dotenv import load_dotenv
    load_dotenv()

    async def _make_token(user_id: str):
        from backend.db import open_pool, close_pool
        await open_pool()
        raw, hashed = generate_token()
        async with get_conn() as conn:
            await conn.execute(
                "UPDATE users SET api_token_hash = %s WHERE id = %s",
                (hashed, user_id),
            )
        await close_pool()
        print(f"Token for {user_id}:\n{raw}")

    asyncio.run(_make_token(sys.argv[1]))
