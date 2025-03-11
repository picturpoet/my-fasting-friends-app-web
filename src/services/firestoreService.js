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
      uniqueInviteId: generateUniqueInviteId()
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
    // First check if the user already has an active challenge
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userSnap.data();
    if (userData.activeChallenge) {
      throw new Error('You already have an active challenge. You must complete or leave it before joining a new one.');
    }
    
    // Verify the challenge exists and user is not already a participant
    const challengeRef = doc(db, 'challenges', challengeId);
    const challengeSnap = await getDoc(challengeRef);
    
    if (!challengeSnap.exists()) {
      throw new Error('Challenge not found');
    }
    
    const challengeData = challengeSnap.data();
    
    // Check if challenge is expired
    if (challengeData.status === 'expired') {
      throw new Error('This challenge has expired');
    }
    
    if (challengeData.participants.includes(userId)) {
      return { success: true, message: 'Already a participant' };
    }
    
    // Add user to participants array
    await updateDoc(challengeRef, {
      participants: [...challengeData.participants, userId]
    });
    
    // Create participant record
    await addDoc(collection(db, 'challengeParticipants'), {
      challengeId,
      userId,
      joinedAt: Timestamp.now(),
      dailyScores: [],
      totalScore: 0,
      rank: challengeData.participants.length + 1,
      completedDays: 0
    });
    
    // Update the user's profile to set this as their active challenge and change state to active
    await updateDoc(userRef, {
      activeChallenge: challengeId,
      userState: 'active'
    });
    
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
    const q = query(
      collection(db, 'challenges'),
      where('inviteCode', '==', inviteCode)
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