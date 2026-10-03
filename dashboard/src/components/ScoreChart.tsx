// DEV C — Phase 5
// Line chart showing a student's Gemini assessment scores over time.
//
// Props:
//   assessments: Array<{ date: string; progress: number; difficulty_handled: number;
//                         collaboration: number; consistency: number }>
//
// TODO:
//   1. Use Recharts <LineChart> with four lines (one per score dimension).
//   2. X-axis: date (short format "Jan 3"). Y-axis: 0–10.
//   3. Legend showing the four dimension names.
//   4. If assessments is empty, show "No assessments yet" centered in the chart area.

import React from 'react';

interface ScorePoint {
  date: string;
  progress: number;
  difficulty_handled: number;
  collaboration: number;
  consistency: number;
}

interface Props {
  assessments: ScorePoint[];
}

export default function ScoreChart({ assessments }: Props) {
  // TODO: implement
  return <div />;
}
