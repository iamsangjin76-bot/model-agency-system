import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import ToastContainer from '@/components/ui/ToastContainer';
import ErrorBoundary from '@/components/ErrorBoundary';
import Spinner from '@/components/ui/Spinner';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import NotFoundPage from '@/pages/NotFoundPage';

// 인증 필요 라우트 래퍼
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Spinner size="xl" />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// 공개 라우트 래퍼 (로그인된 경우 대시보드로)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Spinner size="xl" />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />
      <Route path="/dashboard/*" element={
        <PrivateRoute>
          <DashboardPage />
        </PrivateRoute>
      } />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={
        <PrivateRoute>
          <NotFoundPage />
        </PrivateRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
          </AuthProvider>
          <ToastContainer />
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
