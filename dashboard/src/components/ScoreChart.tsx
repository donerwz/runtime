import React from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fmtShortDate } from '../lib/dates';
import type { ScorePoint } from '../lib/assessments';

export type { ScorePoint };

interface Props {
  assessments: ScorePoint[];
}

const SERIES: Array<{ key: keyof Omit<ScorePoint, 'date'>; label: string; color: string }> = [
  { key: 'progress', label: 'Progress', color: '#0a0a0b' },
  { key: 'difficulty_handled', label: 'Difficulty handled', color: '#2563eb' },
  { key: 'collaboration', label: 'Collaboration', color: '#7c3aed' },
  { key: 'consistency', label: 'Consistency', color: '#c2410c' },
];

const EMPTY_HEIGHT = 260;

export default function ScoreChart({ assessments }: Props) {
  if (assessments.length === 0) {
    return (
      <div className="empty" style={{ height: EMPTY_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        No assessments yet — run one to start the trend.
      </div>
    );
  }

  const data = assessments.map((a) => ({ ...a, label: fmtShortDate(a.date) }));

  return (
    <ResponsiveContainer width="100%" height={EMPTY_HEIGHT}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: -18 }}>
        <CartesianGrid stroke="#e3e3e6" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#6b6b73' }}
          tickLine={false}
          axisLine={{ stroke: '#e3e3e6' }}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 10]}
          ticks={[0, 2, 4, 6, 8, 10]}
          tick={{ fontSize: 11, fill: '#6b6b73' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            border: '1px solid #e3e3e6',
            borderRadius: 8,
            fontSize: 12,
            background: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
          labelStyle={{ fontWeight: 600, marginBottom: 4 }}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="plainline" iconSize={14} />
        {SERIES.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 0, fill: s.color }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}