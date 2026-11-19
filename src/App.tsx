import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { BrandMark } from './components/BrandMark';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { AppLayout } from './layouts/AppLayout';
import { AchievementsPage } from './pages/AchievementsPage';
import { ForgotPasswordPage, LoginPage, RegisterPage } from './pages/AuthPages';
import { ArchivePage } from './pages/ArchivePage';
import { BlessingDetailPage } from './pages/BlessingDetailPage';
import { DashboardPage } from './pages/DashboardPage';
import { FriendsPage } from './pages/FriendsPage';
import { InboxPage } from './pages/InboxPage';
import { LandingPage } from './pages/LandingPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { ProfilePage } from './pages/ProfilePage';
import { PublicFeedPage } from './pages/PublicFeedPage';
import { RequestsPage } from './pages/RequestsPage';
import { SendBlessingPage } from './pages/SendBlessingPage';
import { SettingsPage } from './pages/SettingsPage';

const FullScreenLoader: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6] dark:bg-[#111318] gap-4">
    <BrandMark size="lg" />
    <p className="text-xs font-mono text-stone-500 dark:text-stone-400">
      Preparing the blessing desk...
    </p>
  </div>
);

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowIncompleteOnboarding?: boolean;
}> = ({ children, allowIncompleteOnboarding = false }) => {
  const { authUser, profile, loading } = useAuth();

  if (loading) return <FullScreenLoader />;
  if (!authUser) return <Navigate to="/login" replace />;
  if (!profile) return <FullScreenLoader />;

  if (!allowIncompleteOnboarding && !profile.onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authUser, profile, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (authUser && profile) {
    return (
      <Navigate to={profile.onboardingComplete ? '/dashboard' : '/onboarding'} replace />
    );
  }
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route
        path="/onboarding"
        element={
          <ProtectedRoute allowIncompleteOnboarding>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/send"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SendBlessingPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inbox"
        element={
          <ProtectedRoute>
            <AppLayout>
              <InboxPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/friends"
        element={
          <ProtectedRoute>
            <AppLayout>
              <FriendsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/feed"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PublicFeedPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests"
        element={
          <ProtectedRoute>
            <AppLayout>
              <RequestsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/archive"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ArchivePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/achievements"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AchievementsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ProfilePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/u/:username"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ProfilePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SettingsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route path="/b/:blessingId" element={<BlessingDetailPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
