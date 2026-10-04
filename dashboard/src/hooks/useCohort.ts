import { useCallback, useEffect, useMemo, useState } from 'react';
import { getStudents, errorMessage } from '../api/client';
import type { StudentSummary } from '../api/client';
import { ATTENTION_WEEK_MIN, type SortKey } from '../components/StudentTable';

export type SortDir = 'asc' | 'desc';

/**
 * Loads the cohort and owns sorting. Shared by the home page (truncated view)
 * and the full cohort page so both stay in step.
 */
export function useCohort() {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
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

  const onSort = useCallback(
    (key: SortKey) => {
      setByAttention(false);
      if (key === sortKey) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir(key === 'name' ? 'asc' : 'desc');
      }
    },
    [sortKey]
  );

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

  return {
    students,
    sorted,
    loading,
    error,
    reload: load,
    sortKey,
    sortDir,
    byAttention,
    setByAttention,
    onSort,
    flagged,
  };
}
