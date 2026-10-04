import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import FullCohort from './pages/FullCohort';
import StudentPage from './pages/StudentPage';
import ShiftApproval from './pages/ShiftApproval';
import Layout from './components/Layout';
import PageTransition from './components/PageTransition';
import './styles.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('tracker_token');
  if (!token) return <Navigate to="/login" replace />;
  return (
    <Layout>
      <PageTransition>{children}</PageTransition>
    </Layout>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PageTransition>
              <Login />
            </PageTransition>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cohort"
          element={
            <ProtectedRoute>
              <FullCohort />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
