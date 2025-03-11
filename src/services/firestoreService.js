import { db, auth } from '../firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc,
  writeBatch,
  Timestamp 
} from 'firebase/firestore';

// Helper function to generate unique ID for invites
const generateUniqueInviteId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// User profile functions
export const createUserProfile = async (userId, phoneNumber) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Check if user already exists
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data();
    }
    
    // Create new user profile
    const userData = {
      phoneNumber,
      displayName: '',
      photoURL: '',
      createdAt: Timestamp.now(),
      lastActive: Timestamp.now(),
      fastingPreferences: {
        fastingType: '16:8',
        startTime: '12:00',
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      notificationPreferences: {
        enabled: true,
        startReminder: true,
        endReminder: true,
        encouragementMessages: true,
      },
      // New fields for milestone 1
      userState: 'new',
      activeChallenge: null,
      uniqueInviteId: generateUniqueInviteId(),
      // Weight tracking fields
      weightGoal: null
    };
    
    await setDoc(userRef, userData);
    return userData;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId, data) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...data,
      lastActive: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Fasting records functions
export const startFasting = async (userId, fastingType, startTime, challengeId = null) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Calculate target duration in minutes
    let targetDurationMins;
    switch (fastingType) {
      case '16:8':
        targetDurationMins = 16 * 60;
        break;
      case 'OMAD':
        targetDurationMins = 23 * 60;
        break;
      default:
        targetDurationMins = 16 * 60; // Default to 16 hours
    }
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    const startDateTime = new Date(today);
    startDateTime.setHours(startHour, startMin, 0);
    
    // Calculate target end time
    const targetEndDateTime = new Date(startDateTime);
    targetEndDateTime.setMinutes(targetEndDateTime.getMinutes() + targetDurationMins);
    
    const fastingData = {
      userId,
      date: Timestamp.fromDate(today),
      startTime: Timestamp.fromDate(startDateTime),
      targetEndTime: Timestamp.fromDate(targetEndDateTime),
      actualEndTime: null,
      fastingType,
      targetDuration: targetDurationMins,
      actualDuration: 0,
      completionPercentage: 0,
      status: 'ongoing',
      challengeId, // Add challenge ID if available
      notes: ''
    };
    
    const docRef = await addDoc(collection(db, 'fastingRecords'), fastingData);
    return { id: docRef.id, ...fastingData };
  } catch (error) {
    console.error('Error starting fasting:', error);
    throw error;
  }
};

export const endFasting = async (recordId) => {
  try {
    const recordRef = doc(db, 'fastingRecords', recordId);
    const recordSnap = await getDoc(recordRef);
    
    if (!recordSnap.exists()) {
      throw new Error('Fasting record not found');
    }
    
    const recordData = recordSnap.data();
    const now = new Date();
    
    // Calculate actual duration
    const startTime = recordData.startTime.toDate();
    const targetEndTime = recordData.targetEndTime.toDate();
    const actualEndTime = now;
    
    const targetDurationMs = targetEndTime.getTime() - startTime.getTime();
    const actualDurationMs = actualEndTime.getTime() - startTime.getTime();
    const actualDurationMins = Math.floor(actualDurationMs / (1000 * 60));
    const completionPercentage = Math.min(100, (actualDurationMs / targetDurationMs) * 100);
    const isCompleted = completionPercentage >= 100;
    
    await updateDoc(recordRef, {
      actualEndTime: Timestamp.fromDate(actualEndTime),
      actualDuration: actualDurationMins,
      completionPercentage: completionPercentage,
      status: isCompleted ? 'completed' : 'broken'
    });
    
    // If this fast is part of a challenge, update challenge participant record
    if (recordData.challengeId) {
      try {
        // Find the participant record for this user in this challenge
        const q = query(
          collection(db, 'challengeParticipants'),
          where('challengeId', '==', recordData.challengeId),
          where('userId', '==', recordData.userId)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const participantDoc = querySnapshot.docs[0];
          const participantData = participantDoc.data();
          
          // Only update if the fast was completed
          if (isCompleted) {
            await updateDoc(participantDoc.ref, {
              completedDays: participantData.completedDays + 1,
              totalScore: participantData.totalScore + 10, // Basic scoring: +10 per completed fast
              dailyScores: [...participantData.dailyScores, {
                date: Timestamp.fromDate(now), 
                score: 10,
                fastingRecord: recordId
              }]
            });
          } else {
            // If not completed, still record the attempt but with lower score
            await updateDoc(participantDoc.ref, {
              dailyScores: [...participantData.dailyScores, {
                date: Timestamp.fromDate(now), 
                score: Math.floor(completionPercentage / 20), // 0-5 points based on completion
                fastingRecord: recordId
              }]
            });
          }
        }
      } catch (error) {
        console.error('Error updating challenge statistics:', error);
        // Continue with the function even if this fails
      }
    }
    
    return {
      ...recordData,
      actualEndTime: Timestamp.fromDate(actualEndTime),
      actualDuration: actualDurationMins,
      completionPercentage: completionPercentage,
      status: isCompleted ? 'completed' : 'broken'
    };
  } catch (error) {
    console.error('Error ending fasting:', error);
    throw error;
  }
};

