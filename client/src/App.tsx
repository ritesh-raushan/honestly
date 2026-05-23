import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import BackgroundPattern from './components/layout/BackgroundPattern';
import FloatingShapes from './components/layout/FloatingShapes';
import LandingView from './components/views/LandingView';
import LoginView from './components/views/LoginView';
import SignupView from './components/views/SignupView';
import VerifyEmailView from './components/views/VerifyEmailView';
import ForgotPasswordView from './components/views/ForgotPasswordView';
import ResetPasswordView from './components/views/ResetPasswordView';
import DashboardView from './components/views/DashboardView';
import WriteView from './components/views/WriteView';
import SettingsView from './components/views/SettingsView';
import Toaster from './components/Toaster';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './stores/authStore';

function App() {
  const initialize = useAuthStore((state) => state.initialize);

  // Hydrate the auth session on app boot. If a valid refresh-token cookie
  // is present, the axios interceptor will silently refresh the access token.
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <BackgroundPattern />
      <Navbar />
      <FloatingShapes />
      <Toaster />

      <Routes>
        <Route path="/" element={
          <div className="view-section active">
            <LandingView />
          </div>
        } />

        <Route path="/login" element={
          <div className="view-section active">
            <LoginView />
          </div>
        } />

        <Route path="/signup" element={
          <div className="view-section active">
            <SignupView />
          </div>
        } />

        <Route path="/verify-email" element={
          <div className="view-section active">
            <VerifyEmailView />
          </div>
        } />

        <Route path="/forgot-password" element={
          <div className="view-section active">
            <ForgotPasswordView />
          </div>
        } />

        <Route path="/reset-password" element={
          <div className="view-section active">
            <ResetPasswordView />
          </div>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <div
              className="view-section active"
              style={{
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                paddingTop: '100px',
                overflow: 'auto'
              }}
            >
              <DashboardView />
            </div>
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <div
              className="view-section active"
              style={{
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: '100px',
                overflow: 'auto'
              }}
            >
              <SettingsView />
            </div>
          </ProtectedRoute>
        } />

        <Route path="/write" element={
          <div className="view-section active">
            <WriteView />
          </div>
        } />

        <Route path="/u/:username" element={
          <div className="view-section active">
            <WriteView />
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
