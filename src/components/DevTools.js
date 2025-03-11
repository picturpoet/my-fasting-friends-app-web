import React, { useState } from 'react';
import '../styles/devTools.css';

// This component is for development/testing only
const DevTools = ({ activeChallenge, onToggleChallenge }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!activeChallenge) return null;
  
  const challengeStartDate = activeChallenge.startDate ? 
    new Date(activeChallenge.startDate.seconds * 1000) : 
    new Date();
  
  const now = new Date();
  const isFuture = challengeStartDate > now;
  
  const toggleChallengeStatus = () => {
    if (onToggleChallenge) {
      onToggleChallenge();
    }
  };
  
  return (
    <div className={`dev-tools ${isOpen ? 'open' : 'closed'}`}>
      <button 
        className="dev-tools-toggle" 
        onClick={() => setIsOpen(prev => !prev)}
      >
        🛠️
      </button>
      
      {isOpen && (
        <div className="dev-tools-panel">
          <h3>Developer Tools</h3>
          <div className="dev-tool-section">
            <p>Challenge starts: {challengeStartDate.toLocaleString()}</p>
            <p>Current time: {now.toLocaleString()}</p>
            <p>Status: {isFuture ? 'Not started yet' : 'Live'}</p>
            
            <button 
              className="dev-tool-button"
              onClick={toggleChallengeStatus}
            >
              {isFuture ? 'Test Live View' : 'Test Upcoming View'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevTools;