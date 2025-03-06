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
  Timestamp 
} from 'firebase/firestore';

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
      }
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
export const startFasting = async (userId, fastingType, startTime) => {
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
    
    await updateDoc(recordRef, {
      actualEndTime: Timestamp.fromDate(actualEndTime),
      actualDuration: actualDurationMins,
      completionPercentage: completionPercentage,
      status: completionPercentage >= 100 ? 'completed' : 'broken'
    });
    
    return {
      ...recordData,
      actualEndTime: Timestamp.fromDate(actualEndTime),
      actualDuration: actualDurationMins,
      completionPercentage: completionPercentage,
      status: completionPercentage >= 100 ? 'completed' : 'broken'
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

// Challenge functions
export const createChallenge = async (name, description, startDate, endDate, rules, creatorId) => {
  try {
    const challengeData = {
      name,
      description,
      creatorId,
      startDate: Timestamp.fromDate(new Date(startDate)),
      endDate: Timestamp.fromDate(new Date(endDate)),
      rules,
      participants: [creatorId],
      status: 'upcoming',
      isPublic: true,
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase()
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
    
    return { id: docRef.id, ...challengeData };
  } catch (error) {
    console.error('Error creating challenge:', error);
    throw error;
  }
};

export const joinChallenge = async (challengeId, userId) => {
  try {
    // First verify the challenge exists and user is not already a participant
    const challengeRef = doc(db, 'challenges', challengeId);
    const challengeSnap = await getDoc(challengeRef);
    
    if (!challengeSnap.exists()) {
      throw new Error('Challenge not found');
    }
    
    const challengeData = challengeSnap.data();
    
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
    
    return { success: true, message: 'Successfully joined challenge' };
  } catch (error) {
    console.error('Error joining challenge:', error);
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