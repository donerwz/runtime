import React from 'react';
import type { StudentSummary } from '../api/client';
import { fmtMinutes } from '../lib/dates';

/** Below this many minutes in the current week a student is flagged. */
export const ATTENTION_WEEK_MIN = 300;

export type SortKey = 'name' | 'today_min' | 'week_min';

interface Props {
  students: StudentSummary[];
  onSelect: (userId: string) => void;
  sortKey?: SortKey;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: SortKey) => void;
}

const COLUMNS: Array<{ key: SortKey; label: string; numeric: boolean }> = [
  { key: 'name', label: 'Name', numeric: false },
  { key: 'today_min', label: 'Today', numeric: true },
  { key: 'week_min', label: 'This week', numeric: true },
];

export default function StudentTable({
  students,
  onSelect,
  sortKey,
  sortDir = 'asc',
  onSort,
}: Props) {
  if (students.length === 0) {
    return <div className="empty">No students in this cohort yet.</div>;
  }

  function headerFor(key: SortKey, label: string, numeric: boolean) {
    const isSorted = sortKey === key;
    const arrow = isSorted ? <span className="arrow">{sortDir === 'asc' ? '↑' : '↓'}</span> : null;
    if (!onSort) {
      return (
        <th key={key} className={numeric ? 'num' : undefined}>
          {label}
        </th>
      );
    }
    return (
      <th
        key={key}
        className={`sortable${numeric ? ' num' : ''}`}
        onClick={() => onSort(key)}
        aria-sort={isSorted ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      >
        {label}
        {arrow}
      </th>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {COLUMNS.map((c) => headerFor(c.key, c.label, c.numeric))}
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => {
            const needsAttention = s.week_min < ATTENTION_WEEK_MIN;
            return (
              <tr
                key={s.user_id}
                className="clickable"
                onClick={() => onSelect(s.user_id)}
                title={`View ${s.name}`}
              >
                <td style={{ fontWeight: 500 }}>{s.name}</td>
                <td className="num mono">{fmtMinutes(s.today_min)}</td>
                <td className="num mono">{fmtMinutes(s.week_min)}</td>
                <td>
                  {needsAttention ? (
                    <span className="badge badge-warn">Needs attention</span>
                  ) : (
                    <span className="badge badge-good">On track</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}