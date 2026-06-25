import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import LogToday from './pages/LogToday';
import Suggestions from './pages/Suggestions';
import History from './pages/History';
import Achievements from './pages/Achievements';
import Profile from './pages/Profile';

// Private Route Wrapper (Redirects to Login if unauthenticated)
function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" replace />;
}

// Public Route (Redirects to Dashboard if already authenticated)
function PublicRoute({ children }) {
  const { currentUser } = useAuth();
  return !currentUser ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-darkBg text-slate-100 flex flex-col">
          {/* Top navigation header */}
          <Navbar />
          
          {/* Route Content Area */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 pb-12">
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              <Route path="/register" element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } />

              {/* Private Protected Pages */}
              <Route path="/" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              <Route path="/logger" element={
                <PrivateRoute>
                  <LogToday />
                </PrivateRoute>
              } />
              <Route path="/suggestions" element={
                <PrivateRoute>
                  <Suggestions />
                </PrivateRoute>
              } />
              <Route path="/history" element={
                <PrivateRoute>
                  <History />
                </PrivateRoute>
              } />
              <Route path="/badges" element={
                <PrivateRoute>
                  <Achievements />
                </PrivateRoute>
              } />
              <Route path="/profile" element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } />

              {/* Catch-all route redirects to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
