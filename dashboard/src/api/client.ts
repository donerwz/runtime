// DEV C — Phase 5
// Typed API client. All fetch calls go through here — no inline fetch() elsewhere.
// Read api-contract.md for every endpoint shape before implementing.
//
// Base URL: "/api" (proxied to FastAPI by vite.config.ts in dev).
//
// TODO: Implement the following async functions:
//
//   getStudents(token): Promise<StudentSummary[]>
//     GET /api/students — supervisor cohort overview
//
//   getHours(token, userId, from, to): Promise<DailyHours[]>
//     GET /api/hours?user_id=...&from=...&to=...
//
//   triggerAssessment(token, userId, date): Promise<{ job_id: string }>
//     POST /api/assess/<userId>/<date>
//
//   pollAssessmentResult(token, jobId): Promise<AssessmentResult | { status: "pending" }>
//     GET /api/assess/<jobId>/result
//
//   getShifts(token, userId, from, to): Promise<Shift[]>
//     GET /api/shifts?user_id=...&from=...&to=...
//
//   approveShift(token, userId, date, approvedMinutes): Promise<void>
//     PATCH /api/shifts/<userId>/<date>
//
// Types (mirror api-contract.md exactly):
//
//   interface StudentSummary { user_id: string; name: string; today_min: number; week_min: number }
//   interface DailyHours     { date: string; tracked_minutes: number }
//   interface AssessmentResult { progress: number; difficulty_handled: number; collaboration: number;
//                                consistency: number; blockers: string[]; highlights: string[];
//                                evidence: Array<{ score_key: string; citation: string }> }
//   interface Shift          { date: string; tracked_minutes: number; approved_minutes: number | null;
//                              status: "pending" | "approved" | "adjusted" }

const BASE = '/api';

function headers(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// TODO: implement each function above
export {};
