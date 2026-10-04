import os
import psycopg
from datetime import date, timedelta
from dotenv import load_dotenv
from seed.fake_data import make_users, make_heartbeats

load_dotenv()

def run():
    users = make_users()
    supervisor = users[0]
    volunteers = users[1:]

    with psycopg.connect(os.environ["DATABASE_URL"]) as conn:

        # ── users ──────────────────────────────────────────────────────────
        print("Inserting users...")
        for u in users:
            conn.execute(
                """
                INSERT INTO users (name, role, api_token_hash)
                VALUES (%s, %s, %s)
                ON CONFLICT (api_token_hash) DO NOTHING
                """,
                (u["name"], u["role"], u["api_token_hash"]),
            )

        # fetch IDs by name
        for u in users:
            row = conn.execute(
                "SELECT id FROM users WHERE name = %s", (u["name"],)
            ).fetchone()
            u["id"] = str(row[0])

        # ── cohort ─────────────────────────────────────────────────────────
        print("Creating cohort...")
        cohort = conn.execute(
            """
            INSERT INTO cohorts (supervisor_id, name)
            VALUES (%s, 'StormHacks 2026 Volunteers')
            ON CONFLICT DO NOTHING
            RETURNING id
            """,
            (supervisor["id"],),
        ).fetchone()

        if not cohort:
            cohort = conn.execute(
                "SELECT id FROM cohorts WHERE supervisor_id = %s", (supervisor["id"],)
            ).fetchone()
        cohort_id = str(cohort[0])

        for v in volunteers:
            conn.execute(
                """
                INSERT INTO cohort_members (cohort_id, user_id)
                VALUES (%s, %s)
                ON CONFLICT DO NOTHING
                """,
                (cohort_id, v["id"]),
            )

        # ── heartbeats ─────────────────────────────────────────────────────
        total_hb = 0
        for v in volunteers:
            print(f"Generating heartbeats for {v['name']}...")
            heartbeats = make_heartbeats(v["id"], v["_profile"], days=14)
            total_hb += len(heartbeats)

            with conn.pipeline():
                for hb in heartbeats:
                    conn.execute(
                        """
                        INSERT INTO heartbeats
                            (ts, user_id, app_name, app_bundle, focused, project, language, file_ext)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (hb["ts"], hb["user_id"], hb["app_name"], hb["app_bundle"],
                         hb["focused"], hb["project"], hb["language"], hb["file_ext"]),
                    )

        # ── shifts (derived from tracked_minutes_per_day) ──────────────────
        print("Computing shifts...")
        today = date.today()
        week_ago = today - timedelta(days=14)

        for v in volunteers:
            rows = conn.execute(
                "SELECT date, tracked_minutes FROM tracked_minutes_per_day(%s, %s, %s)",
                (v["id"], week_ago, today),
            ).fetchall()

            for day, minutes in rows:
                conn.execute(
                    """
                    INSERT INTO shifts (user_id, date, tracked_minutes, status)
                    VALUES (%s, %s, %s, 'pending')
                    ON CONFLICT (user_id, date) DO UPDATE
                        SET tracked_minutes = EXCLUDED.tracked_minutes
                    """,
                    (v["id"], day, minutes),
                )

        conn.commit()

    print(f"\nDone. Inserted:")
    print(f"  {len(users)} users (1 supervisor + {len(volunteers)} volunteers)")
    print(f"  1 cohort")
    print(f"  {total_hb} heartbeats")
    print(f"\nTokens (save these):")
    for u in users:
        print(f"  {u['role']:10} {u['name']:15} {u['raw_token']}")


if __name__ == "__main__":
    run()
