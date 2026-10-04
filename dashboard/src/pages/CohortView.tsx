// Cohort overview page — the main supervisor landing screen.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudents, errorMessage } from '../api/client';
import type { StudentSummary } from '../api/client';
import StudentTable, { ATTENTION_WEEK_MIN, type SortKey } from '../components/StudentTable';

type Dir = 'asc' | 'desc';

export default function CohortView() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<Dir>('asc');
  const [byAttention, setByAttention] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setStudents(await getStudents());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function onSort(key: SortKey) {
    setByAttention(false);
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  }

  const sorted = useMemo(() => {
    const rows = students.slice();
    if (byAttention) {
      // Flagged students first, then whoever has logged the fewest minutes.
      rows.sort((a, b) => {
        const flag = (s: StudentSummary) => (s.week_min < ATTENTION_WEEK_MIN ? 1 : 0);
        const byFlag = flag(b) - flag(a);
        if (byFlag !== 0) return byFlag;
        return a.week_min - b.week_min;
      });
      return rows;
    }

    const dir = sortDir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name) * dir;
      return (a[sortKey] - b[sortKey]) * dir;
    });
    return rows;
  }, [students, sortKey, sortDir, byAttention]);

  const flagged = students.filter((s) => s.week_min < ATTENTION_WEEK_MIN).length;

  return (
    <>
      <div className="page-head">
        <div className="grow">
          <h1>Cohort</h1>
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
        <button type="button" onClick={() => void load()}>
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