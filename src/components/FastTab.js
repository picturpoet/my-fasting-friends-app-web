import React, { useState, useEffect, useCallback } from 'react';
import TodaysRing from './TodaysRing';
import PastRing from './PastRing';
import Banner from './Banner';
import { auth } from '../firebase';
import { getUserProfile, updateUserProfile, startFasting, endFasting, getFastingRecords } from '../services/firestoreService';
import { useUser } from '../contexts/UserContext';

function FastTab() {
  // Use UserContext
  const { user, activeChallenge } = useUser();
  
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
    };
    
    // Update immediately
    updateProgress();
    
    // Then update every minute
    const intervalId = setInterval(updateProgress, 60000);
    
    return () => clearInterval(intervalId);
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
  
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="fast-tab">
      <h2>Track Your Fast</h2>
      
      {/* Challenge banner - show when there's an active challenge */}
      {activeChallenge && (
        <div className="challenge-banner">
          <h3>Challenge: {activeChallenge.name}</h3>
          {challengeCountdown && <p className="challenge-countdown">{challengeCountdown}</p>}
          {activeChallenge.fastingType && (
            <p className="challenge-type">Using {activeChallenge.fastingType} fasting method</p>
          )}
        </div>
      )}
      
      {/* Banner showing fasting schedule */}
      <Banner 
        isFasting={!!activeFastingRecord} 
        endTime={activeFastingRecord ? new Date(activeFastingRecord.targetEndTime.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : endTime} 
      />
      
      {/* Today's progress ring */}
      <TodaysRing progress={dailyProgress} />
      
      {/* Fasting controls */}
      <div className="fasting-controls">
        {!activeFastingRecord ? (
          <button 
            className="primary-button" 
            onClick={handleStartFasting}
            disabled={activeChallenge?.startDate?.toDate() > new Date()}
          >
            {activeChallenge?.startDate?.toDate() > new Date() 
              ? "Challenge hasn't started yet" 
              : activeChallenge 
                ? "Start Challenge Fast" 
                : "Start Fasting"}
          </button>
        ) : (
          <button className="secondary-button" onClick={handleEndFasting}>
            End Fasting
          </button>
        )}
      </div>
      
      {/* Past days progress */}
      {pastRecords.length > 0 && (
        <>
          <h3>Past 7 Days</h3>
          <div className="past-records-container">
            {pastRecords.map((record, index) => (
              <PastRing 
                key={record.id || index} 
                progress={record.completionPercentage} 
                date={new Date(record.date.seconds * 1000).toLocaleDateString()} 
              />
            ))}
          </div>
        </>
      )}
      
      {/* Fasting Settings */}
      <div className="settings-container">
        <h3>Fasting Schedule</h3>
        
        <div>
          <label htmlFor="fastingType">Fasting Type:</label>
          <select
            id="fastingType"
            value={fastingType}
            onChange={handleFastingTypeChange}
          >
            <option value="16:8">16:8</option>
            <option value="OMAD">OMAD (23:1)</option>
            <option value="5:2">5:2</option>
          </select>
        </div>

        <div>
          <label htmlFor="startTime">Start Time:</label>
          <input
            type="time"
            id="startTime"
            value={startTime}
            onChange={handleStartTimeChange}
          />
        </div>
        
        <p className="fasting-schedule-summary">
          Starting at {startTime}, you'll fast until {endTime} ({fastingType})
        </p>
      </div>
    </div>
  );
}

export default FastTab;