import React, { useState, useEffect, useRef } from 'react';
import { auth } from '../../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { createUserProfile } from '../../services/firestoreService';
import '../../App.css';
import '../../styles/colors.css';
import '../../styles/components.css';

function Signup() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [showVerification, setShowVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const recaptchaVerifier = useRef(null);
  const recaptchaContainer = useRef(null);
  const [isRecaptchaReady, setIsRecaptchaReady] = useState(false);

  // Initialize reCAPTCHA only once when the container is ready
  useEffect(() => {
    if (!recaptchaVerifier.current) {
      try {
        // Create the RecaptchaVerifier with the container ID, not the ref
        recaptchaVerifier.current = new RecaptchaVerifier(
          'recaptcha-container',
          {
            size: 'invisible',
            callback: () => {
              // reCAPTCHA solved, allow signInWithPhoneNumber.
              setIsRecaptchaReady(true);
            },
            'expired-callback': () => {
              // Response expired. Ask user to solve reCAPTCHA again.
              setIsRecaptchaReady(false);
              setError('reCAPTCHA expired. Please try again.');
            }
          },
          auth
        );
        
        // Render the reCAPTCHA
        recaptchaVerifier.current.render().then(() => {
          setIsRecaptchaReady(true);
        });
      } catch (error) {
        console.error('Error creating RecaptchaVerifier:', error);
        setError('Failed to initialize reCAPTCHA: ' + error.message);
      }
    }

    return () => {
      if (recaptchaVerifier.current) {
        try {
          recaptchaVerifier.current.clear();
        } catch (e) {
          console.error('Error clearing reCAPTCHA:', e);
        }
        recaptchaVerifier.current = null;
      }
    };
  }, []);

  const handleSendVerificationCode = async () => {
    try {
      setIsLoading(true);
      setError('');

      if (!isRecaptchaReady) {
        throw new Error('reCAPTCHA is not ready.');
      }

      let formattedPhone = phoneNumber;
      if (!phoneNumber.startsWith('+')) {
        formattedPhone = `+91${phoneNumber}`;
      }

      // Ensure recaptchaVerifier.current is valid before using it
      if (!recaptchaVerifier.current) {
        throw new Error('reCAPTCHA not initialized properly.');
      }
      const confirmation = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        recaptchaVerifier.current
      );
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

      const result = await confirmationResult.confirm(verificationCode);
      // Authentication is handled by our UserContext now
    } catch (error) {
      console.error("Error verifying code:", error);
      setError(`Verification failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // For testing only - bypass phone auth in development
  const handleTestLogin = () => {
    if (process.env.NODE_ENV === 'development') {
      // This will only work in an emulator environment
      console.log('Using test login in development');
    } else {
      setError('Test login is only available in development mode');
    }
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
              disabled={isLoading || !phoneNumber || phoneNumber.length < 10 || !isRecaptchaReady}
              className="primary-button"
            >
              {isLoading ? 'Sending...' : 'Get OTP'}
            </button>

            {/* Test login button - for development only */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={handleTestLogin}
                className="secondary-button"
                style={{ marginTop: '10px' }}
              >
                Test Login (Skip OTP)
              </button>
            )}
          </div>
        ) : (
          <div className="verification-container">
            <p>We've sent a verification code to <strong>+91 {phoneNumber}</strong></p>
            <label htmlFor="verificationCode">Enter OTP:</label>
              <div className="input-group">
                <input
                  type="text"
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-digit code"
                  maxLength={6}
                />
              </div>
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
        {/* This div will hold the invisible reCAPTCHA widget - don't hide it with display:none */}
        <div id="recaptcha-container" ref={recaptchaContainer}></div>
      </div>
    </div>
  );
}

export default Signup;
