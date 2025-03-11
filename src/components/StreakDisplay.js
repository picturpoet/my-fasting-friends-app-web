import React from 'react';
import PastRing from './PastRing';
import '../styles/streakDisplay.css';

const StreakDisplay = ({ records = [] }) => {
  if (!records || records.length === 0) {
    return (
      <div className="streak-display-container">
        <h3>My Streak:</h3>
        <p className="no-streak-message">Complete fasts to build your streak</p>
      </div>
    );
  }
  
  // Sort records by date (newest first)
  const sortedRecords = [...records].sort((a, b) => {
    return b.date.seconds - a.date.seconds;
  });
  
  // Take only the last 7 records for display
  const recentRecords = sortedRecords.slice(0, 7);
  
  // Calculate hours for each record
  const recordsWithHours = recentRecords.map(record => {
    // Calculate hours based on actual duration or target duration
    let hours = 0;
    if (record.actualDuration) {
      // Convert minutes to hours
      hours = Math.round(record.actualDuration / 60);
    } else if (record.targetDuration) {
      // For incomplete records, use completion percentage against target
      hours = Math.round((record.completionPercentage / 100) * (record.targetDuration / 60));
    }
    
    return {
      ...record,
      hoursCompleted: hours
    };
  });
  
  return (
    <div className="streak-display-container">
      <h3>My Streak:</h3>
      <div className="streak-rings">
        {recordsWithHours.map((record, index) => (
          <div className="streak-ring-item" key={record.id || index}>
            <PastRing 
              progress={record.completionPercentage || 0} 
              date={new Date(record.date.seconds * 1000).toLocaleDateString()}
              hours={record.hoursCompleted}
              small={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default StreakDisplay;