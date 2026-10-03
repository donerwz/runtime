# DEV A — Phase 2
# Pydantic request/response models. Dev C (dashboard) uses api-contract.md
# as the source of truth for types — keep this file in sync with that doc.
#
# TODO: Define the following Pydantic BaseModel classes:
#
#   HeartbeatIn:
#     project: str
#     language: str
#     file_ext: str
#     focused: bool
#
#   DailyHours:
#     date: date
#     tracked_minutes: int
#
#   StudentSummary:
#     user_id: UUID
#     name: str
#     today_min: int
#     week_min: int
#
#   AssessmentResult:
#     progress: float           # 0-10
#     difficulty_handled: float
#     collaboration: float
#     consistency: float
#     blockers: list[str]
#     highlights: list[str]
#     evidence: list[dict]      # {"score_key": str, "citation": str}
#
#   ShiftPatch:
#     approved_minutes: int
#     status: Literal["approved", "adjusted"]