export const getFastingRecords = async (userId, limit = 7) => {
  try {
    const q = query(
      collection(db, 'fastingRecords'),
      where('userId', '==', userId),
      // orderBy('date', 'desc') // Note: Need to create index for this to work
    );
    
    const querySnapshot = await getDocs(q);
    let records = [];
    
    querySnapshot.forEach((doc) => {
      records.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Sort manually since we don't have an index yet
    records.sort((a, b) => b.date.seconds - a.date.seconds);
    
    return records.slice(0, limit);
  } catch (error) {
    console.error('Error getting fasting records:', error);
    throw error;
  }
};

export const getChallengeFastingRecords = async (challengeId, userId = null) => {
  try {
    let q;
    
    if (userId) {
      // Get records for specific user in challenge
      q = query(
        collection(db, 'fastingRecords'),
        where('challengeId', '==', challengeId),
        where('userId', '==', userId)
      );
    } else {
      // Get all records for the challenge
      q = query(
        collection(db, 'fastingRecords'),
        where('challengeId', '==', challengeId)
      );
    }
    
    const querySnapshot = await getDocs(q);
    let records = [];
    
    querySnapshot.forEach((doc) => {
      records.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Sort by date
    records.sort((a, b) => b.date.seconds - a.date.seconds);
    
    return records;
  } catch (error) {
    console.error('Error getting challenge fasting records:', error);
    throw error;
  }
};

// Challenge functions
export const createChallenge = async (name, description, startDate, endDate, fastingType, creatorId) => {
  try {
    const challengeData = {
      name,
      description,
      creatorId,
      startDate: Timestamp.fromDate(new Date(startDate)),
      endDate: Timestamp.fromDate(new Date(endDate)),
      participants: [creatorId],
      status: 'active', // Updated to use 'active' instead of 'upcoming'
      isPublic: true,
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      // New fields for milestone 1
      fastingType: fastingType // '16:8', 'OMAD', or 'Long fast'
    };
    
    const docRef = await addDoc(collection(db, 'challenges'), challengeData);
    
    // Create the creator as first participant
    await addDoc(collection(db, 'challengeParticipants'), {
      challengeId: docRef.id,
      userId: creatorId,
      joinedAt: Timestamp.now(),
      dailyScores: [],
      totalScore: 0,
      rank: 1,
      completedDays: 0
    });
    
    // Update the creator's user profile to set this as their active challenge
    const userRef = doc(db, 'users', creatorId);
    await updateDoc(userRef, {
      activeChallenge: docRef.id,
      userState: 'active' // Set user state to active when they create a challenge
    });
    
    return { id: docRef.id, ...challengeData };
  } catch (error) {
    console.error('Error creating challenge:', error);
    throw error;
  }
};

export const joinChallenge = async (challengeId, userId) => {
  try {
    console.log(`Starting join challenge process for user ${userId} to challenge ${challengeId}`);
    
    // First check if the user already has an active challenge
    const userRef = doc(db, 'users', userId);
    console.log(`Fetching user data for ${userId}`);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.error(`User ${userId} not found`);
      throw new Error('User not found');
    }
    
    const userData = userSnap.data();
    console.log(`User data retrieved, active challenge: ${userData.activeChallenge}`);
    
    if (userData.activeChallenge) {
      console.error(`User ${userId} already has active challenge: ${userData.activeChallenge}`);
      throw new Error('You already have an active challenge. You must complete or leave it before joining a new one.');
    }
    
    // Verify the challenge exists and user is not already a participant
    const challengeRef = doc(db, 'challenges', challengeId);
    console.log(`Fetching challenge data for ${challengeId}`);
    const challengeSnap = await getDoc(challengeRef);
    
    if (!challengeSnap.exists()) {
      console.error(`Challenge ${challengeId} not found`);
      throw new Error('Challenge not found');
    }
    
    const challengeData = challengeSnap.data();
    console.log(`Challenge data retrieved: ${JSON.stringify(challengeData)}`);
    
    // Check if challenge is expired
    if (challengeData.status === 'expired') {
      console.error(`Challenge ${challengeId} is expired`);
      throw new Error('This challenge has expired');
    }
    
    // Check if user is already a participant
    if (challengeData.participants && challengeData.participants.includes(userId)) {
      console.log(`User ${userId} is already a participant in challenge ${challengeId}`);
      return { success: true, message: 'Already a participant' };
    }
    
    // Make sure participants is an array (defensive programming)
    const currentParticipants = challengeData.participants || [];
    console.log(`Current participants: ${JSON.stringify(currentParticipants)}`);
    
    try {
      // All challenges are public and available to join by anyone with the invite code
      // Add user to participants array
      console.log(`Updating challenge ${challengeId} to add user ${userId} to participants`);
      console.log(`Debug: Attempting to update challenge with following data:`, {
        participants: [...currentParticipants, userId]
      });
      
      try {
        await updateDoc(challengeRef, {
          participants: [...currentParticipants, userId]
        });
        console.log(`Successfully updated challenge participants`);
      } catch (innerError) {
        console.error(`Permission error updating challenge participants: ${innerError.message}`, innerError);
        console.error(`Firebase error code:`, innerError.code);
        throw innerError;
      }
    } catch (error) {
      console.error(`Error updating challenge participants: ${error.message}`);
      throw new Error(`Failed to update challenge participants: ${error.message}`);
    }
    
    try {
      // Create participant record
      console.log(`Creating challenge participant record for user ${userId} in challenge ${challengeId}`);
      try {
        await addDoc(collection(db, 'challengeParticipants'), {
          challengeId,
          userId,
          joinedAt: Timestamp.now(),
          dailyScores: [],
          totalScore: 0,
          rank: currentParticipants.length + 1,
          completedDays: 0
        });
        console.log(`Successfully created challenge participant record`);
      } catch (innerError) {
        console.error(`Permission error creating participant record: ${innerError.message}`, innerError);
        console.error(`Firebase error code:`, innerError.code);
        throw innerError;
      }
    } catch (error) {
      console.error(`Error creating participant record: ${error.message}`);
      // If this fails, try to remove the user from participants
      try {
        console.log(`Attempting to rollback participants update`);
        await updateDoc(challengeRef, {
          participants: currentParticipants
        });
      } catch (rollbackError) {
        console.error(`Failed to rollback participants update: ${rollbackError.message}`);
      }
      throw new Error(`Failed to create participant record: ${error.message}`);
    }
    
    try {
      // Update the user's profile to set this as their active challenge and change state to active
      console.log(`Updating user ${userId} profile to set active challenge to ${challengeId}`);
      await updateDoc(userRef, {
        activeChallenge: challengeId,
        userState: 'active'
      });
      console.log(`Successfully updated user profile`);
    } catch (error) {
      console.error(`Error updating user profile: ${error.message}`);
      // If this fails, try to clean up the previous operations
      try {
        console.log(`Attempting to rollback challenge changes`);
        await updateDoc(challengeRef, {
          participants: currentParticipants
        });
        // Could also try to remove the participant record here, but it's more complex
      } catch (rollbackError) {
        console.error(`Failed to rollback challenge changes: ${rollbackError.message}`);
      }
      throw new Error(`Failed to update user profile: ${error.message}`);
    }
    
    console.log(`Successfully joined challenge ${challengeId}`);
    return { success: true, message: 'Successfully joined challenge' };
  } catch (error) {
    console.error('Error joining challenge:', error);
    throw error;
  }
};

// User state management functions
export const updateUserState = async (userId, newState) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      userState: newState,
      lastActive: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error updating user state:', error);
    throw error;
  }
};

export const leaveChallenge = async (userId) => {
  try {
    // Get user data first to verify they have an active challenge
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userSnap.data();
    
    if (!userData.activeChallenge) {
      throw new Error('You are not currently in any challenge');
    }
    
    const challengeId = userData.activeChallenge;
    
    // Get the challenge
    const challengeRef = doc(db, 'challenges', challengeId);
    const challengeSnap = await getDoc(challengeRef);
    
    if (challengeSnap.exists()) {
      const challengeData = challengeSnap.data();
      
      // Remove user from participants array
      const updatedParticipants = challengeData.participants.filter(id => id !== userId);
      
      await updateDoc(challengeRef, {
        participants: updatedParticipants
      });
    }
    
    // Update user profile
    await updateDoc(userRef, {
      activeChallenge: null,
      userState: 'inactive' // Set to inactive when leaving a challenge
    });
    
    // Find and delete challenge participant record
    const q = query(
      collection(db, 'challengeParticipants'),
      where('challengeId', '==', challengeId),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });
    
    return { success: true, message: 'Successfully left the challenge' };
  } catch (error) {
    console.error('Error leaving challenge:', error);
    throw error;
  }
};

