import React, { useState } from 'react';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../../firebase'; // Import Firebase functions

function Signup({ setIsAuthenticated }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);

  const handleSendVerificationCode = () => {
    const appVerifier = window.recaptchaVerifier;
    signInWithPhoneNumber(auth, phoneNumber, appVerifier)
      .then((confirmationResult) => {
        // SMS sent. Prompt user to enter the code.
        window.confirmationResult = confirmationResult;
        // SMS sent. Prompt user to enter the code.
        setConfirmationResult(confirmationResult);
        alert("SMS Sent");
      }).catch((error) => {
        // Error; SMS not sent
          alert("Error: SMS not sent");
        console.error("Error sending verification code:", error);
      });
  };

  const handleVerifyCode = () => {
    confirmationResult.confirm(verificationCode).then((result) => {
      // User signed in successfully.
      const user = result.user;
        setIsAuthenticated(true);
      alert("User verified successfully!");
      // ...
    }).catch((error) => {
      // User couldn't sign in (bad verification code, invalid code, etc.)
      alert("Error: User couldn't sign in");
      console.error("Error verifying code:", error);
    });
  };

  return (
    <div>
      <h2>Signup</h2>
      <div id="sign-in-button"></div>
      <p>This is the Signup component.  Sign up to get started.</p>
      <div>
        <label htmlFor="phoneNumber">Phone Number:</label>
        <input
          type="tel"
          id="phoneNumber"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
        <button onClick={handleSendVerificationCode}>Send Verification Code</button>
      </div>
      {confirmationResult && (
        <div>
          <label htmlFor="verificationCode">Verification Code:</label>
          <input
            type="text"
            id="verificationCode"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
          />
          <button onClick={handleVerifyCode}>Verify Code</button>
        </div>
      )}
    </div>
  );
}

export default Signup;