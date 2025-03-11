import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../firebase';
import { 
  getUserProfile, 
  createUserProfile, 
  updateUserState,
  getUserActiveChallenge
} from '../services/firestoreService';

// Create the context
export const UserContext = createContext();

// Custom hook to use the user context
export const useUser = () => {
  return useContext(UserContext);
};

// Provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userState, setUserState] = useState('loading'); // 'loading', 'new', 'active', 'inactive'
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        // User is signed in
        setUser(authUser);
        
        // Get user profile from Firestore
        try {
          let profile = await getUserProfile(authUser.uid);
          
          // Create profile if it doesn't exist
          if (!profile) {
            profile = await createUserProfile(authUser.uid, authUser.phoneNumber);
          }
          
          setUserProfile(profile);
          setUserState(profile.userState);
          
          // Get active challenge if exists
          if (profile.activeChallenge) {
            const challenge = await getUserActiveChallenge(authUser.uid);
            setActiveChallenge(challenge);
            
            // If challenge is expired, update user state
            if (challenge && challenge.status === 'expired') {
              await updateUserState(authUser.uid, 'inactive');
              setUserState('inactive');
              setActiveChallenge(null);
            }
          }
        } catch (error) {
          console.error("Error initializing user:", error);
        }
      } else {
        // User is signed out
        setUser(null);
        setUserProfile(null);
        setUserState('loading');
        setActiveChallenge(null);
      }
      
      setLoading(false);
    });

    // Clean up subscription
    return () => unsubscribe();
  }, []);
  
  // Function to update user state
  const changeUserState = async (newState) => {
    if (!user) return;
    
    try {
      await updateUserState(user.uid, newState);
      setUserState(newState);
    } catch (error) {
      console.error("Error updating user state:", error);
    }
  };
  
  // Function to refresh active challenge data
  const refreshActiveChallenge = async () => {
    if (!user) return;
    
    try {
      const challenge = await getUserActiveChallenge(user.uid);
      setActiveChallenge(challenge);
      
      // Update user state if challenge state changed
      if (!challenge && userState === 'active') {
        await updateUserState(user.uid, 'inactive');
        setUserState('inactive');
      } else if (challenge && challenge.status === 'expired' && userState === 'active') {
        await updateUserState(user.uid, 'inactive');
        setUserState('inactive');
      }
    } catch (error) {
      console.error("Error refreshing active challenge:", error);
    }
  };

  // Values to expose through the context
  const value = {
    user,
    userProfile,
    setUserProfile,
    userState,
    changeUserState,
    activeChallenge,
    setActiveChallenge,
    refreshActiveChallenge,
    loading
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};