// DEV C — Phase 5
// Cohort overview page — the main supervisor landing screen.
//
// TODO:
//   1. On mount: call client.getStudents(token) and store result in state.
//   2. Render a <StudentTable /> (components/StudentTable.tsx) with the student list.
//   3. Add a "Sort by needs attention" button: sort descending by
//      (week_min < 300 ? 1 : 0) then by week_min ascending (fewest minutes first).
//   4. Clicking a student row navigates to /student/:id.
//   5. Show a loading spinner while fetching; show an error banner on failure.

import React from 'react';

export default function CohortView() {
  // TODO: implement
  return <div />;
}
