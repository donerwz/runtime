import os
from contextlib import asynccontextmanager
import psycopg_pool
from psycopg.rows import dict_row

_pool: psycopg_pool.AsyncConnectionPool | None = None

async def open_pool():
    global _pool
    _pool = psycopg_pool.AsyncConnectionPool(
        conninfo=os.environ["DATABASE_URL"],
        min_size=2,
        max_size=10,
        open=False,
    )
    await _pool.open(wait=True)

async def close_pool():
    if _pool:
        await _pool.close()

@asynccontextmanager
async def get_conn():
    async with _pool.connection() as conn:
        yield conn
