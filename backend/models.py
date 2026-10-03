# DEV A — Phase 2
# Pydantic request/response models. Dev C (dashboard) uses api-contract.md
# as the source of truth for types — keep this file in sync with that doc.
#
# TODO: Define the following Pydantic BaseModel classes:
#
#   HeartbeatIn:
#     app_name:   str              # required — e.g. "Figma", "Visual Studio Code"
#     app_bundle: str | None       # macOS bundle ID; None from non-macOS agents
#     focused:    bool
#     project:    str | None       # VS Code only: workspace folder name
#     language:   str | None       # VS Code only: language id
#     file_ext:   str | None       # VS Code only: file extension
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
