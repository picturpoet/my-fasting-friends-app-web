import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import '../styles/colors.css';
import '../styles/components.css';
import '../styles/friendsTab.css';
import '../styles/challengeSharing.css';
import { getGlobalLeaderboard, getChallengeParticipants, getChallengeFastingRecords } from '../services/firestoreService';
import ChallengeSharing from './Challenge/ChallengeSharing';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

function FriendsTab() {
  const { user, userProfile, activeChallenge, userState, refreshActiveChallenge } = useUser();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
  const [challengeParticipants, setChallengeParticipants] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [participantRecords, setParticipantRecords] = useState({});
  
  // Load active challenge on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      try {
        // Only refresh the active challenge on initial load
        if (activeChallenge === null) {
          await refreshActiveChallenge();
        }
        
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
            
            // Load participant fasting records
            const recordsPromises = participants.map(async (participant) => {
              const records = await getChallengeFastingRecords(activeChallenge.id, participant.userId);
              return { userId: participant.userId, records };
            });
            
            const participantRecordsArray = await Promise.all(recordsPromises);
            const recordsObject = {};
            
            participantRecordsArray.forEach(item => {
              recordsObject[item.userId] = item.records;
            });
            
            setParticipantRecords(recordsObject);
          } catch (error) {
            console.error("Error loading challenge participants:", error);
          }
        }
      } catch (error) {
        console.error("Error in loadData:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
    
    // Use a timer instead of frequent re-renders
    let refreshTimer = null;
    if (activeChallenge) {
      // Refresh participant data every 5 minutes instead of continuously
      refreshTimer = setInterval(async () => {
        try {
          const participants = await getChallengeParticipants(activeChallenge.id);
          setChallengeParticipants(participants);
          
          // Update participant records
          const recordsPromises = participants.map(async (participant) => {
            const records = await getChallengeFastingRecords(activeChallenge.id, participant.userId);
            return { userId: participant.userId, records };
          });
          
          const participantRecordsArray = await Promise.all(recordsPromises);
          const recordsObject = {};
          
          participantRecordsArray.forEach(item => {
            recordsObject[item.userId] = item.records;
          });
          
          setParticipantRecords(recordsObject);
        } catch (error) {
          console.error("Error refreshing participants:", error);
        }
      }, 300000); // 5 minutes
    }
    
    // Clean up
    return () => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
    };
  }, [activeChallenge, refreshActiveChallenge]);
  
  
  
  // Format dates for display
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };
  
  // Calculate progress for progress bar with smoother transition
  const calculateFastProgress = (record) => {
    if (!record) return 0;
    
    if (record.status === 'completed') {
      return 100;
    }
    
    if (record.status === 'broken') {
      return record.completionPercentage || 0;
    }
    
    if (record.status === 'ongoing') {
      const startTime = record.startTime.toDate();
      const targetEndTime = record.targetEndTime.toDate();
      const now = new Date();
      
      const totalDuration = targetEndTime.getTime() - startTime.getTime();
      const elapsedDuration = now.getTime() - startTime.getTime();
      
      const progress = Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100));
      return progress;
    }
    
    return 0;
  };
  
  // Get progress color based on percentage with gradient transitions
  const getProgressColor = (percentage) => {
    if (percentage < 25) {
      return 'var(--error-color)';
    } else if (percentage < 50) {
      // Transition from error to warning
      return `linear-gradient(to right, var(--error-color), var(--warning-color))`;
    } else if (percentage < 75) {
      // Transition from warning to info
      return `linear-gradient(to right, var(--warning-color), var(--info-color))`;
    } else if (percentage < 100) {
      // Transition from info to success
      return `linear-gradient(to right, var(--info-color), var(--success-color))`;
    } else {
      return 'var(--success-color)';
    }
  };
  
  // Get solid color for text and small elements
  const getSolidColor = (percentage) => {
    if (percentage < 25) {
      return 'var(--error-color)';
    } else if (percentage < 50) {
      return 'var(--warning-color)';
    } else if (percentage < 75) {
      return 'var(--info-color)';
    } else {
      return 'var(--success-color)';
    }
  };
  
  // Get today's fasting record for a participant
  const getParticipantTodayRecord = (userId) => {
    if (!participantRecords[userId] || participantRecords[userId].length === 0) {
      return null;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return participantRecords[userId].find(record => {
      const recordDate = record.date.toDate();
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime();
    });
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
    const inviteCode = activeChallenge.inviteCode || '';
    const baseUrl = window.location.origin;
    const challengeLink = `${baseUrl}/join-challenge?code=${inviteCode}`;
    
    const message = encodeURIComponent(
      `Join my fasting challenge "${activeChallenge.name}" on My Fasting Friends app! Use invite code: ${inviteCode}\n\nDirect link: ${challengeLink}`
    );
    
    // Generate WhatsApp URL
    const whatsappUrl = `https://wa.me/?text=${message}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
  };
  
  // Format time for display
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Get fasting status text
  const getFastingStatusText = (record) => {
    if (!record) return 'Not started';
    
    switch (record.status) {
      case 'ongoing':
        return 'Fasting';
      case 'completed':
        return 'Completed';
      case 'broken':
        return 'Broken';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="friends-tab">
      <h2>Challenges & Friends</h2>
      
      {activeChallenge ? (
        <div className="active-challenge">
          {/* Challenge Progress Section - Moved to top for active challenges */}
          <div className="challenge-progress">
            <h3>Challenge Progress</h3>
            
            {isLoading ? (
              <div className="loading">Loading participants...</div>
            ) : challengeParticipants.length > 0 ? (
              <div className="participant-list">
                {challengeParticipants.map((participant) => {
                  const todayRecord = getParticipantTodayRecord(participant.userId);
                  const progressPercentage = calculateFastProgress(todayRecord);
                  
                  return (
                    <div key={participant.userId} className="participant-card">
                      <div className="participant-header">
                        <div className="participant-info">
                          <div className="participant-avatar">
                            {participant.photoURL ? (
                              <img src={participant.photoURL} alt={participant.displayName} />
                            ) : (
                              <div className="avatar-placeholder">
                                {participant.displayName ? participant.displayName[0].toUpperCase() : '?'}
                              </div>
                            )}
                          </div>
                          <div className="participant-details">
                            <h4>{participant.displayName || 'Anonymous'}</h4>
                            <p className="participant-stats">
                              <span>Completed: {participant.completedDays} days</span>
                              <span>Score: {participant.totalScore}</span>
                            </p>
                          </div>
                        </div>
                        <div className="participant-rank">#{participant.rank}</div>
                      </div>
                      
                      <div className="participant-progress">
                        <div className="progress-status">
                          <span style={{ color: getSolidColor(progressPercentage) }}>{getFastingStatusText(todayRecord)}</span>
                          <span style={{ color: getSolidColor(progressPercentage) }}>{Math.round(progressPercentage)}%</span>
                        </div>
                        <div className="progress-bar-container">
                          <div 
                            className="progress-bar" 
                            style={{
                              width: `${progressPercentage}%`,
                              backgroundImage: getProgressColor(progressPercentage)
                            }}
                          ></div>
                        </div>
                        {todayRecord && (
                          <div className="progress-times">
                            <span>Started: {formatTime(todayRecord.startTime)}</span>
                            <span>Target: {formatTime(todayRecord.targetEndTime)}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="participant-actions">
                        <button
                          className="action-button clap-button"
                          onClick={() => handleSendInteraction(participant.userId, 'clap')}
                          disabled={participant.userId === user.uid}
                        >
                          👏 Clap
                        </button>
                        <button
                          className="action-button taunt-button"
                          onClick={() => handleSendInteraction(participant.userId, 'taunt')}
                          disabled={participant.userId === user.uid}
                        >
                          😈 Taunt
                        </button>
                        <button
                          className="action-button history-button"
                          onClick={() => handleToggleParticipantDay(participant.userId)}
                        >
                          {selectedDay === participant.userId ? 'Hide History' : 'Show History'}
                        </button>
                      </div>
                      
                      {selectedDay === participant.userId && (
                        <div className="participant-history">
                          <h5>Challenge History</h5>
                          <div className="daily-records">
                            {participantRecords[participant.userId]?.length > 0 ? (
                              participantRecords[participant.userId].map((record, index) => (
                                <div key={index} className="daily-record-card">
                                  <div className="daily-record-date">
                                    {formatDate(record.date)}
                                  </div>
                                  <div className="daily-record-status" style={{color: getSolidColor(record.completionPercentage || 0)}}>
                                    {record.status === 'completed' ? 'Completed' : 
                                     record.status === 'broken' ? 'Broken' : 'Ongoing'}
                                  </div>
                                  <div className="daily-record-progress">
                                    <div className="mini-progress-container">
                                      <div 
                                        className="mini-progress-bar" 
                                        style={{
                                          width: `${record.completionPercentage || 0}%`,
                                          backgroundColor: getSolidColor(record.completionPercentage || 0)
                                        }}
                                      ></div>
                                    </div>
                                    <span>{Math.round(record.completionPercentage || 0)}%</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="no-records">No fasting records yet</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-participants">
                <p>No participants in this challenge yet. Invite some friends!</p>
              </div>
            )}
          </div>
          
          {/* Challenge Info Card - Moved below progress */}
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
            
            {/* Challenge status is active, so invite button is disabled */}
            <div className="challenge-actions">
              <button 
                className="primary-button"
                onClick={handleInviteViaWhatsApp}
                disabled={true}
                title="Cannot add more invites while challenge is active"
              >
                Invite Friends
              </button>
              
              <div className="invite-code">
                <p>Share code: <strong>{activeChallenge.inviteCode}</strong></p>
              </div>
            </div>
          </div>
          
          {/* Challenge Sharing Component - Hide for active challenges */}
          {/* <ChallengeSharing challenge={activeChallenge} /> */}
          
          {/* Invite Friends to App - This is now below challenge info */}
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
                    // Create invitation message with challenge info
                    const inviteCode = activeChallenge.inviteCode || '';
                    const baseUrl = window.location.origin;
                    const challengeLink = `${baseUrl}/join-challenge?code=${inviteCode}`;
                    
                    const message = encodeURIComponent(
                      `Want to lose weight or gain focus? Let's do it together. Join me on My Fasting Friends app!\n\nI'm currently in a challenge called "${activeChallenge.name}". You can join too using this link: ${challengeLink}`
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
          
          {/* Invite Friends Section for non-active challenge users */}
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
                    // Create invitation message (generic for non-challenge users)
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
        </div>
      )}
      
      {/* Coming Soon Section */}
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