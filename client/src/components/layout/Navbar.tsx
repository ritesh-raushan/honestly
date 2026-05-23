import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { showSuccessToast } from '../../utils/errorHandler';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();
  
  // Hide the "Dashboard" link when we're already on the dashboard
  const isOnDashboard = location.pathname === '/dashboard';

  const handleLogout = async () => {
    // The store action already pings /auth/logout and clears local state
    // regardless of whether the API call succeeds.
    await logout();
    showSuccessToast('Logged out successfully');
    navigate('/');
  };

  return (
    <nav>
      <Link to="/" className="logo">
        <div className="logo-shape">?</div>
        Honestly.
      </Link>
      <div id="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {isAuthenticated && user ? (
          <>
            {!isOnDashboard && (
              <Link to="/dashboard" className="btn btn-ghost">
                Dashboard
              </Link>
            )}
            <button onClick={handleLogout} className="btn btn-ghost">
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost">
              Log In
            </Link>
            <Link
              to="/signup"
              className="btn btn-ticket"
              style={{ padding: '12px 24px' }}
            >
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
