import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Force cache clearing on app launch
if ('serviceWorker' in navigator) {
  // Unregister any existing service workers
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
    }
  });
  
  // Clear all caches
  caches.keys().then(function(cacheNames) {
    cacheNames.forEach(function(cacheName) {
      caches.delete(cacheName);
    });
  });
}

// Add timestamp to localStorage to force refresh on version changes
const appVersion = "1741735750138";
const lastVersion = localStorage.getItem('appVersion');
if (lastVersion !== appVersion) {
  localStorage.setItem('appVersion', appVersion);
  
  // Force reload if version changed and this isn't the first load
  if (lastVersion) {
    window.location.reload(true); // Hard reload
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();