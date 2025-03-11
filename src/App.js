import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import FastTab from './components/FastTab';
import FriendsTab from './components/FriendsTab';
import MeTab from './components/MeTab';
import Auth from './components/Auth/Signup';
import CreateChallenge from './components/Challenge/CreateChallenge';
import JoinChallenge from './components/Challenge/JoinChallenge';
import { UserProvider, useUser } from './contexts/UserContext';
import { auth } from './firebase';
import './App.css';
import './styles/colors.css';
import './styles/components.css';

// Layout component with navigation
function AppLayout({ children }) {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active tab based on the current path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/friends')) return 'friends';
    if (path.includes('/me')) return 'me';
    return 'fast';
  };
  const activeTab = getActiveTab();

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-left">
          <img 
            src={`${process.env.PUBLIC_URL}/logo192.png`} 
            alt="My Fasting Friends Logo" 
            className="app-logo" 
          />
          <h1>My Fasting Friends</h1>
        </div>
        {user && <button onClick={handleLogout} className="logout-button">Logout</button>}
      </header>
      <main>
        {children}
      </main>
      <nav className="bottom-nav">
        <a
          href="/"
          className={activeTab === 'fast' ? 'active' : ''}
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
        >
          Fast
        </a>
        <a
          href="/friends"
          className={activeTab === 'friends' ? 'active' : ''}
          onClick={(e) => {
            e.preventDefault();
            navigate('/friends');
          }}
        >
          Friends
        </a>
        <a
          href="/me"
          className={activeTab === 'me' ? 'active' : ''}
          onClick={(e) => {
            e.preventDefault();
            navigate('/me');
          }}
        >
          Me
        </a>
      </nav>
    </div>
  );
}

// Protected Route component
function ProtectedRoute({ children }) {
  const { user, loading } = useUser();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" />;
  }
  
  return <AppLayout>{children}</AppLayout>;
}

// Auth Route component
function AuthRoute() {
  const { user, loading } = useUser();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (user) {
    return <Navigate to="/" />;
  }
  
  return <Auth />;
}

// Main App component wrapped with UserProvider
function App() {
  // Force version update to prevent caching issues
  const appVersion = "1741733678674"; // Update this when deploying changes
  
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/auth" element={<AuthRoute />} />
          
          <Route path="/" element={<ProtectedRoute><FastTab key={appVersion} /></ProtectedRoute>} />
          <Route path="/friends" element={<ProtectedRoute><FriendsTab key={appVersion} /></ProtectedRoute>} />
          <Route path="/me" element={<ProtectedRoute><MeTab key={appVersion} /></ProtectedRoute>} />
          
          <Route path="/create-challenge" element={<ProtectedRoute><CreateChallenge /></ProtectedRoute>} />
          <Route path="/join-challenge" element={<ProtectedRoute><JoinChallenge /></ProtectedRoute>} />
          
          {/* Redirect any unknown routes to home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;