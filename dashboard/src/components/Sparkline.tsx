import React from 'react';

interface Props {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  domainMax?: number;
}

/** Minimal inline-SVG sparkline. Scores are on a 0–10 scale by default. */
export default function Sparkline({
  values,
  width = 120,
  height = 28,
  color = '#0a0a0b',
  domainMax = 10,
}: Props) {
  if (values.length === 0) return null;

  const pad = 2;
  const usable = Math.max(1, values.length - 1);
  const span = Math.max(1e-6, domainMax);
  const stepX = usable === 0 ? 0 : (width - pad * 2) / usable;
  const toY = (v: number) => height - pad - (Math.max(0, Math.min(v, domainMax)) / span) * (height - pad * 2);

  const points = values.map((v, i) => `${pad + i * stepX},${toY(v)}`).join(' ');
  const single = values.length === 1;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Trend across ${values.length} assessment${values.length === 1 ? '' : 's'}`}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {single ? (
        <circle cx={pad} cy={toY(values[0])} r={3} fill={color} />
      ) : (
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={1.75}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}