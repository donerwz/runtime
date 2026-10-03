# DEV A — Phase 4
# Assessment endpoints. See api-contract.md for the full shape.
#
# TODO:
#   1. Create an APIRouter with prefix="/assess".
#
#   2. POST /{user_id}/{date}:
#      - Require supervisor token (require_supervisor() dependency).
#      - Kick off assess_day(user_id, date) from gemini.py as a background task
#        (FastAPI BackgroundTasks or asyncio.create_task).
#      - Return 202 { "job_id": <uuid> } immediately.
#
#   3. GET /{job_id}/result:
#      - Look up the job status in a simple in-memory dict (or a jobs table if you prefer).
#      - Return 202 {"status": "pending"} while running.
#      - Return 200 AssessmentResult (from models.py) when complete.
#      - Return 200 {"status": "error", "detail": str} if Gemini failed after retry.
#
#   4. Also expose POST /weekly/{supervisor_id}/{week_start} that calls weekly_synthesis().
