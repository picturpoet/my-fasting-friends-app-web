import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { joinChallenge, getChallengeByInviteCode } from '../../services/firestoreService';
import '../../styles/colors.css';
import '../../styles/components.css';

const JoinChallenge = () => {
  const { user, refreshActiveChallenge } = useUser();
  const navigate = useNavigate();
  
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inviteCode) {
      setError('Please enter an invite code');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      // Get the challenge by invite code
      const challenge = await getChallengeByInviteCode(inviteCode.trim());
      
      // Join the challenge
      await joinChallenge(challenge.id, user.uid);
      
      // Refresh active challenge data
      await refreshActiveChallenge();
      
      // Navigate back to the friends tab
      navigate('/friends');
      
    } catch (error) {
      console.error('Error joining challenge:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/friends');
  };
  
  return (
    <div className="challenge-form-container">
      <h2>Join a Challenge</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="inviteCode">Challenge Invite Code:</label>
          <input
            type="text"
            id="inviteCode"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="Enter 6-character code"
            maxLength={6}
            required
          />
        </div>
        
        <p className="join-info">
          You can only join one active challenge at a time. 
          Joining a new challenge will require you to complete or leave your current challenge.
        </p>
        
        <div className="form-actions">
          <button 
            type="button" 
            onClick={handleCancel}
            className="secondary-button"
            disabled={isLoading}
          >
            Cancel
          </button>
          
          <button 
            type="submit" 
            className="primary-button"
            disabled={isLoading}
          >
            {isLoading ? 'Joining...' : 'Join Challenge'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JoinChallenge;