#!/bin/bash
# Startup script for job portal application

# Set script to exit on error
set -e

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo "Starting job portal application..."

# Function to clean up background processes
cleanup() {
  echo "Shutting down..."
  if [ ! -z "$SCHEDULER_PID" ]; then
    echo "Stopping job scheduler (PID: $SCHEDULER_PID)"
    kill $SCHEDULER_PID 2>/dev/null || true
  fi
  exit 0
}

# Set up trap to catch termination signals
trap cleanup SIGINT SIGTERM

# Activate the virtual environment
echo "Activating virtual environment..."
source "$SCRIPT_DIR/venv/bin/activate"

# Start the job scheduler
echo "Starting job scheduler..."
python "$SCRIPT_DIR/job_scheduler.py" &
SCHEDULER_PID=$!
echo "Job scheduler started with PID: $SCHEDULER_PID"

# Wait for the job scheduler to start and process data (5 seconds)
echo "Waiting for job scheduler to process initial data..."
sleep 5

# Start the Next.js frontend
echo "Starting Next.js frontend..."
cd "$SCRIPT_DIR"
npm run dev

# If we get here, the frontend was stopped
cleanup
