// localStorage cache for Gemini assessment results.
//
// The API has no endpoint that lists past assessments — POST /assess/<id>/<date>
// returns a job_id and GET /assess/<job_id>/result only knows about jobs held in
// the backend's in-memory dict, which is lost on restart. So the score trend on
// the student page is built from results this dashboard has generated, kept here
// so the chart survives reloads and accumulates through a demo session.

import type { AssessmentRecord, AssessmentResult } from '../api/client';

export interface CachedAssessment extends AssessmentResult {
  date: string;
}

export interface ScorePoint {
  date: string;
  progress: number;
  difficulty_handled: number;
  collaboration: number;
  consistency: number;
}

const KEY = 'runtime_assessments';

function readAll(): Record<string, CachedAssessment[]> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as Record<string, CachedAssessment[]>;
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, CachedAssessment[]>): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
    return true;
  } catch {
    // Quota exceeded or storage disabled — the chart still works for this session.
    return false;
  }
}

/** All cached assessments for a student, ascending by date. */
export function readAssessments(userId: string): CachedAssessment[] {
  const rows = readAll()[userId];
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r) => r && typeof r.date === 'string')
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
}

function scorePointsFor(rows: CachedAssessment[]): ScorePoint[] {
  return rows.map((r) => ({
    date: r.date,
    progress: r.progress,
    difficulty_handled: r.difficulty_handled,
    collaboration: r.collaboration,
    consistency: r.consistency,
  }));
}

export function readScorePoints(userId: string): ScorePoint[] {
  return scorePointsFor(readAssessments(userId));
}

/** Insert or replace the result for one date. Returns the updated list. */
export function saveAssessment(
  userId: string,
  date: string,
  result: AssessmentResult
): CachedAssessment[] {
  const all = readAll();
  const existing = Array.isArray(all[userId]) ? all[userId] : [];
  const merged = existing.filter((r) => r.date !== date);
  merged.push({ ...result, date });
  merged.sort((a, b) => a.date.localeCompare(b.date));
  all[userId] = merged;
  writeAll(all);
  return merged;
}

/** Sparkline-ready points for every student in a map of id -> list. */
export function scorePointsByUser(
  users: Array<{ user_id: string }>
): Record<string, ScorePoint[]> {
  const all = readAll();
  const out: Record<string, ScorePoint[]> = {};
  for (const u of users) {
    const rows = Array.isArray(all[u.user_id]) ? all[u.user_id] : [];
    out[u.user_id] = scorePointsFor(
      rows.filter((r) => r && typeof r.date === 'string')
    );
  }
  return out;
}

export function clearAllAssessments(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

const DIMENSIONS = [
  'progress',
  'difficulty_handled',
  'collaboration',
  'consistency',
] as const;

/**
 * Merge server history with anything cached locally.
 *
 * daily_assessments has no blockers/highlights columns, so a stored row can
 * only ever carry scores, summary and evidence. Results this browser triggered
 * live do have the full shape, so when the two describe the same date we keep
 * the richer local copy. Server rows win for scores, since they are the
 * canonical record.
 */
export function mergeAssessments(
  records: AssessmentRecord[],
  cached: CachedAssessment[]
): CachedAssessment[] {
  const local = new Map(cached.map((c) => [c.date, c]));

  const merged = records.map<AssessmentResult & { date: string }>((r) => {
    const prior = local.get(r.date);
    const scores = r.scores ?? {};

    // Be tolerant of a partially-populated scores object rather than rendering
    // NaN gaps in the chart.
    const pick = (key: (typeof DIMENSIONS)[number]): number =>
      typeof scores[key] === 'number' ? scores[key] : 0;

    return {
      date: r.date,
      progress: pick('progress'),
      difficulty_handled: pick('difficulty_handled'),
      collaboration: pick('collaboration'),
      consistency: pick('consistency'),
      blockers: prior?.blockers ?? [],
      highlights: prior?.highlights ?? [],
      evidence: r.evidence?.length ? r.evidence : (prior?.evidence ?? []),
    };
  });

  // Keep any locally-cached date the server has not returned yet (e.g. an
  // assessment just triggered, before it is visible via the API).
  for (const c of cached) {
    if (!merged.some((m) => m.date === c.date)) merged.push(c);
  }

  return merged.sort((a, b) => a.date.localeCompare(b.date));
}

export function toScorePoints(rows: CachedAssessment[]): ScorePoint[] {
  return scorePointsFor(rows);
}

/** Convert server records straight to chart points, ignoring the local cache. */
export function pointsFromRecords(records: AssessmentRecord[]): ScorePoint[] {
  return scorePointsFor(mergeAssessments(records, []));
}