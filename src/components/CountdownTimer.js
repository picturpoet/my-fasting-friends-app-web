import React, { useState, useEffect } from 'react';
import '../styles/countdownTimer.css';

const CountdownTimer = ({ hours, minutes, onEnd }) => {
  const [timeLeft, setTimeLeft] = useState({ hours, minutes, seconds: 0 });
  
  useEffect(() => {
    // Update the countdown time
    const updateCountdown = () => {
      let { hours, minutes, seconds } = timeLeft;
      
      if (hours === 0 && minutes === 0 && seconds === 0) {
        if (onEnd) onEnd();
        return;
      }
      
      // Decrement the time
      if (seconds === 0) {
        if (minutes === 0) {
          hours -= 1;
          minutes = 59;
        } else {
          minutes -= 1;
        }
        seconds = 59;
      } else {
        seconds -= 1;
      }
      
      setTimeLeft({ hours, minutes, seconds });
    };
    
    // Update the countdown every second
    const timerId = setInterval(updateCountdown, 1000);
    
    // Clean up the interval on unmount
    return () => clearInterval(timerId);
  }, [timeLeft, onEnd]);
  
  useEffect(() => {
    // Update the component when the props change
    setTimeLeft({ hours, minutes, seconds: 0 });
  }, [hours, minutes]);
  
  return (
    <div className="countdown-container">
      <div className="countdown-timer">
        <div className="countdown-value">
          <span className="countdown-number">{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className="countdown-label">hours</span>
        </div>
        <div className="countdown-separator">:</div>
        <div className="countdown-value">
          <span className="countdown-number">{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className="countdown-label">minutes</span>
        </div>
        <div className="countdown-separator">:</div>
        <div className="countdown-value">
          <span className="countdown-number">{String(timeLeft.seconds).padStart(2, '0')}</span>
          <span className="countdown-label">seconds</span>
        </div>
      </div>
      <p className="countdown-text">until challenge begins</p>
    </div>
  );
};

export default CountdownTimer;