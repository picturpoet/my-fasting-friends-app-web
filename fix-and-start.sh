#!/bin/bash

# Fix permissions script for My Fasting Friends

# Change to the project directory
cd ~/Documents/Code/MyFastingFriends/my-fasting-friends

# Fix ownership of all files to the current user
echo "Fixing file ownership..."
sudo chown -R $(whoami) .

# Fix npm cache permissions
echo "Fixing npm cache permissions..."
sudo chown -R $(whoami) ~/.npm

# Clean node_modules and reinstall
echo "Cleaning node_modules..."
rm -rf node_modules
rm -f package-lock.json

# Install dependencies
echo "Reinstalling dependencies..."
npm install

# Start the development server
echo "Starting development server..."
npm start