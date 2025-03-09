#!/bin/bash

# Deployment script for My Fasting Friends

# Make script exit on any error
set -e

echo "===== Starting deployment process ====="

# Change to project directory
cd ~/Documents/Code/MyFastingFriends/my-fasting-friends

# Ensure we're logged in to Firebase
echo "Checking Firebase login status..."
npx firebase login:list || npx firebase login

# Clean previous build
echo "Cleaning previous build..."
rm -rf build

# Build the React app
echo "Building the React app for production..."
npm run build

# Double check important files
echo "Verifying build files..."
if [ ! -f "build/index.html" ]; then
  echo "Error: build/index.html not found. Build process failed."
  exit 1
fi

# Check if main js file exists using wildcard pattern match
if ! ls build/static/js/main*.js >/dev/null 2>&1; then
  echo "Error: Main JavaScript file not found. Build process failed."
  exit 1
fi

# Ensure the homepage path is correct in the build
echo "Checking for correct path references in the build..."
grep -q "href=\"/" build/index.html && echo "Warning: Found absolute paths in index.html. This might cause issues."

# Make sure Firebase knows which project to use
echo "Ensuring Firebase project is set..."
npx firebase use my-fasting-friends-app

# Deploy to Firebase
echo "Deploying to Firebase..."
npx firebase deploy

echo "===== Deployment complete! ====="
echo "Your app should now be live at: https://my-fasting-friends-app.web.app"