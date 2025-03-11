import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { 
  getUserProfile, 
  updateUserProfile, 
  getUserFastingStats, 
  getWeightRecords,
  getWeightGoal,
  updateWeightGoal,
  addWeightRecord
} from '../services/firestoreService';
import '../styles/colors.css';
import '../styles/components.css';
import '../styles/meTab.css';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';

function MeTab() {
  const [userProfile, setUserProfile] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Weight tracking states
  const [weightRecords, setWeightRecords] = useState([]);
  const [goalWeight, setGoalWeight] = useState(null);
  const [newWeight, setNewWeight] = useState('');
  const [isAddingWeight, setIsAddingWeight] = useState(false);

  // Fasting stats
  const [fastingStats, setFastingStats] = useState(null);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const user = auth.currentUser;
        if (!user) return;
        
        // Fetch basic profile data
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
        setDisplayName(profile?.displayName || '');

        // Fetch weight data
        const weightData = await getWeightRecords(user.uid);
        setWeightRecords(weightData);

        // Fetch goal weight
        const goalWeightValue = await getWeightGoal(user.uid);
        setGoalWeight(goalWeightValue);

        // Fetch fasting statistics
        const stats = await getUserFastingStats(user.uid);
        setFastingStats(stats);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
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

  const handleSaveWeight = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const weightValue = parseFloat(newWeight);
      if (isNaN(weightValue) || weightValue <= 0) {
        setMessage('Please enter a valid weight');
        return;
      }

      await addWeightRecord(user.uid, weightValue);
      
      // Refresh weight records
      const updatedRecords = await getWeightRecords(user.uid);
      setWeightRecords(updatedRecords);
      
      setNewWeight('');
      setIsAddingWeight(false);
      setMessage('Weight recorded successfully!');
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error recording weight:', error);
      setMessage('Failed to record weight. Please try again.');
    }
  };

  const handleSaveGoalWeight = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await updateWeightGoal(user.uid, goalWeight);
      setMessage('Weight goal updated successfully!');
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating weight goal:', error);
      setMessage('Failed to update weight goal. Please try again.');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatChartData = () => {
    if (!weightRecords || weightRecords.length === 0) return [];
    
    return weightRecords.map(record => ({
      date: formatDate(record.date),
      weight: record.weight,
    }));
  };
  
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="me-tab">
      {message && <div className="message">{message}</div>}
      
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
      
      {/* Weight Tracking Section */}
      <div className="weight-tracking-section">
        <h3>Weight Tracking</h3>
        
        {weightRecords && weightRecords.length > 0 ? (
          <div className="weight-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={formatChartData()}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="var(--primary-color)" 
                  strokeWidth={2} 
                  dot={{ className: 'weight-point', r: 4 }}
                />
                {goalWeight && (
                  <ReferenceLine 
                    y={goalWeight} 
                    stroke="#4caf50" 
                    strokeDasharray="3 3" 
                    className="goal-line"
                    label={{ position: 'right', value: `Goal: ${goalWeight}`, fill: '#4caf50' }} 
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p>No weight records yet. Start tracking your progress!</p>
        )}
        
        <div className="weight-controls">
          {isAddingWeight ? (
            <div className="input-group">
              <input
                type="number"
                step="0.1"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                placeholder="Enter your current weight"
              />
              <div className="button-group">
                <button 
                  className="primary-button"
                  onClick={handleSaveWeight}
                >
                  Save
                </button>
                <button 
                  className="secondary-button"
                  onClick={() => {
                    setNewWeight('');
                    setIsAddingWeight(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button 
              className="secondary-button"
              onClick={() => setIsAddingWeight(true)}
            >
              Add Weight Record
            </button>
          )}
          
          <div className="goal-weight-control">
            <label>Goal Weight:</label>
            <input
              type="number"
              step="0.1"
              value={goalWeight || ''}
              onChange={(e) => setGoalWeight(e.target.value)}
              placeholder="Target weight"
            />
            <button 
              className="secondary-button"
              onClick={handleSaveGoalWeight}
            >
              Set Goal
            </button>
          </div>
        </div>
      </div>
      
      {/* Coffee Support Card */}
      <div className="coffee-support-card">
        <h3>Enjoying the App?</h3>
        <p>If this app is helping you on your fasting journey, consider buying me a coffee!</p>
        <a 
          href="upi://pay?pa=9619696240@upi&pn=Buy RV a coffee&amp;cu=INR&am=144&tn=mff_coffee"
          className="coffee-button"
        >
          Buy me a Coffee ☕️
        </a>
      </div>
      
      {/* Fasting Stats Section */}
      <div className="stats-section">
        <h3>Your Fasting Stats</h3>
        <div className="stats-grid">
          <div className="stat-box">
            <span className="stat-value">{fastingStats?.completedFasts || 0}</span>
            <span className="stat-label">Completed Fasts</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{fastingStats?.successRate || 0}%</span>
            <span className="stat-label">Success Rate</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{fastingStats?.longestStreak || 0}</span>
            <span className="stat-label">Longest Streak</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{fastingStats?.currentStreak || 0}</span>
            <span className="stat-label">Current Streak</span>
          </div>
        </div>
        
        {/* Challenge-specific stats if user is in a challenge */}
        {fastingStats?.challengeStats && (
          <div className="challenge-stats">
            <h4>Challenge: {fastingStats.challengeStats.challengeName}</h4>
            <div className="stats-grid">
              <div className="stat-box">
                <span className="stat-value">{fastingStats.challengeStats.completedDays}</span>
                <span className="stat-label">Days Completed</span>
              </div>
              <div className="stat-box">
                <span className="stat-value">{fastingStats.challengeStats.totalScore}</span>
                <span className="stat-label">Challenge Score</span>
              </div>
              <div className="stat-box">
                <span className="stat-value">#{fastingStats.challengeStats.rank}</span>
                <span className="stat-label">Current Rank</span>
              </div>
            </div>
          </div>
        )}
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