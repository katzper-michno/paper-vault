#!/bin/bash

# Exit on error
set -e

# Ensure directories exist
if [ ! -d "pv_back" ] || [ ! -d "pv_front" ]; then
  echo "Error: pv_back or pv_front directory not found."
  exit 1
fi

echo "Starting backend..."

(
  cd pv_back
  npm install
  tsc
  node dist/server.js
) &

BACK_PID=$!

echo "Starting frontend..."

(
  cd pv_front 
  npm install
  npm run dev
) &

FRONT_PID=$!

# Handle Ctrl+C
trap "echo 'Stopping apps...'; kill $BACK_PID $FRONT_PID; exit" INT

# Wait for processes
wait
