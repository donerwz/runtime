// DEV C — Phase 5
// Calendar heatmap of daily tracked minutes for one student.
//
// Props:
//   data: Array<{ date: string; tracked_minutes: number }>
//
// TODO:
//   1. Render a 2-row × 7-col grid (2 weeks) where each cell is a colored square.
//      Color scale: 0 min = light gray, 60+ min = dark green (use 4 steps).
//   2. Tooltip on hover: show the date and exact minutes.
//   3. Use Recharts or plain SVG — whichever is simpler for a grid heatmap.
//   4. No interactivity beyond tooltip is needed.

import React from 'react';

interface Props {
  data: Array<{ date: string; tracked_minutes: number }>;
}

export default function HoursHeatmap({ data }: Props) {
  // TODO: implement
  return <div />;
}
