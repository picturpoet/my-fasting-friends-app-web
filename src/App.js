import React, { useState, useEffect } from 'react';
import FastTab from './components/FastTab';
import FriendsTab from './components/FriendsTab';
import MeTab from './components/MeTab';
import Auth from './components/Auth/Signup';
import { auth } from './firebase';
import logo from './logo512.png'; // Import the logo
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('fast');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuthState = () => {
      auth.onAuthStateChanged((user) => {
        if (user) {
          setIsAuthenticated(true);
        } else {
          // Check localStorage as fallback
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            setIsAuthenticated(true);
          }
        }
        setIsLoading(false);
      });
    };

    checkAuthState();
  }, []);

  const handleLogout = () => {
    auth.signOut().then(() => {
      localStorage.removeItem('user');
      setIsAuthenticated(false);
    }).catch((error) => {
      console.error("Error signing out:", error);
    });
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Auth setIsAuthenticated={setIsAuthenticated} />;
  }

  return (
    <div className="App">
      <header className="App-header">
       <img src={logo} alt="My Fasting Friends Logo" className="app-logo" />
        <h1>My Fasting Friends</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </header>
      <main>
        {activeTab === 'fast' && <FastTab />}
        {activeTab === 'friends' && <FriendsTab />}
        {activeTab === 'me' && <MeTab />}
      </main>
      <nav className="bottom-nav">
        <button
          className={activeTab === 'fast' ? 'active' : ''}
          onClick={() => setActiveTab('fast')}
        >
          Fast
        </button>
        <button
          className={activeTab === 'friends' ? 'active' : ''}
          onClick={() => setActiveTab('friends')}
        >
          Friends
        </button>
        <button
          className={activeTab === 'me' ? 'active' : ''}
          onClick={() => setActiveTab('me')}
        >
          Me
        </button>
      </nav>
    </div>
  );
}

export default App;