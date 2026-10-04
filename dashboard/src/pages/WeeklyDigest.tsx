// Weekly digest view — supervisor-facing summary from Gemini's weekly synthesis.

import React, { useMemo, useState } from 'react';
import {
  errorMessage,
  getAssessments,
  getStudents,
  isPending,
  pollAssessmentResult,
  pollError,
  triggerWeeklySynthesis,
} from '../api/client';
import Sparkline from '../components/Sparkline';
import {
  pointsFromRecords,
  readScorePoints,
  type ScorePoint,
} from '../lib/assessments';
import { addDays, fmtLongDate, mondayOf, todayISO } from '../lib/dates';

const SUPERVISOR_KEY = 'runtime_supervisor_id';
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 180_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function initialSupervisorId(): string {
  return localStorage.getItem(SUPERVISOR_KEY) ?? '';
}

export default function WeeklyDigest() {
  const [supervisorId, setSupervisorId] = useState(initialSupervisorId);
  const [weekStart, setWeekStart] = useState(mondayOf(todayISO()));
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Names for the per-student section come from the cohort list; the scores
  // come from GET /assessments, falling back to this browser's cache.
  const [students, setStudents] = useState<Array<{ user_id: string; name: string }>>([]);
  const [pointsByUser, setPointsByUser] = useState<Record<string, ScorePoint[]>>({});

  React.useEffect(() => {
    getStudents()
      .then((rows) => setStudents(rows.map((r) => ({ user_id: r.user_id, name: r.name }))))
      .catch(() => setStudents([]));
  }, []);

  const weekEnd = addDays(weekStart, 6);

  React.useEffect(() => {
    if (students.length === 0 || !weekStart) return;
    let cancelled = false;

    void (async () => {
      const entries = await Promise.all(
        students.map(async (s) => {
          try {
            const records = await getAssessments(s.user_id, weekStart, weekEnd);
            return [s.user_id, pointsFromRecords(records)] as const;
          } catch {
            return [s.user_id, readScorePoints(s.user_id)] as const;
          }
        })
      );
      if (!cancelled) setPointsByUser(Object.fromEntries(entries));
    })();

    return () => {
      cancelled = true;
    };
  }, [students, weekStart, weekEnd]);

  const sparkData = useMemo(() => {
    return students.map((s) => {
      const inWeek = (pointsByUser[s.user_id] ?? []).filter(
        (p) => p.date >= weekStart && p.date <= weekEnd
      );
      const means = inWeek.map(
        (p) =>
          (p.progress + p.difficulty_handled + p.collaboration + p.consistency) / 4
      );
      return { ...s, count: inWeek.length, means };
    });
  }, [students, pointsByUser, weekStart, weekEnd]);

  async function generate() {
    const id = supervisorId.trim();
    if (!id) {
      setError('Enter your supervisor user ID to generate a digest.');
      return;
    }
    if (!weekStart) {
      setError('Pick the Monday of the week you want.');
      return;
    }

    localStorage.setItem(SUPERVISOR_KEY, id);
    setLoading(true);
    setError('');
    setSummary('');

    try {
      const { job_id } = await triggerWeeklySynthesis(id, weekStart);
      const deadline = Date.now() + POLL_TIMEOUT_MS;

      for (;;) {
        const polled = await pollAssessmentResult(job_id);

        const failed = pollError(polled);
        if (failed !== null) throw new Error(failed);

        if (!isPending(polled)) {
          const text = (polled as { summary?: unknown }).summary;
          if (typeof text !== 'string') throw new Error('Digest response had no summary');
          setSummary(text);
          return;
        }

        if (Date.now() > deadline) throw new Error('Digest timed out after 3 minutes');
        await sleep(POLL_INTERVAL_MS);
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  function exportDigest() {
    const body = [
      'Runtime — Weekly Digest',
      `Week of ${fmtLongDate(weekStart)}`,
      `Generated ${new Date().toLocaleString()}`,
      '',
      '---',
      '',
      summary,
      '',
    ].join('\n');

    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `runtime-digest-${weekStart}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const cachedTotal = sparkData.reduce((n, s) => n + s.count, 0);

  return (
    <>
      <div className="page-head">
        <div className="grow">
          <h1>Weekly digest</h1>
          <p className="sub">
            Gemini synthesises the week into a supervisor-facing narrative.
          </p>
        </div>
        {summary && (
          <button type="button" onClick={exportDigest}>
            Export .txt
          </button>
        )}
      </div>

      {error && <div className="banner banner-danger">{error}</div>}

      <div className="card">
        <div className="toolbar">
          <label className="field">
            Supervisor ID
            <input
              type="text"
              value={supervisorId}
              placeholder="your user_id UUID"
              spellCheck={false}
              style={{ width: 300 }}
              onChange={(e) => setSupervisorId(e.target.value)}
            />
          </label>
          <label className="field">
            Week of
            <input
              type="date"
              value={weekStart}
              max={todayISO()}
              onChange={(e) => setWeekStart(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn-primary"
            onClick={() => void generate()}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" /> Generating…
              </>
            ) : (
              'Generate digest'
            )}
          </button>
          <span className="hint">
            Pick a Monday. Your ID is remembered in this browser.
          </span>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Summary</h2>
          <div className="grow" />
          <span className="hint">
            {weekStart ? `Week of ${fmtLongDate(weekStart)}` : ''}
          </span>
        </div>

        {loading ? (
          <div className="loading-row">
            <span className="spinner" /> Gemini is reading the week — this usually takes 5–10
            seconds.
          </div>
        ) : summary ? (
          <div className="narrative">{summary}</div>
        ) : (
          <div className="empty">
            No digest yet. Enter your supervisor ID and generate one.
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>This week per student</h2>
          <div className="grow" />
          <span className="hint">
            Mean of the four rubric scores, from stored assessments
          </span>
        </div>

        {students.length === 0 ? (
          <div className="empty">No cohort data available.</div>
        ) : sparkData.every((s) => s.count === 0) ? (
          <div className="empty">
            No stored assessments for this week ({cachedTotal} in range). Run `python -m seed.seed_assessments`
            or trigger an assessment from a student's page.
          </div>
        ) : (
          <div>
            {sparkData.map((s) => (
              <div className="sparkline-row" key={s.user_id}>
                <span className="name">{s.name}</span>
                <span className="spark">
                  <Sparkline values={s.means} />
                </span>
                <span className="faint mono" style={{ width: 92, textAlign: 'right' }}>
                  {s.count === 0 ? 'no data' : `${s.count} ${s.count === 1 ? 'day' : 'days'}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}