// DEV C — Phase 5
// Sortable table of students for the cohort overview page.
//
// Props:
//   students:  StudentSummary[]   (type from api/client.ts)
//   onSelect:  (userId: string) => void
//
// TODO:
//   1. Render a <table> with columns: Name | Today (min) | This Week (min) | Status.
//   2. Status column: "On track" if week_min >= 300, "Needs attention" if < 300.
//      Color "Needs attention" in amber/red.
//   3. Clicking a row calls onSelect(student.user_id).
//   4. Highlight the hovered row.
//   5. No external table library needed — plain HTML table with inline styles or CSS modules.

import React from 'react';

interface StudentSummary {
  user_id: string;
  name: string;
  today_min: number;
  week_min: number;
}

interface Props {
  students: StudentSummary[];
  onSelect: (userId: string) => void;
}

export default function StudentTable({ students, onSelect }: Props) {
  // TODO: implement
  return <table />;
}
