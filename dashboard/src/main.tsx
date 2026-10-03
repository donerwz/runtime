import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import CohortView from './pages/CohortView';
import StudentPage from './pages/StudentPage';
import ShiftApproval from './pages/ShiftApproval';
import WeeklyDigest from './pages/WeeklyDigest';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('tracker_token');
  return token ? <>{children}</> : <Navigate to="/" replace />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cohort" element={<ProtectedRoute><CohortView /></ProtectedRoute>} />
        <Route path="/student/:id" element={<ProtectedRoute><StudentPage /></ProtectedRoute>} />
        <Route path="/shifts" element={<ProtectedRoute><ShiftApproval /></ProtectedRoute>} />
        <Route path="/digest" element={<ProtectedRoute><WeeklyDigest /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
