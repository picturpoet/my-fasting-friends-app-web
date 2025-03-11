import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TodaysRing from './TodaysRing';
import PastRing from './PastRing';
import Banner from './Banner';
import WelcomeComponent from './WelcomeComponent';
import CountdownTimer from './CountdownTimer';
import ChallengeHeader from './ChallengeHeader';
import StreakDisplay from './StreakDisplay';
import FastingTimer from './FastingTimer';
import DevTools from './DevTools'; // Import DevTools
import { WhyTogetherSection, WhyPenguinsSection } from './InfoSections';
import { getUserProfile, updateUserProfile, startFasting, endFasting, getFastingRecords } from '../services/firestoreService';
import { useUser } from '../contexts/UserContext';
import '../styles/loading.css';
import '../styles/challengeInfo.css';
import '../styles/liveChallenge.css';

function FastTab() {
  // Use UserContext
  const { user, activeChallenge } = useUser();
  const navigate = useNavigate();
  
  // State
  const [userProfile, setUserProfile] = useState(null);
  
  // Fasting state
  const [fastingType, setFastingType] = useState('16:8');
  const [startTime, setStartTime] = useState('12:00');
  const [dailyProgress, setDailyProgress] = useState(0);
  const [activeFastingRecord, setActiveFastingRecord] = useState(null);
  const [pastRecords, setPastRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [challengeCountdown, setChallengeCountdown] = useState(null);
  
  // Dev tools state - for testing only
  const [overrideStartDate, setOverrideStartDate] = useState(false);
  
  // Fetch user profile on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // User is now from UserContext, so no need to get from auth
        if (!user) return;
        
        // Get user profile from Firestore
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
        
        // Set fasting preferences from profile
        if (profile && profile.fastingPreferences) {
          setFastingType(profile.fastingPreferences.fastingType);
          setStartTime(profile.fastingPreferences.startTime);
        }
        
        // Get past fasting records
        const records = await getFastingRecords(user.uid);
        
        // Check if there's an active fasting record (status = 'ongoing')
        const activeRecord = records.find(record => record.status === 'ongoing');
        if (activeRecord) {
          setActiveFastingRecord(activeRecord);
          // Calculate progress for active fast
          const progress = calculateProgressForRecord(activeRecord);
          setDailyProgress(progress);
        }
        
        // Set past records (excluding active one)
        setPastRecords(records.filter(record => record.status !== 'ongoing'));
        
        // Set up challenge countdown if there's an active challenge
        if (activeChallenge) {
          updateChallengeCountdown();
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [user, activeChallenge]);
  
  // Calculate progress for a fasting record
  const calculateProgressForRecord = (record) => {
    if (!record) return 0;
    
    const now = new Date();
    const startTime = record.startTime.toDate();
    const targetEndTime = record.targetEndTime.toDate();
    
    const totalFastingTime = targetEndTime.getTime() - startTime.getTime();
    const elapsedTime = now.getTime() - startTime.getTime();
    
    let progress = (elapsedTime / totalFastingTime) * 100;
    
    // Ensure progress is within 0-100 range
    return Math.max(0, Math.min(100, progress));
  };
  
  // Update progress periodically for active fast
  useEffect(() => {
    if (!activeFastingRecord) return;
    
    const updateProgress = () => {
      const progress = calculateProgressForRecord(activeFastingRecord);
      setDailyProgress(progress);
      
      // Check if we need to auto-end the fast
      const now = new Date();
      const startDate = activeFastingRecord.startTime.toDate();
      const targetEndTime = activeFastingRecord.targetEndTime.toDate();
      
      // For 16:8 and OMAD automatically end the fast if:
      // 1. It's past target end time
      // 2. It's a new day (past midnight)
      // 3. The fast type is not 'Long fast'
      if (activeFastingRecord.fastingType !== 'Long fast') {
        const isNewDay = now.getDate() !== startDate.getDate();
        const isPastEndTime = now >= targetEndTime;
        
        if (isPastEndTime || isNewDay) {
          // Auto-end the fast
          handleEndFasting();
        }
      }
    };
    
    // Update immediately
    updateProgress();
    
    // Then update every minute
    const intervalId = setInterval(updateProgress, 60000);
    
    return () => clearInterval(intervalId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFastingRecord]);
  
  // Calculate challenge countdown
  const updateChallengeCountdown = () => {
    if (!activeChallenge) return;
    
    const now = new Date();
    const startDate = activeChallenge.startDate.toDate();
    
    // If challenge hasn't started yet
    if (startDate > now) {
      const diffTime = Math.abs(startDate - now);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setChallengeCountdown(`Challenge starts in ${diffDays} day${diffDays !== 1 ? 's' : ''}`);
    } 
    // If challenge is active
    else {
      const endDate = activeChallenge.endDate.toDate();
      const diffTime = Math.abs(endDate - now);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setChallengeCountdown(`${diffDays} day${diffDays !== 1 ? 's' : ''} left in challenge`);
    }
  };
  
  // Update challenge countdown when activeChallenge changes and periodically
  useEffect(() => {
    if (activeChallenge) {
      updateChallengeCountdown();
      
      // Update countdown every hour
      const intervalId = setInterval(updateChallengeCountdown, 3600000);
      return () => clearInterval(intervalId);
    } else {
      setChallengeCountdown(null);
    }
  }, [activeChallenge]);
  
  // Calculate end time based on fasting type and start time
  const calculateEndTime = useCallback((start, type) => {
    const [hours, minutes] = start.split(':');
    let endTimeHours = parseInt(hours);
    let endTimeMinutes = parseInt(minutes);

    if (type === '16:8') {
      endTimeHours = (endTimeHours + 16) % 24;
    } else if (type === 'OMAD') {
      endTimeHours = (endTimeHours + 23) % 24;
    } else if (type === '5:2') {
      // For 5:2, we'd need to track fasting days separately
      return 'N/A'; // Placeholder
    }

    return `${String(endTimeHours).padStart(2, '0')}:${String(endTimeMinutes).padStart(2, '0')}`;
  }, []);
  
  const endTime = calculateEndTime(startTime, fastingType);
  
  // Check if challenge has started yet
  const isChallengeStarted = useCallback(() => {
    if (!activeChallenge) return false;
    
    // For development testing - allow overriding the actual date check
    if (overrideStartDate) return true;
    
    const now = new Date();
    const startDate = activeChallenge.startDate.toDate();
    return now >= startDate;
  }, [activeChallenge, overrideStartDate]);
  
  // Calculate time until challenge starts
  const calculateTimeToStart = useCallback(() => {
    if (!activeChallenge) return { hours: 0, minutes: 0 };
    
    const now = new Date();
    const startDate = activeChallenge.startDate.toDate();
    
    if (now >= startDate) return { hours: 0, minutes: 0 };
    
    const diffMs = startDate - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours: diffHours, minutes: diffMinutes };
  }, [activeChallenge]);
  
  // Handle fasting type change
  const handleFastingTypeChange = async (event) => {
    const newFastingType = event.target.value;
    setFastingType(newFastingType);
    
    // Update user profile in Firestore
    if (user) {
      try {
        await updateUserProfile(user.uid, {
          fastingPreferences: {
            fastingType: newFastingType,
            startTime: startTime
          }
        });
      } catch (error) {
        console.error("Error updating fasting preferences:", error);
      }
    }
  };
  
  // Handle start time change
  const handleStartTimeChange = async (event) => {
    const newStartTime = event.target.value;
    setStartTime(newStartTime);
    
    // Update user profile in Firestore
    if (user) {
      try {
        await updateUserProfile(user.uid, {
          fastingPreferences: {
            fastingType: fastingType,
            startTime: newStartTime
          }
        });
      } catch (error) {
        console.error("Error updating fasting preferences:", error);
      }
    }
  };
  
  // Start a new fast
  const handleStartFasting = async () => {
    if (!user) return;
    
    try {
      // Create a new fasting record in Firestore with challenge ID if available
      const challengeId = activeChallenge ? activeChallenge.id : null;
      const record = await startFasting(user.uid, fastingType, startTime, challengeId);
      setActiveFastingRecord(record);
      setDailyProgress(0); // Reset progress to 0 for new fast
    } catch (error) {
      console.error("Error starting fast:", error);
    }
  };
  
  // End current fast
  const handleEndFasting = async () => {
    if (!activeFastingRecord) return;
    
    try {
      // Update the fasting record in Firestore
      const updatedRecord = await endFasting(activeFastingRecord.id);
      
      // Update state
      setActiveFastingRecord(null);
      setPastRecords(prev => [updatedRecord, ...prev].slice(0, 7)); // Keep most recent 7
      
    } catch (error) {
      console.error("Error ending fast:", error);
    }
  };
  
  // Handle inviting friends to challenge
  const handleInviteFriends = () => {
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
  
  // Handle navigation to Friends tab to view challenge progress
  const handleViewFriends = () => {
    navigate('/friends');
  };
  
  // Handle toggling challenge status for development testing
  const handleToggleChallengeStatus = () => {
    setOverrideStartDate(prev => !prev);
  };
  
  if (isLoading) {
    return <div className="loading-container">Loading...</div>;
  }
  
  // Show Welcome screen for new users or users without active challenge
  if (!activeChallenge) {
    return <WelcomeComponent />;
  }
  
  // Show upcoming challenge screen for challenges that haven't started yet
  const challengeStarted = isChallengeStarted();
  const timeToStart = calculateTimeToStart();
  
  if (activeChallenge && !challengeStarted) {
    return (
      <div className="fast-tab">
        <div className="challenge-info-card">
          <div className="challenge-info-header">
            <h2>You're in!</h2>
            <p>{activeChallenge.name}</p>
          </div>
          
          <div className="challenge-details">
            <div className="challenge-detail">
              <span className="challenge-detail-label">Challenge Duration:</span>
              <span className="challenge-detail-value">
                {new Date(activeChallenge.startDate.seconds * 1000).toLocaleDateString()} - {new Date(activeChallenge.endDate.seconds * 1000).toLocaleDateString()}
              </span>
            </div>
            
            <div className="challenge-detail">
              <span className="challenge-detail-label">Fasting Type:</span>
              <span className="challenge-detail-value">{activeChallenge.fastingType}</span>
            </div>
          </div>
          
          <div className="challenge-description">
            {activeChallenge.description}
          </div>
        </div>
        
        <CountdownTimer hours={timeToStart.hours} minutes={timeToStart.minutes} />
        
        <TodaysRing progress={0} />
        
        <div className="upcoming-challenge-actions">
          <button 
            className="primary-button" 
            disabled={true}
          >
            Challenge Hasn't Started Yet
          </button>
          <button 
            className="secondary-button" 
            onClick={handleInviteFriends}
          >
            Invite More Friends
          </button>
        </div>
        
        <WhyTogetherSection />
        <WhyPenguinsSection />
        
        {/* Dev tools for testing */}
        <DevTools 
          activeChallenge={activeChallenge}
          onToggleChallenge={handleToggleChallengeStatus}
        />
      </div>
    );
  }
  
  // Show live challenge view for active challenges
  if (activeChallenge && challengeStarted) {
    return (
      <div className="fast-tab">
        <ChallengeHeader challenge={activeChallenge} />
        
        {activeFastingRecord && (
          <FastingTimer 
            startTime={activeFastingRecord.startTime} 
            targetEndTime={activeFastingRecord.targetEndTime} 
          />
        )}
        
        <TodaysRing progress={dailyProgress} />
        
        <div className="live-challenge-actions">
          {!activeFastingRecord ? (
            <button 
              className="primary-button" 
              onClick={handleStartFasting}
            >
              Start Fast
            </button>
          ) : (
            <button 
              className="secondary-button" 
              onClick={handleEndFasting}
            >
              End Fast
            </button>
          )}
          
          <button 
            className="secondary-button" 
            onClick={handleViewFriends}
          >
            View Friends
          </button>
        </div>
        
        <StreakDisplay records={pastRecords} />
        
        <WhyTogetherSection />
        <WhyPenguinsSection />
        
        {/* Dev tools for testing */}
        <DevTools 
          activeChallenge={activeChallenge}
          onToggleChallenge={handleToggleChallengeStatus}
        />
      </div>
    );
  }
  
  // Fallback - should never reach here given our conditional checks
  return <div className="loading-container">Unable to determine challenge state</div>;
}

export default FastTab;