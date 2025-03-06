import React from 'react';

function Banner({ isFasting, endTime }) {
  // Get current time
  const now = new Date();
  const currentTime = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  
  return (
    <div className="banner">
      {isFasting ? (
        <>
          <span role="img" aria-label="Fasting">⏱️</span>
          <span> You're currently fasting until {endTime}</span>
        </>
      ) : (
        <>
          <span role="img" aria-label="Not Fasting">🍽️</span>
          <span> You're not fasting. Start a new fast whenever you're ready!</span>
        </>
      )}
    </div>
  );
}

export default Banner;