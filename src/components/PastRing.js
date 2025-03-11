import React, { useEffect, useRef } from 'react';
import '../styles/pastRing.css';

function PastRing({ progress, date, small = false, hours = null }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - (small ? 3 : 5);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = small ? 4 : 8;
    ctx.stroke();
    
    // Draw progress arc
    if (progress > 0) {
      const startAngle = -Math.PI / 2; // Start from top
      const endAngle = startAngle + (progress / 100) * (2 * Math.PI);
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      
      // Color based on progress
      if (progress >= 100) {
        ctx.strokeStyle = '#4CAF50'; // Green for complete
      } else if (progress >= 75) {
        ctx.strokeStyle = '#6200ee'; // Purple for good progress
      } else if (progress >= 50) {
        ctx.strokeStyle = '#FFC107'; // Yellow for medium progress
      } else {
        ctx.strokeStyle = '#F44336'; // Red for low progress
      }
      
      ctx.lineWidth = small ? 4 : 8;
      ctx.stroke();
    }
  }, [progress, small]);

  return (
    <div className={`past-ring-container ${small ? 'small-ring' : ''}`}>
      <canvas 
        ref={canvasRef} 
        width={small ? "50" : "80"} 
        height={small ? "50" : "80"} 
      ></canvas>
      <div className="past-progress-text">
        {hours !== null ? `${hours}h` : `${Math.round(progress)}%`}
      </div>
      {date && <div className="past-date">{date}</div>}
    </div>
  );
}

export default PastRing;