# DEV A — Phase 2
# POST /heartbeat endpoint.
#
# TODO:
#   1. Create an APIRouter with prefix="/heartbeat".
#   2. POST / handler:
#      - Depend on get_current_user() from auth.py (raises 401 if bad token).
#      - Validate the body against HeartbeatIn from models.py.
#      - Reject any unknown extra fields (use model_config = {"extra": "forbid"}).
#      - Insert a row into the heartbeats hypertable:
#          (ts=now() UTC, user_id, app_name, app_bundle, focused, project, language, file_ext)
#        All fields except app_name, focused, user_id, ts may be NULL.
#      - Return 201 {}.
#   3. Apply slowapi rate limit: 1 request per 30 seconds per user_id.
#
# Acceptance: curl -X POST /heartbeat with a valid token → row in DB.
#             Same token twice within 30s → 429.
#             Invalid token → 401.
