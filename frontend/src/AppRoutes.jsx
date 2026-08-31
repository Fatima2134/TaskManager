import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import Tasks from './pages/Tasks';
import Auth from './pages/Auth';
import Calendar from './pages/Calendar';
import Dashboard from './pages/Dashboard';

const navItems = [
  { to: '/', label: 'Tasks' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/calendar', label: 'Calendar' },
];

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/auth" replace />;
}

function PublicRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? <Navigate to="/" replace /> : children;
}

function AppRoutes() {
  const location = useLocation();
  const isAuthenticated = Boolean(localStorage.getItem('token'));
  const showShell = isAuthenticated && location.pathname !== '/auth';

  const handleSignOut = () => {
    localStorage.removeItem('token');
    window.location.assign('/auth');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {showShell && (
        <header className="border-b border-slate-800 bg-slate-900/90">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-xl font-semibold">Task Manager</h1>
              <p className="text-sm text-red-100">Plan, track, and finish work</p>
            </div>
            <nav className="flex flex-wrap items-center gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-lg px-4 py-2 text-sm font-medium transition ${
                      isActive ? 'bg-red-600 text-white' : 'text-red-100 hover:bg-red-800'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-lg border border-red-700 px-4 py-2 text-sm font-medium text-red-50 hover:bg-red-800"
              >
                Sign Out
              </button>
            </nav>
          </div>
        </header>
      )}

      <main className="mx-auto max-w-6xl px-6 py-10">
        <Routes>
          <Route path="/" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
          <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
          <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/auth'} replace />} />
        </Routes>
      </main>
    </div>
  );
}

function AppRouteWrapper() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default AppRouteWrapper;
