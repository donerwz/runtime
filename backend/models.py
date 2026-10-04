from datetime import date
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class HeartbeatIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    app_name: str
    app_bundle: str | None = None
    focused: bool
    project: str | None = None
    language: str | None = None
    file_ext: str | None = None


class DailyHours(BaseModel):
    date: date
    tracked_minutes: int


class StudentSummary(BaseModel):
    user_id: UUID
    name: str
    today_min: int
    week_min: int


class AssessmentResult(BaseModel):
    progress: float
    difficulty_handled: float
    collaboration: float
    consistency: float
    blockers: list[str]
    highlights: list[str]
    evidence: list[dict]


class AssessmentRow(BaseModel):
    """A stored daily_assessments row, as returned by GET /assessments.

    Lets the dashboard rebuild the score trend from history instead of only
    from assessments it happens to have triggered in this browser.
    """
    date: date
    scores: dict
    summary: str | None = None
    evidence: list[dict] = []


class ShiftRow(BaseModel):
    date: date
    tracked_minutes: int
    approved_minutes: int | None
    status: Literal["pending", "approved", "adjusted"]


class ShiftPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")
    approved_minutes: int
    status: Literal["approved", "adjusted"]
