import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { getUserProfile, updateUserProfile } from '../services/firestoreService';
import '../styles/colors.css';
import '../styles/components.css';

function MeTab() {
  const [userProfile, setUserProfile] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        const user = auth.currentUser;
        if (!user) return;
        
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
        setDisplayName(profile?.displayName || '');
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, []);
  
  const handleSaveProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      await updateUserProfile(user.uid, { displayName });
      
      setIsEditing(false);
      setMessage('Profile updated successfully!');
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Failed to update profile. Please try again.');
    }
  };
  
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="me-tab">
      <h2>Profile</h2>
      
      {message && <div className="message">{message}</div>}
      
      <div className="profile-section">
        <div className="avatar">
          {displayName ? (
            displayName[0].toUpperCase()
          ) : (
            <img 
              src={`${process.env.PUBLIC_URL}/logo192.png`} 
              alt="Profile" 
            />
          )}
        </div>
        
        <div className="profile-details">
          {isEditing ? (
            <>
              <div className="input-group">
                <label htmlFor="displayName">Name</label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <div className="button-group">
                <button 
                  className="primary-button"
                  onClick={handleSaveProfile}
                >
                  Save
                </button>
                <button 
                  className="secondary-button"
                  onClick={() => {
                    setDisplayName(userProfile?.displayName || '');
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <h3>{displayName || 'Set your name'}</h3>
              <p className="phone-number">{auth.currentUser?.phoneNumber}</p>
              <button 
                className="secondary-button"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="stats-section">
        <h3>Your Fasting Stats</h3>
        <div className="stats-grid">
          <div className="stat-box">
            <span className="stat-value">0</span>
            <span className="stat-label">Completed Fasts</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">0%</span>
            <span className="stat-label">Success Rate</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">0</span>
            <span className="stat-label">Challenges Won</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">0</span>
            <span className="stat-label">Friends</span>
          </div>
        </div>
      </div>
      
      <div className="app-info">
        <h3>About My Fasting Friends</h3>
        <p>Version 0.1.0</p>
        <p>© 2023 My Fasting Friends</p>
      </div>
    </div>
  );
}

export default MeTab;