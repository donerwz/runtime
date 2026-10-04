// Individual student detail page. URL param: :id (user_id UUID).

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  errorMessage,
  getHours,
  getStudents,
  isPending,
  pollAssessmentResult,
  pollError,
  isAssessmentResult,
  triggerAssessment,
} from '../api/client';
import type { DailyHours } from '../api/client';
import HoursHeatmap from '../components/HoursHeatmap';
import ScoreChart from '../components/ScoreChart';
import {
  readAssessments,
  readScorePoints,
  saveAssessment,
  type CachedAssessment,
} from '../lib/assessments';
import { fmtLongDate, lastNDays, todayISO } from '../lib/dates';

const HEATMAP_DAYS = 14;
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 120_000;

const DIMENSIONS: Array<{ key: keyof CachedAssessment; label: string }> = [
  { key: 'progress', label: 'Progress' },
  { key: 'difficulty_handled', label: 'Difficulty handled' },
  { key: 'collaboration', label: 'Collaboration' },
  { key: 'consistency', label: 'Consistency' },
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fillClass(value: number): string {
  if (value < 4) return 'low';
  if (value >= 8) return 'high';
  return '';
}

export default function StudentPage() {
  const { id = '' } = useParams<{ id: string }>();

  const [name, setName] = useState('');
  const [hours, setHours] = useState<DailyHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [assessments, setAssessments] = useState<CachedAssessment[]>([]);
  const [assessDate, setAssessDate] = useState(todayISO());
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState('');

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [students, hoursRows] = await Promise.all([
        getStudents(),
        getHours(id, lastNDays(HEATMAP_DAYS)[0], todayISO()),
      ]);
      if (!mounted.current) return;
      setName(students.find((s) => s.user_id === id)?.name ?? '');
      setHours(hoursRows);
    } catch (e) {
      if (mounted.current) setError(errorMessage(e));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setAssessments(readAssessments(id));
    void load();
  }, [id, load]);

  const scorePoints = useMemo(() => readScorePoints(id), [assessments, id]);
  const latest = assessments.length > 0 ? assessments[assessments.length - 1] : null;
  const [openEvidence, setOpenEvidence] = useState<Record<number, boolean>>({});

  async function runAssessment() {
    if (!id || running) return;
    setRunning(true);
    setRunError('');
    try {
      const { job_id } = await triggerAssessment(id, assessDate);

      const deadline = Date.now() + POLL_TIMEOUT_MS;
      for (;;) {
        const polled = await pollAssessmentResult(job_id);

        const failed = pollError(polled);
        if (failed !== null) throw new Error(failed);
        if (!isPending(polled)) {
          if (!isAssessmentResult(polled)) throw new Error('Unexpected assessment payload');
          const updated = saveAssessment(id, assessDate, polled);
          if (mounted.current) setAssessments(updated);
          return;
        }

        if (Date.now() > deadline) throw new Error('Assessment timed out after 2 minutes');
        await sleep(POLL_INTERVAL_MS);
      }
    } catch (e) {
      if (mounted.current) setRunError(errorMessage(e));
    } finally {
      if (mounted.current) setRunning(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div className="grow">
          <Link to="/cohort" className="backlink">
            ← Back to cohort
          </Link>
          <h1 style={{ marginTop: 8 }}>{name || 'Student'}</h1>
          <p className="sub mono">{id}</p>
        </div>
        <button type="button" onClick={() => void load()}>
          Refresh
        </button>
      </div>

      {error && <div className="banner banner-danger">{error}</div>}

      <div className="card">
        <div className="card-head">
          <h2>Tracked hours</h2>
          <div className="grow" />
          <span className="hint">Last {HEATMAP_DAYS} days</span>
        </div>
        {loading ? (
          <div className="loading-row">
            <span className="spinner" /> Loading hours…
          </div>
        ) : (
          <HoursHeatmap data={hours} days={HEATMAP_DAYS} />
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Assessment scores</h2>
          <div className="grow" />
          <span className="hint">Advisory feedback, not grades</span>
        </div>
        <ScoreChart assessments={scorePoints} />
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Latest assessment</h2>
          <div className="grow" />
          <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <span style={{ whiteSpace: 'nowrap' }}>Date</span>
            <input
              type="date"
              value={assessDate}
              max={todayISO()}
              onChange={(e) => setAssessDate(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn-primary"
            onClick={() => void runAssessment()}
            disabled={running || !assessDate}
          >
            {running ? (
              <>
                <span className="spinner" /> Running…
              </>
            ) : (
              'Run assessment'
            )}
          </button>
        </div>

        {runError && <div className="banner banner-danger">{runError}</div>}

        {!latest ? (
          <div className="empty">
            {running
              ? 'Gemini is scoring this day — usually a few seconds.'
              : 'No assessments cached for this student yet. Pick a date and run one.'}
          </div>
        ) : (
          <>
            <p className="faint" style={{ fontSize: 12, marginBottom: 14 }}>
              {fmtLongDate(latest.date)}
            </p>

            <div className="score-grid">
              {DIMENSIONS.map((d) => {
                const value = latest[d.key] as number;
                return (
                  <div className="score-item" key={d.key}>
                    <div className="label">{d.label}</div>
                    <div className="value">
                      {value}
                      <span className="of"> / 10</span>
                    </div>
                    <div className="score-track">
                      <div
                        className={`score-fill ${fillClass(value)}`}
                        style={{ width: `${Math.max(0, Math.min(10, value)) * 10}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <hr className="divider" />

            <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
              <div>
                <h3 style={{ marginBottom: 8 }}>Blockers</h3>
                {latest.blockers.length === 0 ? (
                  <p className="faint" style={{ fontSize: 13 }}>
                    None reported.
                  </p>
                ) : (
                  <ul className="bullet-list">
                    {latest.blockers.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 style={{ marginBottom: 8 }}>Highlights</h3>
                {latest.highlights.length === 0 ? (
                  <p className="faint" style={{ fontSize: 13 }}>
                    None reported.
                  </p>
                ) : (
                  <ul className="bullet-list">
                    {latest.highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <hr className="divider" />

            <div className="card-head">
              <h3>Evidence</h3>
              <div className="grow" />
              <span className="hint">
                {latest.evidence.length} cited · click to expand
              </span>
            </div>
            {latest.evidence.length === 0 ? (
              <p className="faint" style={{ fontSize: 13 }}>
                Gemini cited no evidence for this day.
              </p>
            ) : (
              <div className="evidence-list">
                {latest.evidence.map((ev, i) => {
                  const open = Boolean(openEvidence[i]);
                  return (
                    <div className="evidence-item" key={i}>
                      <button
                        type="button"
                        className="evidence-toggle"
                        aria-expanded={open}
                        onClick={() =>
                          setOpenEvidence((prev) => ({ ...prev, [i]: !prev[i] }))
                        }
                      >
                        <span className="faint">{open ? '▾' : '▸'}</span>
                        <span className="key">{ev.score_key}</span>
                        {!open && <span className="cite">{ev.citation}</span>}
                      </button>
                      {open && <div className="evidence-citation">{ev.citation}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}