#!/bin/bash

# Script to set up Python 3.11 environment and run job_scheduler.py

# Set colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========== Job Scheduler Setup ==========${NC}"

# Check if Python 3.11 is available
if ! command -v python3.11 &> /dev/null; then
    echo -e "${RED}Error: Python 3.11 is not installed. Please install it and try again.${NC}"
    exit 1
fi

# Define environment name
PY_ENV_NAME="py311env"

# Check if virtual environment exists, create if not
if [ ! -d "$PY_ENV_NAME" ]; then
    echo -e "${BLUE}Creating Python 3.11 virtual environment...${NC}"
    python3.11 -m venv $PY_ENV_NAME
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to create virtual environment. Exiting.${NC}"
        exit 1
    fi
    echo -e "${GREEN}Virtual environment created successfully.${NC}"
else
    echo -e "${GREEN}Virtual environment already exists.${NC}"
fi

# Activate virtual environment
echo -e "${BLUE}Activating virtual environment...${NC}"
source $PY_ENV_NAME/bin/activate

# Install requirements
echo -e "${BLUE}Installing required packages...${NC}"
pip install -r requirements.txt webdriver_manager
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install packages. Exiting.${NC}"
    exit 1
fi
echo -e "${GREEN}Packages installed successfully.${NC}"

# Run the job scheduler
echo -e "${BLUE}Running job scheduler...${NC}"
cd scripts
python job_scheduler.py

# Deactivate virtual environment when done
deactivate

echo -e "${GREEN}Job scheduler process completed.${NC}" 