"""
Creates a user and prints their raw API token.

Usage:
    python -m backend.create_user <name> <role>
    python -m backend.create_user "Alice" volunteer
    python -m backend.create_user "Bob" supervisor
"""
import asyncio
import sys
from dotenv import load_dotenv
load_dotenv()

from backend.auth import generate_token
from backend.db import open_pool, close_pool, get_conn


async def main(name: str, role: str):
    await open_pool()
    raw, hashed = generate_token()
    async with get_conn() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT INTO users (name, role, api_token_hash) VALUES (%s, %s, %s) RETURNING id",
                (name, role, hashed),
            )
            row = await cur.fetchone()
    await close_pool()
    print(f"Created {role}: {name}")
    print(f"ID:    {row[0]}")
    print(f"Token: {raw}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python -m backend.create_user <name> <role>")
        sys.exit(1)
    asyncio.run(main(sys.argv[1], sys.argv[2]))
