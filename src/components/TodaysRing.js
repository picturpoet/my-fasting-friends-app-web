import React, { useEffect, useRef } from 'react';

function TodaysRing({ progress }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 15;
    ctx.stroke();
    
    // Draw progress arc
    if (progress > 0) {
      const startAngle = -Math.PI / 2; // Start from top
      const endAngle = startAngle + (progress / 100) * (2 * Math.PI);
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.strokeStyle = progress >= 100 ? '#4CAF50' : '#6200ee';
      ctx.lineWidth = 15;
      ctx.stroke();
    }
  }, [progress]);
  
  return (
    <div className="ring-container">
      <canvas 
        ref={canvasRef} 
        width="200" 
        height="200" 
        style={{ maxWidth: '100%' }}
      ></canvas>
      <div className="progress-text">
        {Math.round(progress)}%
      </div>
    </div>
  );
}

export default TodaysRing;