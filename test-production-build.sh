#!/bin/bash

# Test the production build locally before deployment

# Make script exit on any error
set -e

echo "===== Testing production build locally ====="

# Change to project directory
cd ~/Documents/Code/MyFastingFriends/my-fasting-friends

# Clean previous build
echo "Cleaning previous build..."
rm -rf build

# Build the React app
echo "Building the React app for production..."
npm run build

# Install serve if it's not already installed
echo "Installing serve to test the production build..."
npm install -g serve || sudo npm install -g serve

# Serve the production build locally
echo "Starting local server for production build..."
echo "Your app will be available at http://localhost:5000"
echo "Press Ctrl+C to stop the server when done testing"
serve -s build