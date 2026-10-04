// Shift approval page. Supervisor reviews and approves/adjusts daily hours.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  approveShift,
  errorMessage,
  getShifts,
  getStudents,
} from '../api/client';
import type { Shift, StudentSummary } from '../api/client';
import { addDays, fmtMinutes, todayISO } from '../lib/dates';

const DEFAULT_RANGE_DAYS = 14;

const STATUS_BADGE: Record<Shift['status'], { cls: string; label: string }> = {
  pending: { cls: 'badge-warn', label: 'Pending' },
  approved: { cls: 'badge-good', label: 'Approved' },
  adjusted: { cls: 'badge-neutral', label: 'Adjusted' },
};

export default function ShiftApproval() {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [userId, setUserId] = useState('');
  const [from, setFrom] = useState(addDays(todayISO(), -(DEFAULT_RANGE_DAYS - 1)));
  const [to, setTo] = useState(todayISO());

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    getStudents()
      .then((rows) => {
        setStudents(rows);
        setUserId((cur) => cur || rows[0]?.user_id || '');
      })
      .catch((e) => setError(errorMessage(e)));
  }, []);

  const load = useCallback(async () => {
    if (!userId || !from || !to) {
      setShifts([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const rows = await getShifts(userId, from, to);
      setShifts(rows);
      // Seed the editable column with what is already stored, falling back to
      // the tracked total so a pending row can be approved without typing.
      const next: Record<string, string> = {};
      for (const r of rows) next[r.date] = String(r.approved_minutes ?? r.tracked_minutes);
      setDrafts(next);
    } catch (e) {
      setError(errorMessage(e));
      setShifts([]);
    } finally {
      setLoading(false);
    }
  }, [userId, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    let tracked = 0;
    let approved = 0;
    let pending = 0;
    for (const s of shifts) {
      tracked += s.tracked_minutes;
      approved += s.approved_minutes ?? 0;
      if (s.status === 'pending') pending += 1;
    }
    return { tracked, approved, pending };
  }, [shifts]);

  async function onApprove(row: Shift) {
    const raw = drafts[row.date] ?? String(row.approved_minutes ?? row.tracked_minutes);
    const minutes = Number(raw);

    if (raw.trim() === '' || !Number.isFinite(minutes) || minutes < 0) {
      setError(`Enter a valid number of minutes for ${row.date}.`);
      return;
    }

    const rounded = Math.round(minutes);
    // "adjusted" means the supervisor moved the hours away from what was tracked,
    // so compare against tracked_minutes. This keeps re-approving idempotent: an
    // already-adjusted row stays adjusted, and a row reset to the tracked total
    // flips back to a plain approval.
    const status: 'approved' | 'adjusted' =
      rounded === row.tracked_minutes ? 'approved' : 'adjusted';

    setSaving((s) => ({ ...s, [row.date]: true }));
    setError('');
    setNotice('');
    try {
      await approveShift(userId, row.date, rounded, status);
      setNotice(`${row.date} ${status} — ${fmtMinutes(rounded)}.`);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving((s) => ({ ...s, [row.date]: false }));
    }
  }

  return (
    <>
      <div className="page-head">
        <div className="grow">
          <h1>Shift approval</h1>
          <p className="sub">
            {shifts.length === 0
              ? 'No shifts in range.'
              : `${shifts.length} ${shifts.length === 1 ? 'shift' : 'shifts'} · ${fmtMinutes(totals.tracked)} tracked · ${fmtMinutes(totals.approved)} approved · ${totals.pending} pending`}
          </p>
        </div>
        <button type="button" onClick={() => void load()} disabled={!userId || loading}>
          Refresh
        </button>
      </div>

      {error && <div className="banner banner-danger">{error}</div>}
      {notice && <div className="banner">{notice}</div>}

      <div className="card">
        <div className="toolbar" style={{ marginBottom: 18 }}>
          <label className="field">
            Student
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              style={{ minWidth: 190 }}
            >
              {students.length === 0 && <option value="">Loading…</option>}
              {students.map((s) => (
                <option key={s.user_id} value={s.user_id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            From
            <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="field">
            To
            <input type="date" value={to} min={from} max={todayISO()} onChange={(e) => setTo(e.target.value)} />
          </label>
          <span className="hint">
            Changing the date range to a day with no stored shift will not create one.
          </span>
        </div>

        {loading ? (
          <div className="loading-row">
            <span className="spinner" /> Loading shifts…
          </div>
        ) : shifts.length === 0 ? (
          <div className="empty">No shifts recorded for this student in that range.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="num">Tracked</th>
                  <th className="num">Approved (min)</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {shifts.map((row) => {
                  const badge = STATUS_BADGE[row.status];
                  const busy = Boolean(saving[row.date]);
                  const draft = Number(drafts[row.date] ?? '');
                  const edited =
                    drafts[row.date] !== undefined &&
                    Number.isFinite(draft) &&
                    draft !== row.tracked_minutes;
                  return (
                    <tr key={row.date} className={row.status === 'pending' ? 'row-pending' : undefined}>
                      <td className="mono">{row.date}</td>
                      <td className="num mono">{fmtMinutes(row.tracked_minutes)}</td>
                      <td className="num">
                        <input
                          type="number"
                          min={0}
                          value={drafts[row.date] ?? ''}
                          aria-label={`Approved minutes for ${row.date}`}
                          onChange={(e) =>
                            setDrafts((d) => ({ ...d, [row.date]: e.target.value }))
                          }
                        />
                      </td>
                      <td>
                        <span className={`badge ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn-sm"
                          disabled={busy}
                          onClick={() => void onApprove(row)}
                        >
                          {busy ? 'Saving…' : edited ? 'Save as adjusted' : 'Approve'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}