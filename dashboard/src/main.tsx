// DEV C — Phase 5
// App entry point. Sets up React Router with all pages.
//
// TODO:
//   1. Wrap the app in a React Router <BrowserRouter>.
//   2. Define routes:
//        /            → <Login />
//        /cohort      → <CohortView />  (protected — redirect to / if no token)
//        /student/:id → <StudentPage />
//        /shifts      → <ShiftApproval />
//        /digest      → <WeeklyDigest />
//   3. Store the supervisor token in localStorage under "tracker_token".
//      A simple ProtectedRoute wrapper that checks localStorage is enough for the demo.

import React from 'react';
import ReactDOM from 'react-dom/client';

// TODO: implement routing as described above

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* TODO: add router and routes */}
  </React.StrictMode>
);
