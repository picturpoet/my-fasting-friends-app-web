import React, { useState } from 'react';
import { listCollectionDocuments, getDocumentById } from '../services/debugUtils';
import { useUser } from '../contexts/UserContext';
import { joinChallenge, getChallengeByInviteCode } from '../services/firestoreService';
import '../styles/colors.css';
import '../styles/components.css';

const DebugPanel = () => {
  const [collection, setCollection] = useState('challenges');
  const [documentId, setDocumentId] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { user } = useUser();
  
  const handleListCollection = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listCollectionDocuments(collection);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleGetDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDocumentById(collection, documentId);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleJoinChallenge = async () => {
    if (!inviteCode) {
      setError('Please enter an invite code');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // First get challenge by invite code
      const challenge = await getChallengeByInviteCode(inviteCode);
      setResult({ challengeFound: challenge });
      
      // Then attempt to join
      const joinResult = await joinChallenge(challenge.id, user.uid);
      setResult(prev => ({ ...prev, joinResult }));
    } catch (err) {
      setError(err.message);
      console.error('Join error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="debug-panel" style={{ padding: '20px', margin: '20px', border: '1px solid #ccc' }}>
      <h2>Debug Panel</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Collection Explorer</h3>
        <div style={{ display: 'flex', marginBottom: '10px' }}>
          <input 
            type="text" 
            value={collection} 
            onChange={(e) => setCollection(e.target.value)}
            placeholder="Collection name"
            style={{ flex: 1, marginRight: '10px', padding: '5px' }}
          />
          <button 
            onClick={handleListCollection}
            style={{ padding: '5px 10px' }}
            disabled={loading}
          >
            List Documents
          </button>
        </div>
        
        <div style={{ display: 'flex' }}>
          <input 
            type="text" 
            value={documentId} 
            onChange={(e) => setDocumentId(e.target.value)}
            placeholder="Document ID"
            style={{ flex: 1, marginRight: '10px', padding: '5px' }}
          />
          <button 
            onClick={handleGetDocument}
            style={{ padding: '5px 10px' }}
            disabled={loading}
          >
            Get Document
          </button>
        </div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Join Challenge Test</h3>
        <div style={{ display: 'flex' }}>
          <input 
            type="text" 
            value={inviteCode} 
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="Invite Code"
            style={{ flex: 1, marginRight: '10px', padding: '5px' }}
          />
          <button 
            onClick={handleJoinChallenge}
            style={{ padding: '5px 10px' }}
            disabled={loading}
          >
            Join Challenge
          </button>
        </div>
        <p>Current User ID: {user ? user.uid : 'Not logged in'}</p>
      </div>
      
      {loading && <div>Loading...</div>}
      
      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          Error: {error}
        </div>
      )}
      
      {result && (
        <div style={{ marginTop: '20px' }}>
          <h3>Result:</h3>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '10px', 
            overflow: 'auto',
            maxHeight: '300px'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;