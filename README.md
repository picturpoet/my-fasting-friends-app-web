# My Fasting Friends

A social-first fasting app where users track 7-day challenges, compete via leaderboards, and motivate friends through WhatsApp integration.

## Local Development Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)
- Firebase account with a project set up

### Setup Steps

1. Clone the repository
   ```
   git clone <repository-url>
   cd my-fasting-friends
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up Firebase configuration
   - Ensure your Firebase configuration in `src/firebase.js` is correct
   - Enable Phone Authentication in the Firebase Console:
     - Go to Authentication > Sign-in methods
     - Enable Phone provider
     - Add test phone numbers if testing in development

4. Start the local development server
   ```
   npm start
   ```
   This will run the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## Testing Authentication Locally

When testing authentication locally:

1. **Use real phone numbers in development**:
   - Authentication with phone numbers requires a real phone to receive SMS
   - You can add test phone numbers in Firebase Console for development

2. **Testing with Firebase Local Emulator (Advanced)**:
   - Firebase provides emulators for local testing without affecting production data
   - Install Firebase CLI: `npm install -g firebase-tools`
   - Run emulators: `firebase emulators:start`
   - Configure your app to use emulators (requires code changes)

## Deployment

### Firebase Hosting Deployment

1. Build the production version:
   ```
   npm run build
   ```

2. Deploy to Firebase Hosting:
   ```
   firebase deploy
   ```

### Deployment Checklist

Before deploying to production:

1. Verify Firebase Security Rules are properly configured
2. Ensure environment variables are set correctly
3. Test authentication flow completely
4. Validate database operations

## Project Structure

- `/src`
  - `/components` - React components
  - `/services` - Firebase service functions
  - `App.js` - Main app component
  - `firebase.js` - Firebase configuration

## Database Structure

See `database-design.md` for the complete database structure documentation.

## Roadmap

- [x] Basic authentication with phone numbers
- [x] Fasting tracking functionality
- [x] Firebase integration
- [ ] Friend requests and social connections
- [ ] 7-day challenges
- [ ] Leaderboards  
- [ ] WhatsApp sharing integration

