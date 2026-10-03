// DEV C — Phase 5
// Individual student detail page. URL param: :id (user_id UUID).
//
// TODO:
//   1. Read :id from useParams().
//   2. Fetch last 14 days of hours: client.getHours(token, id, from, to).
//   3. Render <HoursHeatmap /> (components/HoursHeatmap.tsx) with the hours data.
//   4. Render <ScoreChart /> (components/ScoreChart.tsx) — score trend over the week.
//      Poll GET /assess/<jobId>/result until resolved when an assessment is triggered.
//   5. Show app breakdown for the selected day: group heartbeats by app_name and
//      display as a small horizontal bar (e.g. "Figma 45min | VS Code 90min | Slack 20min").
//      Fetch from GET /hours with a new optional ?breakdown=true param (ask Dev A to add it).
//   6. Show the latest assessment's blockers, highlights, and evidence list.
//      Evidence items should be expandable (click to see the citation).
//   6. "Run assessment" button: calls client.triggerAssessment(), then polls for result.
//   7. "Back to cohort" link.

import React from 'react';

export default function StudentPage() {
  // TODO: implement
  return <div />;
}
