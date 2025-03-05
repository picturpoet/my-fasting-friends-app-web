import React from 'react';
import TodaysRing from './TodaysRing';
import PastRing from './PastRing';
import Banner from './Banner';

function FastTab() {
  // Get settings from local storage or use default values
  const initialSettings = JSON.parse(localStorage.getItem('settings')) || {
    fastingType: '16:8',
    startTime: '12:00',
  };

  const [fastingType, setFastingType] = React.useState(initialSettings.fastingType);
  const [startTime, setStartTime] = React.useState(initialSettings.startTime);
  const [dailyProgress, setDailyProgress] = React.useState(0);

  // Mock data for past rings (replace with actual data later)
  const pastDaysProgress = [80, 60, 90, 70, 50];

  // Function to calculate the end time based on the fasting type
  const calculateEndTime = (start, type) => {
    const [hours, minutes] = start.split(':');
    let endTimeHours = parseInt(hours);
    let endTimeMinutes = parseInt(minutes);

    if (type === '16:8') {
      endTimeHours = (endTimeHours + 16) % 24;
    } else if (type === 'OMAD') {
      endTimeHours = (endTimeHours + 23) % 24; // Assuming OMAD is a 23-hour fast
    } else if (type === '5:2') {
      // For 5:2, we'd need to track fasting days separately
      return 'N/A'; // Placeholder
    }

    return `${String(endTimeHours).padStart(2, '0')}:${String(endTimeMinutes).padStart(2, '0')}`;
  };

  const endTime = calculateEndTime(startTime, fastingType);

  // Function to calculate the daily progress
  const calculateDailyProgress = () => {
    const now = new Date();
    const [startHours, startMinutes] = startTime.split(':');
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(startHours), parseInt(startMinutes));
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(endTime.split(':')[0]), parseInt(endTime.split(':')[1]));
    let totalFastingTime = endOfDay.getTime() - startOfDay.getTime();

    if (totalFastingTime < 0) {
      totalFastingTime += 24 * 60 * 60 * 1000; // Add 24 hours if end time is before start time
    }

    const elapsedTime = now.getTime() - startOfDay.getTime();
    let progress = (elapsedTime / totalFastingTime) * 100;

    if (progress < 0) {
      progress = 0;
    } else if (progress > 100) {
      progress = 100;
    }

    return progress;
  };

  // Update the daily progress every minute
  React.useEffect(() => {
    const intervalId = setInterval(() => {
      setDailyProgress(calculateDailyProgress());
    }, 60000); // Update every minute

    return () => clearInterval(intervalId); // Clean up the interval on unmount
  }, [startTime, fastingType]);

  // Function to handle fasting type change
  const handleFastingTypeChange = (event) => {
    const newFastingType = event.target.value;
    setFastingType(newFastingType);

    // Update settings object and store in local storage
    const newSettings = {
      fastingType: newFastingType,
      startTime: startTime,
    };
    localStorage.setItem('settings', JSON.stringify(newSettings));
  };

  // Function to handle start time change
  const handleStartTimeChange = (event) => {
    const newStartTime = event.target.value;
    setStartTime(newStartTime);

    // Update settings object and store in local storage
    const newSettings = {
      fastingType: fastingType,
      startTime: newStartTime,
    };
    localStorage.setItem('settings', JSON.stringify(newSettings));
  };

  return (
    <div>
      <h2>Fast Tab</h2>
      <Banner endTime={endTime} />
      <TodaysRing progress={dailyProgress} />

      <div style={{ display: 'flex', overflowX: 'auto', marginTop: '20px' }}>
        {pastDaysProgress.map((progress, index) => (
          <PastRing key={index} progress={progress} />
        ))}
      </div>

      {/* Settings Container */}
      <div className="settings-container">
        <div>
          <label htmlFor="fastingType">Fasting Type:</label>
          <select
            id="fastingType"
            value={fastingType}
            onChange={handleFastingTypeChange}
          >
            <option value="16:8">16:8</option>
            <option value="OMAD">OMAD</option>
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
      </div>

      <p>Fasting Type: {fastingType}</p>
      <p>Start Time: {startTime}</p>
      <p>End Time: {endTime}</p>
    </div>
  );
}

export default FastTab;