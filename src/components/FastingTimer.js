import React, { useState, useEffect } from 'react';
import '../styles/fastingTimer.css';

const FastingTimer = ({ startTime, targetEndTime }) => {
  const [timeElapsed, setTimeElapsed] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [animationProgress, setAnimationProgress] = useState(0);
  
  useEffect(() => {
    if (!startTime) return;
    
    const updateTimer = () => {
      const now = new Date();
      const start = startTime.toDate ? startTime.toDate() : new Date(startTime);
      const end = targetEndTime.toDate ? targetEndTime.toDate() : new Date(targetEndTime);
      
      // Calculate elapsed time
      const elapsedMs = now - start;
      const totalDurationMs = end - start;
      
      // Calculate hours, minutes, seconds
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      const hours = Math.floor(elapsedSeconds / 3600);
      const minutes = Math.floor((elapsedSeconds % 3600) / 60);
      const seconds = elapsedSeconds % 60;
      
      setTimeElapsed({ hours, minutes, seconds });
      
      // Calculate progress percentage (0-100) for animation
      const progress = Math.min(100, (elapsedMs / totalDurationMs) * 100);
      setAnimationProgress(progress);
    };
    
    // Update immediately
    updateTimer();
    
    // Then update every second
    const intervalId = setInterval(updateTimer, 1000);
    
    return () => clearInterval(intervalId);
  }, [startTime, targetEndTime]);
  
  // Animation style with gradient that shifts as progress increases
  const getGradientStyle = () => {
    // Color progression from red to yellow to green as progress increases
    const hue = Math.min(120, Math.floor(animationProgress * 1.2));
    const color = `hsl(${hue}, 80%, 50%)`;
    
    return {
      backgroundImage: `linear-gradient(to right, ${color}, hsl(${Math.min(120, hue + 20)}, 80%, 50%))`,
      width: `${animationProgress}%`
    };
  };
  
  return (
    <div className="fasting-timer">
      <div className="timer-display">
        <div className="time-value">
          <span className="time-number">{String(timeElapsed.hours).padStart(2, '0')}</span>
          <span className="time-label">hours</span>
        </div>
        <div className="time-separator">:</div>
        <div className="time-value">
          <span className="time-number">{String(timeElapsed.minutes).padStart(2, '0')}</span>
          <span className="time-label">minutes</span>
        </div>
        <div className="time-separator">:</div>
        <div className="time-value">
          <span className="time-number">{String(timeElapsed.seconds).padStart(2, '0')}</span>
          <span className="time-label">seconds</span>
        </div>
      </div>
      
      <div className="fasting-progress-bar">
        <div className="progress-track">
          <div className="progress-fill" style={getGradientStyle()}></div>
        </div>
      </div>
      
      <p className="fasting-status-text">Fasting in progress</p>
    </div>
  );
};

export default FastingTimer;