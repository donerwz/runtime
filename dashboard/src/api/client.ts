const BASE = '/api';

export interface StudentSummary {
  user_id: string;
  name: string;
  today_min: number;
  week_min: number;
}

export interface DailyHours {
  date: string;
  tracked_minutes: number;
}

export interface AssessmentResult {
  progress: number;
  difficulty_handled: number;
  collaboration: number;
  consistency: number;
  blockers: string[];
  highlights: string[];
  evidence: Array<{ score_key: string; citation: string }>;
}

/**
 * GET /assess/<job_id>/result has three outcomes. 'error' is real: assess.py
 * stores {"status":"error","detail":...} when Gemini fails, so a poller that
 * only checks for 'pending' would spin forever on a failed job.
 */
export type AssessmentPoll =
  | { status: 'pending' }
  | { status: 'error'; detail: string }
  | ({ status?: undefined } & AssessmentResult);

export function isPending(p: AssessmentPoll): p is { status: 'pending' } {
  return (p as { status?: string }).status === 'pending';
}

export function pollError(p: AssessmentPoll): string | null {
  const status = (p as { status?: string }).status;
  return status === 'error' ? (p as { detail: string }).detail ?? 'Assessment failed' : null;
}

export function isAssessmentResult(p: AssessmentPoll): p is AssessmentResult {
  return typeof (p as AssessmentResult).progress === 'number';
}

export interface WeeklySynthesisResult {
  summary: string;
}

/** A stored daily_assessments row, from GET /assessments. */
export interface AssessmentRecord {
  date: string;
  scores: Record<string, number>;
  summary: string | null;
  evidence: Array<{ score_key: string; citation: string }>;
}

export interface Shift {
  date: string;
  tracked_minutes: number;
  approved_minutes: number | null;
  status: 'pending' | 'approved' | 'adjusted';
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export class UnauthorizedError extends ApiError {
  constructor() {
    super(401, 'Invalid or expired token');
    this.name = 'UnauthorizedError';
  }
}

function headers(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function clearToken() {
  try {
    localStorage.removeItem('tracker_token');
  } catch {
    /* ignore */
  }
}

/** Drop the bad token and send the supervisor back to the login screen. */
function redirectToLogin() {
  clearToken();
  if (typeof window !== 'undefined' && window.location.pathname !== '/') {
    window.location.replace('/');
  }
}

async function req<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${BASE}${path}`, { ...init, headers: headers(token) });

  if (r.status === 401) {
    redirectToLogin();
    throw new UnauthorizedError();
  }
  if (!r.ok) {
    // A missing/unknown job_id hits a bare raise in assess.py, which FastAPI
    // turns into a 500 with a non-JSON body — so never assume JSON on failure.
    let detail = '';
    try {
      detail = ((await r.json()) as { detail?: string }).detail ?? '';
    } catch {
      /* body was not JSON */
    }
    throw new ApiError(r.status, detail || `${r.status} ${r.statusText}`);
  }

  if (r.status === 204) return {} as T;
  const text = await r.text();
  return (text ? JSON.parse(text) : {}) as T;
}

export function getToken(): string {
  return localStorage.getItem('tracker_token') ?? '';
}

/** Turn anything thrown by req()/fetch into something worth showing a user. */
export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return 'Unexpected error';
}

export async function getStudents(): Promise<StudentSummary[]> {
  return req(getToken(), '/students');
}

export async function getHours(userId: string, from: string, to: string): Promise<DailyHours[]> {
  return req(getToken(), `/hours?user_id=${userId}&from_=${from}&to=${to}`);
}

export async function triggerAssessment(userId: string, date: string): Promise<{ job_id: string }> {
  return req(getToken(), `/assess/${userId}/${date}`, { method: 'POST' });
}

/**
 * Stored assessments for a user. Added alongside the api-contract endpoints so
 * the score trend can be rebuilt from history rather than only from results
 * this browser happens to have triggered. Returns [] when there is no data.
 */
export async function getAssessments(
  userId: string,
  from: string,
  to: string
): Promise<AssessmentRecord[]> {
  return req(getToken(), `/assessments?user_id=${userId}&from_=${from}&to=${to}`);
}

export async function pollAssessmentResult(jobId: string): Promise<AssessmentPoll> {
  return req(getToken(), `/assess/${jobId}/result`);
}

export async function triggerWeeklySynthesis(
  supervisorId: string,
  weekStart: string
): Promise<{ job_id: string }> {
  return req(getToken(), `/assess/weekly/${supervisorId}/${weekStart}`, { method: 'POST' });
}

export async function getShifts(userId: string, from: string, to: string): Promise<Shift[]> {
  return req(getToken(), `/shifts?user_id=${userId}&from_=${from}&to=${to}`);
}

export async function approveShift(
  userId: string,
  date: string,
  approvedMinutes: number,
  status: 'approved' | 'adjusted'
): Promise<void> {
  await req(getToken(), `/shifts/${userId}/${date}`, {
    method: 'PATCH',
    body: JSON.stringify({ approved_minutes: approvedMinutes, status }),
  });
}