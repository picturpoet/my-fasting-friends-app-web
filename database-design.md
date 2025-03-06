# My Fasting Friends - Firebase Database Structure

## Overview
This document outlines the Firestore database structure for the My Fasting Friends application.

## Collections

### users
- Document ID: `{uid}` (Firebase Auth UID)
- Fields:
  - `phoneNumber`: String (user's phone number from authentication)
  - `displayName`: String (optional user display name)
  - `photoURL`: String (optional profile picture URL)
  - `createdAt`: Timestamp
  - `lastActive`: Timestamp
  - `fastingPreferences`: Object
    - `fastingType`: String ('16:8', 'OMAD', '5:2', etc.)
    - `startTime`: String (format: 'HH:MM')
  - `timezone`: String (user's timezone for accurate fasting calculations)
  - `notificationPreferences`: Object
    - `enabled`: Boolean
    - `startReminder`: Boolean
    - `endReminder`: Boolean
    - `encouragementMessages`: Boolean

### fastingRecords
- Document ID: Auto-generated
- Fields:
  - `userId`: String (references users collection)
  - `date`: Timestamp (the day of the fasting record)
  - `startTime`: Timestamp (when fasting started)
  - `targetEndTime`: Timestamp (scheduled end time)
  - `actualEndTime`: Timestamp (when fasting actually ended, null if ongoing)
  - `fastingType`: String ('16:8', 'OMAD', '5:2', etc.)
  - `targetDuration`: Number (in minutes)
  - `actualDuration`: Number (in minutes, calculated when fasting ends)
  - `completionPercentage`: Number (percentage of target achieved)
  - `status`: String ('ongoing', 'completed', 'broken')
  - `notes`: String (optional user notes about their fast)

### challenges
- Document ID: Auto-generated
- Fields:
  - `name`: String (name of the challenge)
  - `description`: String
  - `creatorId`: String (references users collection)
  - `startDate`: Timestamp
  - `endDate`: Timestamp
  - `rules`: Object
    - `fastingType`: String ('16:8', 'OMAD', '5:2', etc.)
    - `minCompletionPercentage`: Number (minimum required completion)
    - `minDaysCompleted`: Number (minimum days to complete in the challenge)
  - `participants`: Array of Strings (user IDs)
  - `status`: String ('upcoming', 'active', 'completed')
  - `isPublic`: Boolean (if false, only invited users can join)
  - `inviteCode`: String (code for private challenges)

### challengeParticipants
- Document ID: Auto-generated
- Fields:
  - `challengeId`: String (references challenges collection)
  - `userId`: String (references users collection)
  - `joinedAt`: Timestamp
  - `dailyScores`: Array
    - `day`: Number (1-7 for a week-long challenge)
    - `completionPercentage`: Number
    - `points`: Number
  - `totalScore`: Number (calculated based on their performance)
  - `rank`: Number (position on the leaderboard)
  - `completedDays`: Number (days successfully completed)

### friendships
- Document ID: Auto-generated
- Fields:
  - `user1Id`: String (references users collection)
  - `user2Id`: String (references users collection)
  - `status`: String ('pending', 'accepted', 'blocked')
  - `createdAt`: Timestamp
  - `updatedAt`: Timestamp
  - `initiatedBy`: String (user ID of the person who sent the request)

### notifications
- Document ID: Auto-generated
- Fields:
  - `userId`: String (references users collection)
  - `type`: String ('challenge_invite', 'friend_request', 'achievement', etc.)
  - `title`: String
  - `message`: String
  - `data`: Object (specific data relevant to the notification)
  - `isRead`: Boolean
  - `createdAt`: Timestamp

### achievements
- Document ID: Auto-generated
- Fields:
  - `userId`: String (references users collection)
  - `type`: String (achievement type)
  - `title`: String
  - `description`: String
  - `awardedAt`: Timestamp
  - `icon`: String (icon path/URL)

## Security Rules

Important security considerations:
1. Users should only be able to read/write their own data
2. Challenge participants should be able to see other participants' data
3. Friends should be able to see basic information about each other

## Indexing

Consider creating indexes for:
1. `fastingRecords` sorted by `userId` and `date` (for user history)
2. `challenges` sorted by `status` and `startDate` (for browsing active challenges)
3. `challengeParticipants` sorted by `challengeId` and `totalScore` (for leaderboards)
4. `friendships` with compound queries on `user1Id`/`user2Id` and `status`