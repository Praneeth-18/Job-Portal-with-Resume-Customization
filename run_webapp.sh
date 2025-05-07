#!/bin/bash

# Script to set up and run the Next.js web application

# Set colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========== Job Portal Web App Setup ==========${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed. Please install it and try again.${NC}"
    exit 1
fi

echo -e "${BLUE}Installing npm dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install npm dependencies. Exiting.${NC}"
    exit 1
fi
echo -e "${GREEN}Dependencies installed successfully.${NC}"

# Kill any existing processes on ports 3000-3009
echo -e "${BLUE}Killing any existing processes on ports 3000-3009...${NC}"
for port in {3000..3009}; do
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
done
echo -e "${GREEN}Ports cleared.${NC}"

# Run the Next.js development server
echo -e "${BLUE}Starting the Next.js development server...${NC}"
echo -e "${GREEN}The application will be available at http://localhost:3000${NC}"
npm run dev 