import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserTimeline from './pages/UserTimeline';
import Incidents from './pages/Incidents';
import Users from './pages/Users';
import IncidentDetail from './pages/IncidentDetail';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Investigate from './pages/Investigate';

// Components
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Page Transition Wrapper
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
    className="min-h-screen"
  >
    {children}
  </motion.div>
);

const AppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/login"
          element={
            <PageTransition>
              <Login />
            </PageTransition>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <PageTransition>
                <div className="relative z-10">
                  <Navbar />
                  <Dashboard />
                </div>
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/timeline/:userId"
          element={
            <ProtectedRoute>
              <PageTransition>
                <div className="relative z-10">
                  <Navbar />
                  <UserTimeline />
                </div>
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/incidents"
          element={
            <ProtectedRoute>
              <PageTransition>
                <div className="relative z-10">
                  <Navbar />
                  <Incidents />
                </div>
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/incidents/:id"
          element={
            <ProtectedRoute>
              <PageTransition>
                <div className="relative z-10">
                  <Navbar />
                  <IncidentDetail />
                </div>
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <PageTransition>
                <div className="relative z-10">
                  <Navbar />
                  <Users />
                </div>
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <PageTransition>
                <div className="relative z-10">
                  <Navbar />
                  <Settings />
                </div>
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <PageTransition>
                <div className="relative z-10">
                  <Navbar />
                  <Notifications />
                </div>
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/investigate/:userId?"
          element={
            <ProtectedRoute>
              <PageTransition>
                <div className="relative z-10">
                  <Navbar />
                  <Investigate />
                </div>
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-cyber-darker text-white overflow-hidden">
          {/* Particle Background */}
          <div className="fixed inset-0 bg-gradient-to-br from-cyber-darker via-slate-900 to-cyber-darker">
            <div className="absolute inset-0 particles-bg opacity-20"></div>
          </div>

          <AppRoutes />

          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#fff',
                border: '1px solid #3b82f6',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;