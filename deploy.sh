#!/bin/bash

# Update the version
node updateVersion.js

# Build the app
npm run build

# Deploy only hosting and firestore
firebase deploy --only hosting,firestore