// Challenge expiration function
export const checkAndExpireChallenges = async () => {
  try {
    const now = new Date();
    
    // Get all active challenges
    const q = query(
      collection(db, 'challenges'),
      where('status', '==', 'active'),
      where('endDate', '<', Timestamp.fromDate(now))
    );
    
    const querySnapshot = await getDocs(q);
    let expired = 0;
    
    // Update each expired challenge
    const batch = writeBatch(db);
    
    querySnapshot.forEach((doc) => {
      batch.update(doc.ref, { status: 'expired' });
      expired++;
    });
    
    if (expired > 0) {
      await batch.commit();
    }
    
    return { success: true, expiredCount: expired };
  } catch (error) {
    console.error('Error checking for expired challenges:', error);
    throw error;
  }
};

export const getUserActiveChallenge = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userSnap.data();
    
    if (!userData.activeChallenge) {
      return null;
    }
    
    // Get the active challenge details
    const challengeRef = doc(db, 'challenges', userData.activeChallenge);
    const challengeSnap = await getDoc(challengeRef);
    
    if (!challengeSnap.exists()) {
      // If the challenge doesn't exist but was set in user profile, update user profile
      await updateDoc(userRef, {
        activeChallenge: null
      });
      return null;
    }
    
    return {
      id: challengeSnap.id,
      ...challengeSnap.data()
    };
  } catch (error) {
    console.error('Error getting user active challenge:', error);
    throw error;
  }
};

