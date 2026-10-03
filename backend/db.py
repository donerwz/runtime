# DEV A — Phase 0 / Phase 1
# Database connection pool using psycopg v3 (async).
#
# TODO:
#   1. Read DATABASE_URL from environment (use python-dotenv).
#   2. Create an async connection pool with psycopg.AsyncConnectionPool.
#   3. Expose a get_conn() async context manager that routers can use:
#        async with get_conn() as conn:
#            await conn.execute(...)
#   4. Add a lifespan handler in main.py to open/close the pool on startup/shutdown.
#
# Tiger Data note: the connection string is a standard Postgres DSN.
# No special driver needed — psycopg v3 works as-is.
