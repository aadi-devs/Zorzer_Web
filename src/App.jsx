import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import AppShell from '@/components/return/AppShell';
import Dashboard from '@/pages/Dashboard';
import Panel from '@/pages/Panel';
import Pricing from '@/pages/Pricing';
import Settings from '@/pages/Settings';
import Activity from '@/pages/Activity';
import Profile from '@/pages/Profile';
import Feedback from '@/pages/Feedback';
import Admin from '@/pages/Admin';
import Login from '@/pages/Login';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

const AdminRoute = ({ children }) => {
  const { isLoadingAuth, isAuthenticated, isAdmin } = useAuth();
  if (isLoadingAuth) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-zinc-300" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/"          element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/panel"     element={<Panel />} />
        <Route path="/pricing"   element={<Pricing />} />
        <Route path="/settings"  element={<Settings />} />
        <Route path="/activity"  element={<Activity />} />
        <Route path="/profile"   element={<Profile />} />
        <Route path="/feedback"  element={<Feedback />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route path="/login"          element={<Login />} />
            {/* /register is permanently closed — redirect anyone who visits */}
            <Route path="/register"       element={<Navigate to="/login" replace />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/*"              element={<AuthenticatedApp />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