// Function to get global leaderboard
export const getGlobalLeaderboard = async (limit = 10) => {
  try {
    // First get users with highest total completed fasts
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    // Extract user data and calculate scores based on fasting records
    const userPromises = querySnapshot.docs.map(async (userDoc) => {
      const userData = userDoc.data();
      
      // Get user's fasting records
      const fastingRecordsQuery = query(
        collection(db, 'fastingRecords'),
        where('userId', '==', userDoc.id),
        where('status', '==', 'completed')
      );
      
      const fastingRecords = await getDocs(fastingRecordsQuery);
      const completedFasts = fastingRecords.size;
      
      // Calculate total score (10 points per completed fast)
      const totalScore = completedFasts * 10;
      
      return {
        id: userDoc.id,
        displayName: userData.displayName || 'Anonymous',
        photoURL: userData.photoURL || null,
        completedFasts,
        totalScore,
      };
    });
    
    // Resolve all promises
    let leaderboard = await Promise.all(userPromises);
    
    // Sort by total score (descending)
    leaderboard.sort((a, b) => b.totalScore - a.totalScore);
    
    // Return top users
    return leaderboard.slice(0, limit);
  } catch (error) {
    console.error('Error getting global leaderboard:', error);
    throw error;
  }
};

// Function to get challenge participants with their stats
export const getChallengeParticipants = async (challengeId) => {
  try {
    const q = query(
      collection(db, 'challengeParticipants'),
      where('challengeId', '==', challengeId)
    );
    
    const querySnapshot = await getDocs(q);
    const participants = [];
    
    // Get all participant data
    for (const docSnapshot of querySnapshot.docs) {
      const participantData = docSnapshot.data();
      
      // Get user details
      const userRef = doc(db, 'users', participantData.userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        
        participants.push({
          ...participantData,
          displayName: userData.displayName || 'Anonymous',
          photoURL: userData.photoURL || null,
        });
      }
    }
    
    // Sort by total score (descending)
    participants.sort((a, b) => b.totalScore - a.totalScore);
    
    // Update ranks based on current scores
    participants.forEach((participant, index) => {
      participant.rank = index + 1;
    });
    
    return participants;
  } catch (error) {
    console.error('Error getting challenge participants:', error);
    throw error;
  }
};

