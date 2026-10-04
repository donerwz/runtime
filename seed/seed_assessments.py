"""
Seeds `daily_assessments` rows so the dashboard's score chart, blockers,
highlights, evidence and the weekly digest have data without needing live
Gemini calls at demo time.

Citations are derived from the *actual* seeded heartbeats (real per-day,
per-app counts), so the evidence a supervisor clicks through matches the hours
they see on the same page.

Idempotent: re-running updates existing (user_id, date) rows instead of
inserting duplicates, so it is safe to re-run after reseeding heartbeats.

Run with:
    python -m seed.seed_assessments
    python -m seed.seed_assessments --days 21 --reset
"""
from __future__ import annotations

import argparse
import os
import random
from datetime import date, timedelta

import psycopg
from dotenv import load_dotenv
from psycopg.types.json import Jsonb

load_dotenv()

DAYS_DEFAULT = 12
SEED = 42

DIMENSIONS = ["progress", "difficulty_handled", "collaboration", "consistency"]

# Per-student character so the cohort view is not uniform. David is the
# struggling volunteer; the digest should name him as needing support.
PERSONAS = {
    "David Lee": dict(bias=-3, blockers=[
        "Blocked on the TimescaleDB continuous-aggregate query — still failing to compile",
        "Waiting on a database URL from Dev A before he can run the migration locally",
    ]),
    "Alice Chen": dict(bias=1, blockers=[
        "Waiting on design tokens for the settings page",
    ]),
    "Bob Kim": dict(bias=2, blockers=[]),
    "Carol Wu": dict(bias=0, blockers=[
        "Flaky integration test blocks merges",
    ]),
    "Emma Park": dict(bias=1, blockers=[]),
}

DEFAULT_PERSONA = dict(bias=0, blockers=[])

HIGHLIGHTS = [
    "Shipped the CSV importer and wired it into the CLI",
    "Reviewed two PRs on the platform team",
    "Fixed the off-by-one in the tracked-minutes window function",
    "Paired with a teammate on the TimescaleDB hypertable setup",
    "Added regression tests for the 2-minute idle cap",
    "Refactored the hours query down to a single aggregate",
    "Wrote the migration runner and ran it against the dev database",
    "Documented the heartbeat payload contract for the extension",
]


def clamp(value: int) -> int:
    return max(0, min(10, value))


def day_facts(conn, user_id: str, day: date) -> dict:
    """Real heartbeat counts for one user on one day, grouped by app."""
    rows = conn.execute(
        """
        SELECT COALESCE(app_name, 'Unknown') AS app, COUNT(*) AS beats,
               COUNT(*) FILTER (WHERE language IS NOT NULL) AS coding
        FROM heartbeats
        WHERE user_id = %s AND (ts AT TIME ZONE 'UTC')::date = %s
        GROUP BY app_name
        ORDER BY beats DESC
        """,
        (user_id, day),
    ).fetchall()

    total = sum(r[1] for r in rows)
    coding = sum(r[2] for r in rows)
    return {
        "total": total,
        "coding": coding,
        "top_app": rows[0][0] if rows else "no recorded activity",
        "top_app_beats": rows[0][1] if rows else 0,
        "apps": len(rows),
        # Heartbeats arrive every 30s, so 120 beats is roughly an hour.
        "hours": round(total / 120.0, 1),
    }


