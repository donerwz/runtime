import React from 'react';
import type { DailyHours } from '../api/client';
import { dateRange, fromISODate, todayISO, addDays, fmtMinutes } from '../lib/dates';

interface Props {
  data: DailyHours[];
  /** Length of the grid in days. The two-week default matches the 2x7 layout. */
  days?: number;
  /** Last day of the grid. Defaults to today. */
  endDate?: string;
}

const STEPS: Array<{ min: number; color: string; label: string }> = [
  { min: 0, color: '#f0f0f1', label: '0m' },
  { min: 15, color: '#dcfce7', label: '15m' },
  { min: 30, color: '#86efac', label: '30m' },
  { min: 60, color: '#16a34a', label: '60m' },
];

function colorFor(minutes: number): string {
  let color = STEPS[0].color;
  for (const step of STEPS) {
    if (minutes >= step.min) color = step.color;
  }
  return color;
}

export default function HoursHeatmap({ data, days = 14, endDate = todayISO() }: Props) {
  // The SQL groups only days that have heartbeats, so short days are missing
  // from the response rather than reported as zero. Densify before rendering,
  // otherwise the grid silently comes back with holes in it.
  const byDate = new Map(data.map((d) => [d.date, d.tracked_minutes]));
  const dates = dateRange(addDays(endDate, -(days - 1)), endDate);

  const total = dates.reduce((sum, d) => sum + (byDate.get(d) ?? 0), 0);
  const activeDays = dates.filter((d) => (byDate.get(d) ?? 0) > 0).length;

  const first = dates[0];
  const last = dates[dates.length - 1];
  const rangeLabel = first && last
    ? `${fromISODate(first).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })} – ${fromISODate(last).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`
    : '';

  const cells = dates.map((iso, i) => {
    const minutes = byDate.get(iso) ?? 0;
    const label = fromISODate(iso).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    return { iso, minutes, label, row: Math.floor(i / 7) };
  });

  const rows = Array.from(new Set(cells.map((c) => c.row)));

  return (
    <div>
      <div className="heatmap">
        {rows.map((row) => (
          <div className="heatmap-row" key={row}>
            {cells
              .filter((c) => c.row === row)
              .map((c) => (
                <div
                  key={c.iso}
                  className="heatmap-cell"
                  style={{ background: colorFor(c.minutes) }}
                  title={`${c.label} — ${fmtMinutes(c.minutes)}`}
                  aria-label={`${c.label}: ${fmtMinutes(c.minutes)}`}
                />
              ))}
          </div>
        ))}
      </div>

      <div
        className="toolbar"
        style={{ marginTop: 14, alignItems: 'center' }}
      >
        <div className="heatmap-legend">
          <span>Less</span>
          <span className="swatch-row">
            {STEPS.map((s) => (
              <span
                className="swatch"
                key={s.min}
                style={{ background: s.color }}
                title={s.label}
              />
            ))}
          </span>
          <span>More</span>
        </div>
        <span className="hint">
          {fmtMinutes(total)} across {activeDays} active {activeDays === 1 ? 'day' : 'days'}
          {rangeLabel ? ` · ${rangeLabel}` : ''}
        </span>
      </div>
    </div>
  );
}