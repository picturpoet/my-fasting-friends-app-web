#!/bin/bash

# Complete Firebase cleanup and redeployment script
# This script will perform a thorough cleanup and fresh deployment

# Make script exit on any error
set -e

echo "===== Starting complete Firebase cleanup and redeployment ====="

# Change to project directory
cd ~/Documents/Code/MyFastingFriends/my-fasting-friends

# 1. Clean existing files
echo "Cleaning existing build artifacts..."
rm -rf build
rm -rf .firebase
rm -rf node_modules
rm -f package-lock.json

# 2. Reinstall dependencies
echo "Reinstalling dependencies..."
npm install

# 3. Create a fresh build
echo "Creating a fresh production build..."
npm run build

# 4. Verify the build has the correct files
echo "Verifying build..."
if [ ! -f "build/index.html" ] || [ ! -d "build/static" ]; then
  echo "Error: Build verification failed. Essential files are missing."
  exit 1
fi

# 5. Update Firebase configuration
echo "Updating Firebase configuration..."

# Create a clean firebase.json file
cat > firebase.json << EOF
{
  "hosting": {
    "public": "build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
EOF

# Ensure .firebaserc is configured
cat > .firebaserc << EOF
{
  "projects": {
    "default": "my-fasting-friends-app"
  }
}
EOF

# 6. Clear Firebase cache and deploy only hosting
echo "Clearing Firebase cache and deploying hosting only..."
npx firebase deploy --only hosting --non-interactive

echo "===== Deployment complete! ====="
echo "Your app should now be available at:"
echo "https://my-fasting-friends-app.web.app"
echo "https://my-fasting-friends-app.firebaseapp.com"