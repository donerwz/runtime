# DEV A — Phase 2
# GET /students endpoint (supervisor only).
#
# TODO:
#   1. Create an APIRouter with prefix="/students".
#   2. GET / handler:
#      - Depend on require_supervisor() from auth.py (raises 403 if not supervisor).
#      - Return all students in the supervisor's cohort with today's and this week's
#        tracked minutes — join cohort_members with the hours view.
#      - Return list[StudentSummary] from models.py.
#
# Dev C (dashboard) uses this endpoint for the cohort overview table.
# Shape is defined in api-contract.md.
