# DEV A — Phase 1
# Factory functions for generating realistic fake data.
#
# TODO:
#
#   make_users() -> list[dict]
#     Return 1 supervisor + 5 volunteers with hashed tokens.
#     Use passlib bcrypt (same as auth.py) so generated tokens work with the API.
#
#   make_heartbeats(user_id, days=14) -> list[dict]
#     Simulate a developer working 2–6 hours/day on weekdays.
#     Each "session" is a burst of heartbeats every 30s for the session duration.
#     Mix: 3–4 different project names, languages (python, typescript, sql).
#     Include occasional 5–15 min gaps to test the 2-min idle cap in the SQL function.
#     Return list of dicts matching the heartbeats table columns.
#
#   make_shifts(user_id, heartbeats) -> list[dict]
#     Derive shift rows from heartbeats by calling tracked_minutes_per_day().
#     Set status="pending" for all.
