// Full cohort list — the same table as the home page, unclipped.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import StudentTable, { ATTENTION_WEEK_MIN } from '../components/StudentTable';
import { useCohort } from '../hooks/useCohort';

export default function FullCohort() {
  const navigate = useNavigate();
  const { sorted, loading, error, reload, sortKey, sortDir, byAttention, setByAttention, onSort, flagged, students } =
    useCohort();

  return (
    <>
      <div className="page-head">
        <div className="grow">
          <h1>Full cohort</h1>
          <p className="sub">
            {students.length === 0
              ? 'No students yet.'
              : `${students.length} ${students.length === 1 ? 'volunteer' : 'volunteers'} · ${flagged} flagged`}
          </p>
        </div>
        <button type="button" onClick={() => navigate('/')}>
          Back to home
        </button>
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
        {loading ? (
          <div className="loading-row">
            <span className="spinner" /> Loading cohort…
          </div>
        ) : (
          <StudentTable
            students={sorted}
            onSelect={(id) => navigate(`/student/${id}`)}
            sortKey={byAttention ? undefined : sortKey}
            sortDir={sortDir}
            onSort={onSort}
          />
        )}
      </div>
    </>
  );
}