// Function to get challenge by invite code
export const getChallengeByInviteCode = async (inviteCode) => {
  try {
    if (!inviteCode || typeof inviteCode !== 'string' || inviteCode.length === 0) {
      throw new Error('Invalid invite code format');
    }
    
    const normalizedCode = inviteCode.toUpperCase().trim();
    
    const q = query(
      collection(db, 'challenges'),
      where('inviteCode', '==', normalizedCode)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Invalid invite code. Challenge not found.');
    }
    
    // Get the first (and should be only) document
    const doc = querySnapshot.docs[0];
    
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('Error getting challenge by invite code:', error);
    throw error;
  }
};

// Function to share challenge via invite code
export const generateChallengeSharingLink = (inviteCode, baseUrl = window.location.origin) => {
  try {
    if (!inviteCode) {
      throw new Error('Invalid invite code');
    }
    
    // Clean and normalize the invite code
    const cleanCode = inviteCode.toUpperCase().trim();
    
    // Generate a URL for sharing
    const sharingUrl = `${baseUrl}/join-challenge?code=${cleanCode}`;
    
    return {
      success: true,
      url: sharingUrl,
      inviteCode: cleanCode
    };
  } catch (error) {
    console.error('Error generating sharing link:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Friendship functions
export const sendFriendRequest = async (senderId, recipientId) => {
  try {
    // Check if a friendship already exists
    const q1 = query(
      collection(db, 'friendships'),
      where('user1Id', '==', senderId),
      where('user2Id', '==', recipientId)
    );
    
    const q2 = query(
      collection(db, 'friendships'),
      where('user1Id', '==', recipientId),
      where('user2Id', '==', senderId)
    );
    
    const querySnapshot1 = await getDocs(q1);
    const querySnapshot2 = await getDocs(q2);
    
    if (!querySnapshot1.empty || !querySnapshot2.empty) {
      return { success: false, message: 'Friendship already exists' };
    }
    
    // Create the friendship request
    const friendshipData = {
      user1Id: senderId,
      user2Id: recipientId,
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      initiatedBy: senderId
    };
    
    await addDoc(collection(db, 'friendships'), friendshipData);
    
    // Create a notification for the recipient
    await addDoc(collection(db, 'notifications'), {
      userId: recipientId,
      type: 'friend_request',
      title: 'New Friend Request',
      message: 'You have a new friend request',
      data: { senderId },
      isRead: false,
      createdAt: Timestamp.now()
    });
    
    return { success: true, message: 'Friend request sent' };
  } catch (error) {
    console.error('Error sending friend request:', error);
    throw error;
  }
};

// Weight tracking functions
export const addWeightRecord = async (userId, weight, date = new Date()) => {
  try {
    const weightData = {
      userId,
      weight: parseFloat(weight),
      date: Timestamp.fromDate(date),
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'weightRecords'), weightData);
    return { id: docRef.id, ...weightData };
  } catch (error) {
    console.error('Error adding weight record:', error);
    throw error;
  }
};

export const getWeightRecords = async (userId, limit = 30) => {
  try {
    const q = query(
      collection(db, 'weightRecords'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    let records = [];
    
    querySnapshot.forEach((doc) => {
      records.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Sort by date
    records.sort((a, b) => a.date.seconds - b.date.seconds);
    
    // Return the most recent records up to the limit
    return records.slice(-limit);
  } catch (error) {
    console.error('Error getting weight records:', error);
    throw error;
  }
};

export const updateWeightGoal = async (userId, goalWeight) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'weightGoal': parseFloat(goalWeight)
    });
    return true;
  } catch (error) {
    console.error('Error updating weight goal:', error);
    throw error;
  }
};

export const getWeightGoal = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userSnap.data();
    return userData.weightGoal || null;
  } catch (error) {
    console.error('Error getting weight goal:', error);
    throw error;
  }
};

