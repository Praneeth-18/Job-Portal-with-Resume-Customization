#!/bin/bash

# Make sure the script exits on any error
set -e

# Define directory paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${SCRIPT_DIR}/scripts/logs"

# Create log directory if it doesn't exist
mkdir -p "${LOG_DIR}"

# Set environment variables
export DATABASE_URL="postgresql://saipraneethkonuri@localhost:5432/joblistingsportal?schema=public"

# Log file for this run
LOG_FILE="${LOG_DIR}/actual_links_run_$(date +%Y-%m-%d_%H-%M-%S).log"

echo "Starting actual apply links fetcher script..."
echo "Output will be logged to: ${LOG_FILE}"

# Run the Node.js script
node scripts/fetch_actual_links.js 2>&1 | tee -a "${LOG_FILE}"
RESULT=${PIPESTATUS[0]}

if [ $RESULT -ne 0 ]; then
  echo "Error: The actual apply links fetcher script failed with exit code $RESULT"
  echo "Please check the log file for more details: ${LOG_FILE}"
  exit $RESULT
fi

echo "Apply links fetcher completed successfully!"
exit 0 