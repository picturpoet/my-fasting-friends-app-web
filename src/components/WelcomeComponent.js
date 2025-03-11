import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/welcome.css';

const WelcomeComponent = () => {
  const navigate = useNavigate();

  const handleCreateChallenge = () => {
    navigate('/create-challenge');
  };

  const handleJoinChallenge = () => {
    navigate('/join-challenge');
  };

  return (
    <div className="welcome-container">
      <div className="welcome-header">
        <img 
          src={`${process.env.PUBLIC_URL}/logo192.png`} 
          alt="My Fasting Friends Logo" 
          className="welcome-logo" 
        />
        <h1>Welcome to My Fasting Friends</h1>
        <p className="welcome-subtitle">Whether you want to gain focus or lose weight. Do it together!</p>
        
        <div className="cta-buttons">
          <button onClick={handleCreateChallenge} className="primary-button">
            Create a Fasting Challenge
          </button>
          <button onClick={handleJoinChallenge} className="secondary-button">
            Join Existing Challenge
          </button>
        </div>
      </div>

      <div className="info-section">
        <div className="info-card">
          <h2>Why Together?</h2>
          <p>
            Our fasting challenges allow you to invite your friends and track your progress together. 
            Taunt them when they're lagging or breaking rules. Clap when they're going beyond and above. 
            Overall, be a real accountability partner and get the results you desired.
          </p>
        </div>

        <div className="info-card">
          <h2>Why Penguins?</h2>
          <p>
            You might be wondering why penguins? Because they're known to fast for up to 120 days, 
            despite being in the harshest winters and they do it because they do it together. 
            Huddle in massive colonies for warmth.
          </p>
        </div>
      </div>

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
    </div>
  );
};

export default WelcomeComponent;