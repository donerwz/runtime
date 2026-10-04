import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import CohortView from './pages/CohortView';
import StudentPage from './pages/StudentPage';
import ShiftApproval from './pages/ShiftApproval';
import WeeklyDigest from './pages/WeeklyDigest';
import Layout from './components/Layout';
import './styles.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('tracker_token');
  if (!token) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/cohort"
          element={
            <ProtectedRoute>
              <CohortView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/:id"
          element={
            <ProtectedRoute>
              <StudentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shifts"
          element={
            <ProtectedRoute>
              <ShiftApproval />
            </ProtectedRoute>
          }
        />
        <Route
          path="/digest"
          element={
            <ProtectedRoute>
              <WeeklyDigest />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);