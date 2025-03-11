import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import '../styles/colors.css';
import '../styles/components.css';
import { getGlobalLeaderboard, getChallengeParticipants } from '../services/firestoreService';

function FriendsTab() {
  const { user, userProfile, activeChallenge, userState, refreshActiveChallenge } = useUser();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
  const [challengeParticipants, setChallengeParticipants] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  
  // Load active challenge on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await refreshActiveChallenge();
      
      // Load global leaderboard for new/inactive users
      if (!activeChallenge) {
        try {
          const leaderboard = await getGlobalLeaderboard(10); // Top 10 users
          setGlobalLeaderboard(leaderboard);
        } catch (error) {
          console.error("Error loading leaderboard:", error);
        }
      } else {
        // Load challenge participants for active challenge
        try {
          const participants = await getChallengeParticipants(activeChallenge.id);
          setChallengeParticipants(participants);
        } catch (error) {
          console.error("Error loading challenge participants:", error);
        }
      }
      
      setIsLoading(false);
    };
    
    loadData();
  }, [refreshActiveChallenge, activeChallenge]);
  
  
  
  // Format dates for display
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };
  
  // Handle sending a taunt or clap to a participant
  const handleSendInteraction = async (participantId, interactionType) => {
    if (!user || !activeChallenge) return;
    
    try {
      // Create a notification for the recipient
      await addDoc(collection(db, 'notifications'), {
        userId: participantId,
        type: interactionType,
        title: interactionType === 'taunt' ? 'Someone taunted you!' : 'Someone clapped for you!',
        message: interactionType === 'taunt' 
          ? `${userProfile?.displayName || 'Someone'} is challenging you to keep up!` 
          : `${userProfile?.displayName || 'Someone'} is cheering for your progress!`,
        data: { 
          senderId: user.uid,
          challengeId: activeChallenge.id
        },
        isRead: false,
        createdAt: new Date()
      });
      
      // Show success message
      alert(interactionType === 'taunt' 
        ? 'Taunt sent! Let\'s see if they can keep up.' 
        : 'Clap sent! Your encouragement matters.');
      
    } catch (error) {
      console.error(`Error sending ${interactionType}:`, error);
      alert('Failed to send interaction. Please try again.');
    }
  };
  
  // Toggle daily progress details for a participant
  const handleToggleParticipantDay = (participantId) => {
    if (selectedDay === participantId) {
      setSelectedDay(null);
    } else {
      setSelectedDay(participantId);
    }
  };
  
  // Generate invitation link when active challenge is available
  useEffect(() => {
    if (activeChallenge && activeChallenge.inviteCode) {
      const baseUrl = window.location.origin;
      setInviteLink(`${baseUrl}/join-challenge?code=${activeChallenge.inviteCode}`);
    } else {
      setInviteLink('');
    }
  }, [activeChallenge]);
  
  const handleCreateChallenge = () => {
    navigate('/create-challenge');
  };
  
  const handleJoinChallenge = () => {
    navigate('/join-challenge');
  };
  
  const handleInviteViaWhatsApp = () => {
    if (!activeChallenge) return;
    
    // Create invitation message
    const message = encodeURIComponent(
      `Join my fasting challenge "${activeChallenge.name}" on My Fasting Friends app! Use invite code: ${activeChallenge.inviteCode}`
    );
    
    // Generate WhatsApp URL
    const whatsappUrl = `https://wa.me/?text=${message}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="friends-tab">
      <h2>Challenges & Friends</h2>
      
      {activeChallenge ? (
        <div className="active-challenge">
          <div className="challenge-card">
            <h3>{activeChallenge.name}</h3>
            <p className="challenge-dates">
              {formatDate(activeChallenge.startDate)} - {formatDate(activeChallenge.endDate)}
            </p>
            <p className="challenge-description">{activeChallenge.description}</p>
            <p className="challenge-type">
              <strong>Fasting Type:</strong> {activeChallenge.fastingType}
            </p>
            <p className="challenge-participants">
              <strong>Participants:</strong> {activeChallenge.participants.length}
            </p>
            
            <div className="challenge-actions">
              <button 
                className="primary-button"
                onClick={handleInviteViaWhatsApp}
              >
                Invite Friends
              </button>
              
              <div className="invite-code">
                <p>Share code: <strong>{activeChallenge.inviteCode}</strong></p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="no-active-challenge">
          <div className="start-fast-with-friends-banner">
            <h3>Start a Fast with Friends</h3>
            <p>Challenge yourself and your friends to complete fasting goals together</p>
            <div className="banner-buttons">
              <button className="primary-button" onClick={handleCreateChallenge}>
                Create Challenge
              </button>
              <button className="secondary-button" onClick={handleJoinChallenge}>
                Join Challenge
              </button>
            </div>
          </div>
          
          <div className="leaderboard-section">
            <h3>Global Leaderboard</h3>
            {isLoading ? (
              <div className="loading">Loading leaderboard...</div>
            ) : globalLeaderboard.length > 0 ? (
              <div className="leaderboard">
                <div className="leaderboard-header">
                  <span className="rank-col">Rank</span>
                  <span className="name-col">User</span>
                  <span className="score-col">Completed Fasts</span>
                  <span className="score-col">Score</span>
                </div>
                
                {globalLeaderboard.map((user, index) => (
                  <div key={index} className="leaderboard-row">
                    <span className="rank-col">#{index + 1}</span>
                    <span className="name-col">{user.displayName || 'Anonymous'}</span>
                    <span className="score-col">{user.completedFasts || 0}</span>
                    <span className="score-col">{user.totalScore || 0}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-leaderboard">
                <p>No data available yet. Start your fasting journey!</p>
              </div>
            )}
          </div>
          
          <div className="challenge-options">
            <div className="challenge-option-card">
              <h3>Create a Challenge</h3>
              <p>Start a new fasting challenge and invite your friends to join you</p>
              <button
                className="primary-button"
                onClick={handleCreateChallenge}
              >
                Create Challenge
              </button>
            </div>
            
            <div className="challenge-option-card">
              <h3>Join a Challenge</h3>
              <p>Enter an invite code to join a friend's challenge</p>
              <button
                className="secondary-button"
                onClick={handleJoinChallenge}
              >
                Join Challenge
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="invite-section">
        <h3>Invite Friends to App</h3>
        <div className="invite-card">
          <div className="invite-icon">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/767px-WhatsApp.svg.png" 
                 alt="WhatsApp" width="40" />
          </div>
          <div className="invite-content">
            <h4>Share via WhatsApp</h4>
            <p>Invite your friends to join you on your fasting journey</p>
            
            <button
              onClick={() => {
                // Create invitation message
                const message = encodeURIComponent(
                  "Want to lose weight or gain focus? Let's do it together. Join me on My Fasting Friends. Link: https://my-fasting-friends-app.web.app"
                );
                
                // Generate WhatsApp URL
                const whatsappUrl = `https://wa.me/?text=${message}`;
                
                // Open WhatsApp
                window.open(whatsappUrl, '_blank');
              }}
              className="secondary-button whatsapp-button"
            >
              Invite to App
            </button>
          </div>
        </div>
      </div>
      
      <div className="coming-soon-section">
        <h3>Coming Soon</h3>
        <p>Friend requests and challenge leaderboards will be available in the next update!</p>
        
        <div className="feature-preview">
          <div className="feature-card">
            <h4>Friend Connections</h4>
            <p>Connect directly with friends in the app</p>
          </div>
          
          <div className="feature-card">
            <h4>Leaderboards</h4>
            <p>See who's most consistent with their fasting goals</p>
          </div>
          
          <div className="feature-card">
            <h4>Achievement Badges</h4>
            <p>Earn badges for completing fasting milestones</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FriendsTab;