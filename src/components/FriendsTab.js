import React, { useState } from 'react';
import '../styles/colors.css';
import '../styles/components.css';

function FriendsTab() {
  // For simplicity, we're focusing only on WhatsApp invites now
  const [isLoading, setIsLoading] = useState(false);
  
  
  const handleInviteViaWhatsApp = () => {
    // Create invitation message
    const message = encodeURIComponent(
      "Want to lose weight or gain focus? Let's do it together. Join me on My Fasting Friends. Link: https://my-fasting-friends-app.web.app"
    );
    
    // Generate WhatsApp URL
    const whatsappUrl = `https://wa.me/?text=${message}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="friends-tab">
      <h2>Invite Friends</h2>
      
      <div className="invite-section">
        <div className="invite-card">
          <div className="invite-icon">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/767px-WhatsApp.svg.png" 
                 alt="WhatsApp" width="60" />
          </div>
          <div className="invite-content">
            <h3>Share via WhatsApp</h3>
            <p>Invite your friends to join you on your fasting journey</p>
            
            <button
              onClick={handleInviteViaWhatsApp}
              disabled={isLoading}
              className="primary-button whatsapp-button"
            >
              Invite Friend
            </button>
          </div>
        </div>
      </div>
      
      <div className="coming-soon-section">
        <h3>Coming Soon</h3>
        <p>Friend requests, challenges, and leaderboards will be available in the next update!</p>
        
        <div className="feature-preview">
          <div className="feature-card">
            <h4>7-Day Challenges</h4>
            <p>Create and join fasting challenges with your friends</p>
          </div>
          
          <div className="feature-card">
            <h4>Leaderboards</h4>
            <p>See who's most consistent with their fasting goals</p>
          </div>
          
          <div className="feature-card">
            <h4>Achievement Badges</h4>
            <p>Earn badges for completing fasting milestones</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FriendsTab;