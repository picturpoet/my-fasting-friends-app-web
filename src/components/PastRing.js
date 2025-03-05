import React from 'react';

function PastRing({ progress }) {
  const ringSize = 40; // Reduced size
  const strokeWidth = 4; // Adjusted stroke width
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div style={{ margin: '0 5px', display: 'flex', alignItems: 'center' }}>
      <svg width={ringSize} height={ringSize}>
        <circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={radius}
          stroke="#ccc"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={radius}
          stroke="#007bff" // Customize the color
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
        />
      </svg>
    </div>
  );
}

export default PastRing;