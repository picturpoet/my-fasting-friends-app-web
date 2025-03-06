import React, { useState } from 'react';
import { auth, RecaptchaVerifier } from '../../firebase';
import { signInWithPhoneNumber } from "firebase/auth";
import { createUserProfile } from '../../services/firestoreService';
import logo from '../../logo512.png'; // Import the logo

function Signup({ setIsAuthenticated }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [showVerification, setShowVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // For testing only - bypass phone auth
  const handleTestLogin = () => {
    // Set logged in state in localStorage
    localStorage.setItem('user', JSON.stringify({
      uid: 'test-user-id',
      phoneNumber: '+91' + phoneNumber
    }));
    
    setIsAuthenticated(true);
  };

  const handleSendVerificationCode = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Format phone number to E.164 standard if needed
      let formattedPhone = phoneNumber;
      if (!phoneNumber.startsWith('+')) {
        formattedPhone = `+91${phoneNumber}`; // Assuming India country code
      }
      
      // Initialize reCAPTCHA verifier
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'sign-in-button', {
        'size': 'invisible',
        'callback': () => {
          // reCAPTCHA solved
        }
      });
      
      // Send verification code
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      setConfirmationResult(confirmation);
      setShowVerification(true);
      alert("Verification code sent! Please check your phone.");
    } catch (error) {
      console.error("Error sending verification code:", error);
      setError(`Failed to send verification code: ${error.message}`);
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
      
      // Confirm the verification code
      const result = await confirmationResult.confirm(verificationCode);
      
      // User successfully signed in
      const user = result.user;
      
      // Create or update user profile in Firestore
      await createUserProfile(user.uid, user.phoneNumber);
      
      // Store basic user info in localStorage
      localStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        phoneNumber: user.phoneNumber
      }));
      
      // Update authentication state
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Error verifying code:", error);
      setError(`Verification failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="hero-image">
        <img src={logo} alt="My Fasting Friends Logo" />
      </div>
      <h2>Welcome to My Fasting Friends</h2>
      <div id="sign-in-button"></div>
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
  );
}

export default Signup;