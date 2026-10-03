import uuid
from fastapi import APIRouter, BackgroundTasks, Depends

from backend.auth import require_supervisor

router = APIRouter(prefix="/assess")

# In-memory job store — fine for hackathon demo.
_jobs: dict[str, dict] = {}


async def _run_assessment(job_id: str, user_id: str, date: str):
    try:
        # TODO: Phase 4 — replace with gemini.assess_day(user_id, date)
        from backend.gemini import assess_day
        result = await assess_day(user_id, date)
        _jobs[job_id] = {"status": "done", "result": result}
    except Exception as e:
        _jobs[job_id] = {"status": "error", "detail": str(e)}


@router.post("/{user_id}/{date}", status_code=202)
async def trigger_assessment(
    user_id: str,
    date: str,
    background_tasks: BackgroundTasks,
    _supervisor=Depends(require_supervisor),
):
    job_id = str(uuid.uuid4())
    _jobs[job_id] = {"status": "pending"}
    background_tasks.add_task(_run_assessment, job_id, user_id, date)
    return {"job_id": job_id}


@router.get("/{job_id}/result")
async def get_result(job_id: str):
    job = _jobs.get(job_id)
    if not job:
        raise Exception("Job not found")
    if job["status"] == "pending":
        return {"status": "pending"}
    if job["status"] == "error":
        return {"status": "error", "detail": job["detail"]}
    return job["result"]


@router.post("/weekly/{supervisor_id}/{week_start}", status_code=202)
async def weekly_synthesis(
    supervisor_id: str,
    week_start: str,
    background_tasks: BackgroundTasks,
    _supervisor=Depends(require_supervisor),
):
    job_id = str(uuid.uuid4())
    _jobs[job_id] = {"status": "pending"}

    async def _run():
        try:
            from backend.gemini import weekly_synthesis as _synth
            result = await _synth(supervisor_id, week_start)
            _jobs[job_id] = {"status": "done", "result": {"summary": result}}
        except Exception as e:
            _jobs[job_id] = {"status": "error", "detail": str(e)}

    background_tasks.add_task(_run)
    return {"job_id": job_id}
