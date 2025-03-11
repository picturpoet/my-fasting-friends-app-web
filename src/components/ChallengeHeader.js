import React from 'react';
import '../styles/challengeHeader.css';

const ChallengeHeader = ({ challenge }) => {
  if (!challenge) return null;
  
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };
  
  return (
    <div className="challenge-header">
      <div className="challenge-title">
        <h2>{challenge.name} is now live</h2>
      </div>
      
      <div className="challenge-details-grid">
        <div className="challenge-detail-item">
          <span className="detail-label">Challenge duration:</span>
          <span className="detail-value">
            {formatDate(challenge.startDate)} - {formatDate(challenge.endDate)}
          </span>
        </div>
        
        <div className="challenge-detail-item">
          <span className="detail-label">Fasting type:</span>
          <span className="detail-value">{challenge.fastingType}</span>
        </div>
      </div>
      
      {challenge.description && (
        <p className="challenge-description">{challenge.description}</p>
      )}
    </div>
  );
};

export default ChallengeHeader;