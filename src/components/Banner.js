import React from 'react';

function Banner({ endTime }) {
  const calculateRemainingTime = (endTime) => {
    if (endTime === 'N/A') {
      return '5:2 fasting is not yet implemented';
    }

    const now = new Date();
    const [endHours, endMinutes] = endTime.split(':');
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(endHours), parseInt(endMinutes));

    let remainingTime = endOfDay.getTime() - now.getTime();

    if (remainingTime < 0) {
      remainingTime += 24 * 60 * 60 * 1000; // Add 24 hours if end time is before current time
      return "Fasting ended! Starts again tomorrow."
    }

    const hours = Math.floor(remainingTime / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));

    return `Fast ends in ${hours}h ${minutes}m`;
  };

  const remainingTimeMessage = calculateRemainingTime(endTime);

  return (
    <div className="banner">
      <p>{remainingTimeMessage}</p>
    </div>
  );
}

export default Banner;