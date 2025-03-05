import React, { useState } from 'react';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../firebase'; // Import Firebase functions

function Signup() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);

  const handleSendVerificationCode = () => {
    const appVerifier = window.recaptchaVerifier;
    signInWithPhoneNumber(auth, phoneNumber, appVerifier)
      .then((result) => {
        setConfirmationResult(result);
        alert("SMS sent!");
      }).catch((error) => {
        console.error("Error sending verification code:", error);
      });
  };

  const handleVerifyCode = () => {
    confirmationResult.confirm(verificationCode).then((result) => {
      // User signed in successfully.
      const user = result.user;
      alert("User verified successfully!");
      // ...
    }).catch((error) => {
      // User couldn't sign in (bad verification code, invalid code, etc.)
      console.error("Error verifying code:", error);
    });
  };

  return (
    <div>
      <h2>Signup</h2>
      <div id="sign-in-button"></div>
      <p>This is the Signup component.</p>
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