// Home page. The cohort list is clipped to half the viewport and scrolls; the
// full list lives on its own page, and the weekly digest sits underneath.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import StudentTable from '../components/StudentTable';
import ScrollPanel from '../components/ScrollPanel';
import WeeklyDigestPanel from '../components/WeeklyDigestPanel';
import { useCohort } from '../hooks/useCohort';
import { ATTENTION_WEEK_MIN } from '../components/StudentTable';

export default function Home() {
  const navigate = useNavigate();
  const { sorted, loading, error, reload, sortKey, sortDir, byAttention, setByAttention, onSort, flagged, students } =
    useCohort();

  return (
    <>
      <div className="page-head">
        <div className="grow">
          <h1>Home</h1>
          <p className="sub">
            {students.length === 0
              ? 'No students yet.'
              : `${students.length} ${students.length === 1 ? 'volunteer' : 'volunteers'} · ${flagged} flagged`}
          </p>
        </div>
        <button
          type="button"
          className={byAttention ? 'btn-primary' : undefined}
          onClick={() => setByAttention((v) => !v)}
          aria-pressed={byAttention}
          title={`Flag anyone under ${ATTENTION_WEEK_MIN} min this week, fewest minutes first`}
        >
          Sort by needs attention
        </button>
        <button type="button" onClick={() => void reload()}>
          Refresh
        </button>
      </div>

      {error && <div className="banner banner-danger">{error}</div>}

      <div className="card">
        <div className="card-head">
          <h2>Cohort</h2>
          <div className="grow" />
          <span className="hint">
            {loading ? 'Loading…' : 'Scroll the list, or open it in full'}
          </span>
        </div>

        {loading ? (
          <div className="loading-row">
            <span className="spinner" /> Loading cohort…
          </div>
        ) : (
          <ScrollPanel maxHeight="50vh">
            <StudentTable
              students={sorted}
              onSelect={(id) => navigate(`/student/${id}`)}
              sortKey={byAttention ? undefined : sortKey}
              sortDir={sortDir}
              onSort={onSort}
            />
          </ScrollPanel>
        )}

        {!loading && students.length > 0 && (
          <div className="card-foot">
            <button type="button" onClick={() => navigate('/cohort')}>
              View full cohort
            </button>
          </div>
        )}
      </div>

      <WeeklyDigestPanel />
    </>
  );
}
