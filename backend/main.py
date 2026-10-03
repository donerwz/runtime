# DEV A — Phase 0
# This is the FastAPI application entry point.
#
# TODO:
#   1. Create the FastAPI app instance.
#   2. Load .env with python-dotenv at startup.
#   3. Add a GET /health endpoint that returns {"status": "ok"}.
#   4. Include routers from routers/heartbeat.py, routers/hours.py,
#      routers/students.py, routers/assess.py once those are ready (Phase 2).
#   5. Wire up the slowapi rate limiter as middleware.
#   6. Run with: uvicorn backend.main:app --reload
#
# Acceptance check: uvicorn starts and GET /health returns 200 {"status": "ok"}.
