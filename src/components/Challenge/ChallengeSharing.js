import React, { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { generateChallengeSharingLink } from '../../services/firestoreService';
import '../../styles/colors.css';
import '../../styles/components.css';

const ChallengeSharing = ({ challenge }) => {
  const [sharingLink, setSharingLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (challenge && challenge.inviteCode) {
      const result = generateChallengeSharingLink(challenge.inviteCode);
      if (result.success) {
        setSharingLink(result.url);
      } else {
        setError('Error generating sharing link');
      }
    }
  }, [challenge]);
  
  const copyToClipboard = () => {
    if (!sharingLink) return;
    
    navigator.clipboard.writeText(sharingLink)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset "Copied" message after 2 seconds
      })
      .catch(err => {
        console.error('Error copying to clipboard:', err);
      });
  };
  
  // If no challenge or invalid challenge, show nothing
  if (!challenge || !challenge.inviteCode) {
    return null;
  }
  
  return (
    <div className="challenge-sharing-container">
      <h3>Share this Challenge</h3>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="sharing-code-container">
        <div className="invite-code-display">
          <span className="label">Invite Code:</span>
          <span className="code">{challenge.inviteCode}</span>
        </div>
        
        <div className="sharing-link-container">
          <input 
            type="text"
            value={sharingLink}
            readOnly
            className="sharing-link-input"
          />
          <button 
            onClick={copyToClipboard}
            className="copy-button"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      
      <div className="sharing-instructions">
        <p>
          Share this code or link with friends to invite them to join your challenge.
          They'll need to enter this code in the "Join Challenge" section of the app.
        </p>
      </div>
    </div>
  );
};

export default ChallengeSharing;