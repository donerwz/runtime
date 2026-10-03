# DEV A — Phase 2
# GET /hours endpoint.
#
# TODO:
#   1. Create an APIRouter with prefix="/hours".
#   2. GET / handler with query params: user_id (UUID), from (date), to (date).
#      - Depend on get_current_user() — any authenticated user can query.
#      - Call the SQL view/function from migrations/001_init.sql that computes
#        tracked minutes per user per day (gap-capped at 2 min).
#      - Return list[DailyHours] from models.py.
#   3. Return an empty list (not 404) if no data exists for the range.
#
# See migrations/001_init.sql for the hours computation logic.
