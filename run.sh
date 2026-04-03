#!/bin/bash

# Exit on error
set -e

# Ensure directories exist
if [ ! -d "bib-back" ] || [ ! -d "bib-front" ]; then
  echo "Error: bib-back or bib-front directory not found."
  exit 1
fi

echo "Starting backend..."

(
  cd bib-back
  npm install
  tsc
  node dist/server.js
) &

BACK_PID=$!

echo "Starting frontend..."

(
  cd papervault
  npm install
  npm run dev
) &

FRONT_PID=$!

# Handle Ctrl+C
trap "echo 'Stopping apps...'; kill $BACK_PID $FRONT_PID; exit" INT

# Wait for processes
wait
