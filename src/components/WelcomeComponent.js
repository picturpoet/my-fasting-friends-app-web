import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { getFastingRecords } from '../services/firestoreService';
import { WhyTogetherSection, WhyPenguinsSection } from './InfoSections';
import '../styles/welcome.css';
import '../styles/loading.css';

const WelcomeComponent = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  
  const [hasPastChallenges, setHasPastChallenges] = useState(false);
  const [pastCompletedFasts, setPastCompletedFasts] = useState(0);
  const [loading, setLoading] = useState(true);

  // Check if the user has past fasting records
  useEffect(() => {
    const checkPastRecords = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const records = await getFastingRecords(user.uid, 20); // Get up to 20 past records
        
        if (records && records.length > 0) {
          setHasPastChallenges(true);
          
          // Count completed fasts
          const completedFasts = records.filter(record => record.status === 'completed').length;
          setPastCompletedFasts(completedFasts);
        }
      } catch (error) {
        console.error('Error checking past records:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkPastRecords();
  }, [user]);

  const handleCreateChallenge = () => {
    navigate('/create-challenge');
  };

  const handleJoinChallenge = () => {
    navigate('/join-challenge');
  };

  return (
    <div className="welcome-container">
      {loading ? (
        <div className="loading-container">Loading your fasting history...</div>
      ) : (
        <>
          <div className="welcome-header">
            <img 
              src={`${process.env.PUBLIC_URL}/logo192.png`} 
              alt="My Fasting Friends Logo" 
              className="welcome-logo" 
            />
            
            {hasPastChallenges ? (
              <>
                <h1>Welcome Back!</h1>
                <p className="welcome-subtitle">
                  You've completed <span className="completed-fasts-count">{pastCompletedFasts}</span> fast{pastCompletedFasts !== 1 ? 's' : ''} so far. 
                  Ready to start a new challenge?
                </p>
              </>
            ) : (
              <>
                <h1>Welcome to My Fasting Friends</h1>
                <p className="welcome-subtitle">Whether you want to gain focus or lose weight. Do it together!</p>
              </>
            )}
            
            <div className="cta-buttons">
              <button onClick={handleCreateChallenge} className="primary-button">
                Create a Fasting Challenge
              </button>
              <button onClick={handleJoinChallenge} className="secondary-button">
                Join Existing Challenge
              </button>
            </div>
          </div>
          
          <WhyTogetherSection />
          <WhyPenguinsSection />

          <div className="features-section">
            <h2>Features</h2>
            <div className="feature-cards">
              <div className="feature-card">
                <div className="feature-icon">🏆</div>
                <h3>Challenges</h3>
                <p>Create or join fasting challenges with friends to build accountability</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <h3>Progress Tracking</h3>
                <p>Track your fasting progress and see your friends' results</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">🎯</div>
                <h3>Goal Setting</h3>
                <p>Set your fasting goals and achieve them together</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WelcomeComponent;