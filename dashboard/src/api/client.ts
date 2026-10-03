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

export interface Shift {
  date: string;
  tracked_minutes: number;
  approved_minutes: number | null;
  status: 'pending' | 'approved' | 'adjusted';
}

function headers(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function req<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${BASE}${path}`, { ...init, headers: headers(token) });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json() as Promise<T>;
}

export function getToken(): string {
  return localStorage.getItem('tracker_token') ?? '';
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

export async function pollAssessmentResult(
  jobId: string
): Promise<AssessmentResult | { status: 'pending' }> {
  return req(getToken(), `/assess/${jobId}/result`);
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
