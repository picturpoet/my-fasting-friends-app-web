import React, { useState, useEffect, useRef } from 'react';
import { auth } from '../../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { createUserProfile } from '../../services/firestoreService';
import '../../App.css';
import '../../styles/colors.css';
import '../../styles/components.css';

function Signup({ setIsAuthenticated }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [showVerification, setShowVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const recaptchaContainerRef = useRef(null);

  // Set up reCAPTCHA verifier when component mounts
  useEffect(() => {
    // Clean up any existing recaptcha verifiers
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      } catch (error) {
        console.error("Error clearing recaptcha:", error);
      }
    }

    // Only setup reCAPTCHA when we need it, not on initial load
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch (error) {
          console.error("Error clearing recaptcha on unmount:", error);
        }
      }
    };
  }, []);

  const setupRecaptcha = () => {
    try {
      // Clear any existing verifier
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (error) {
          console.error("Error clearing existing reCAPTCHA:", error);
        }
      }
      
      // Create a new reCAPTCHA verifier with string ID
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log("reCAPTCHA verified successfully");
        }
      });
      
      // Render it so it's ready for use
      window.recaptchaVerifier.render().then(widgetId => {
        window.recaptchaWidgetId = widgetId;
      });

      return true;
    } catch (error) {
      console.error("Error setting up reCAPTCHA:", error);
      setError(`reCAPTCHA setup failed: ${error.message}`);
      return false;
    }
  };

  const handleSendVerificationCode = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      let formattedPhone = phoneNumber;
      if (!phoneNumber.startsWith('+')) {
        formattedPhone = `+91${phoneNumber}`;
      }
      
      // Setup reCAPTCHA if it doesn't exist
      if (!window.recaptchaVerifier) {
        const result = setupRecaptcha();
        if (!result) {
          setIsLoading(false);
          return;
        }
      }
      
      // Use the recaptchaVerifier instance
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      setShowVerification(true);
      alert("Verification code sent! Please check your phone.");
    } catch (error) {
      console.error("Error sending verification code:", error);
      setError(`Failed to send verification code: ${error.message}`);
      
      // Reset reCAPTCHA on error
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch (clearError) {
          console.error("Error clearing recaptcha:", clearError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!confirmationResult) {
      setError("Please request a verification code first");
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      const result = await confirmationResult.confirm(verificationCode);
      const user = result.user;
      
      await createUserProfile(user.uid, user.phoneNumber);
      
      localStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        phoneNumber: user.phoneNumber
      }));
      
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Error verifying code:", error);
      setError(`Verification failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // For testing only - bypass phone auth
  const handleTestLogin = () => {
    localStorage.setItem('user', JSON.stringify({
      uid: 'test-user-id',
      phoneNumber: '+91' + phoneNumber
    }));
    setIsAuthenticated(true);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-left">
          <img 
            src={`${process.env.PUBLIC_URL}/logo192.png`} 
            alt="My Fasting Friends Logo" 
            className="app-logo" 
          />
          <h1>My Fasting Friends</h1>
        </div>
      </header>
      
      <div className="auth-container">
        <div className="hero-image">
          <img 
            src={`${process.env.PUBLIC_URL}/logo512.png`} 
            alt="My Fasting Friends Logo" 
            className="hero-logo" 
          />
        </div>
        <h2>Welcome to My Fasting Friends</h2>
        
        {/* Create a dedicated container for reCAPTCHA */}
        <div id="recaptcha-container" ref={recaptchaContainerRef}></div>
        
        <p>Join our community of fasting enthusiasts and track your progress with friends.</p>
        
        {error && <div className="error-message">{error}</div>}
        
        {!showVerification ? (
          <div className="phone-input-container">
            <label htmlFor="phoneNumber">Enter your mobile number:</label>
            <div className="input-group">
              <span className="country-code">+91</span>
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit mobile number"
                maxLength={10}
              />
            </div>
            <button 
              onClick={handleSendVerificationCode}
              disabled={isLoading || !phoneNumber || phoneNumber.length < 10}
              className="primary-button"
            >
              {isLoading ? 'Sending...' : 'Get OTP'}
            </button>
            
            {/* Test login button - for development only */}
            <button 
              onClick={handleTestLogin}
              className="secondary-button"
              style={{marginTop: '10px'}}
            >
              Test Login (Skip OTP)
            </button>
          </div>
        ) : (
          <div className="verification-container">
            <p>We've sent a verification code to <strong>+91 {phoneNumber}</strong></p>
            <label htmlFor="verificationCode">Enter OTP:</label>
            <input
              type="text"
              id="verificationCode"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              placeholder="6-digit code"
              maxLength={6}
            />
            <div className="button-group">
              <button 
                onClick={handleVerifyCode}
                disabled={isLoading || !verificationCode || verificationCode.length < 6}
                className="primary-button"
              >
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </button>
              <button 
                onClick={() => setShowVerification(false)}
                disabled={isLoading}
                className="secondary-button"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Signup;