def build_row(name: str, facts: dict, day: date, rng: random.Random) -> dict:
    persona = PERSONAS.get(name, DEFAULT_PERSONA)
    bias = persona["bias"]

    if facts["total"] == 0:
        scores = {d: 0 for d in DIMENSIONS}
        summary = f"{name} recorded no tracked activity on {day}."
        blockers = ["No activity recorded — check the tracker is running"]
        highlights: list[str] = []
        evidence = [
            {"score_key": d, "citation": f"No heartbeats recorded on {day}"}
            for d in DIMENSIONS
        ]
        return {"scores": scores, "summary": summary, "evidence": evidence}

    # Volume drives progress/consistency; language presence drives difficulty;
    # app mix drives collaboration.
    volume = facts["hours"]
    coding_ratio = facts["coding"] / facts["total"]

    scores = {
        "progress": clamp(int(round(4 + volume * 0.9)) + bias + rng.randint(-1, 1)),
        "difficulty_handled": clamp(
            int(round(4 + volume * 0.7 + coding_ratio * 2)) + bias + rng.randint(-1, 1)
        ),
        "collaboration": clamp(
            int(round(5 + facts["apps"] * 0.6 + rng.randint(-1, 2))) + bias
        ),
        "consistency": clamp(int(round(4 + volume * 0.8)) + rng.randint(-1, 1)),
    }

    top = facts["top_app"]
    beats = facts["top_app_beats"]
    cited_app = f"{top}: {beats} heartbeats"

    evidence = [
        {"score_key": "progress", "citation": f"{cited_app}, ~{facts['hours']}h tracked"},
        {
            "score_key": "difficulty_handled",
            "citation": f"{facts['coding']} of {facts['total']} heartbeats carried coding detail",
        },
        {"score_key": "collaboration", "citation": f"{facts['apps']} distinct applications in use"},
        {"score_key": "consistency", "citation": f"{facts['total']} heartbeats across the day"},
    ]

    highlights = []
    if scores["progress"] >= 7:
        highlights.append(rng.choice(HIGHLIGHTS))
    if scores["collaboration"] >= 7:
        highlights.append("Spread activity across several applications, suggesting context switching")

    blockers = list(persona["blockers"])
    if scores["progress"] <= 4 and not blockers:
        blockers.append("Low tracked output — worth a check-in")

    summary = (
        f"{name} tracked ~{facts['hours']}h on {day}, mostly in {top}. "
        f"Progress scored {scores['progress']}/10 and consistency {scores['consistency']}/10. "
        + (f"Open blocker: {blockers[0]}" if blockers else "No blockers reported.")
    )

    return {"scores": scores, "summary": summary, "evidence": evidence}


def run(days: int, reset: bool) -> None:
    rng = random.Random(SEED)
    conn = psycopg.connect(os.environ["DATABASE_URL"])
    try:
        cohort = conn.execute(
            """
            SELECT DISTINCT u.id, u.name
            FROM cohort_members cm
            JOIN cohorts c ON c.id = cm.cohort_id
            JOIN users u ON u.id = cm.user_id
            ORDER BY u.name
            """
        ).fetchall()

        if not cohort:
            print("No cohort members found — run `python -m seed.seed` first.")
            return

        today = date.today()
        window = [today - timedelta(days=i) for i in range(days - 1, -1, -1)]
        inserted = 0

        print(f"Seeding assessments for {len(cohort)} volunteers over {days} days\n")
        for user_id, name in cohort:
            count = 0
            for day in window:
                if day.weekday() >= 5:  # weekdays only, matching a work week
                    continue

                facts = day_facts(conn, user_id, day)
                row = build_row(name, facts, day, rng)

                conn.execute(
                    """
                    INSERT INTO daily_assessments (user_id, date, scores, summary, evidence)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (user_id, date) DO UPDATE SET
                        scores   = EXCLUDED.scores,
                        summary  = EXCLUDED.summary,
                        evidence = EXCLUDED.evidence,
                        created_at = now()
                    """,
                    (user_id, day, Jsonb(row["scores"]), row["summary"], Jsonb(row["evidence"])),
                )
                count += 1
                inserted += 1

            print(f"  {name:<14} {count} assessment(s)")

        if reset:
            deleted = conn.execute(
                "DELETE FROM daily_assessments WHERE date < %s", (today - timedelta(days=days),)
            ).rowcount
            print(f"\nPruned {deleted} row(s) outside the {days}-day window.")

        conn.commit()

        total = conn.execute("SELECT COUNT(*) FROM daily_assessments").fetchone()[0]
        print(f"\nDone. {inserted} written, {total} total rows in daily_assessments.")
    finally:
        conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed daily_assessments rows.")
    parser.add_argument("--days", type=int, default=DAYS_DEFAULT)
    parser.add_argument(
        "--reset",
        action="store_true",
        help="delete rows outside the window instead of leaving them",
    )
    args = parser.parse_args()
    run(args.days, args.reset)