// Fasting statistics functions
export const getUserFastingStats = async (userId) => {
  try {
    // Get all fasting records for the user
    const q = query(
      collection(db, 'fastingRecords'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const records = [];
    
    querySnapshot.forEach((doc) => {
      records.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Calculate statistics
    const completedFasts = records.filter(r => r.status === 'completed').length;
    const totalFasts = records.length;
    const successRate = totalFasts > 0 ? Math.round((completedFasts / totalFasts) * 100) : 0;
    
    // Get challenge stats
    const activeChallenge = await getUserActiveChallenge(userId);
    let challengeStats = null;
    
    if (activeChallenge) {
      const participantQuery = query(
        collection(db, 'challengeParticipants'),
        where('challengeId', '==', activeChallenge.id),
        where('userId', '==', userId)
      );
      
      const participantSnapshot = await getDocs(participantQuery);
      
      if (!participantSnapshot.empty) {
        const participantData = participantSnapshot.docs[0].data();
        
        challengeStats = {
          completedDays: participantData.completedDays || 0,
          totalScore: participantData.totalScore || 0,
          rank: participantData.rank || 0,
          challengeName: activeChallenge.name
        };
      }
    }
    
    // Get longest streak
    let currentStreak = 0;
    let longestStreak = 0;
    
    // Sort records by date for streak calculation
    records.sort((a, b) => a.date.seconds - b.date.seconds);
    
    for (let i = 0; i < records.length; i++) {
      if (records[i].status === 'completed') {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    return {
      completedFasts,
      totalFasts,
      successRate,
      longestStreak,
      currentStreak,
      challengeStats
    };
  } catch (error) {
    console.error('Error getting user fasting stats:', error);
    throw error;
  }
};