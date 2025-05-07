# Job Portal - Scripts Guide

This document explains how to use the executable scripts that have been created to simplify the setup and running of the Job Portal application.

## Available Scripts

### 1. Job Scheduler Script

The `run_job_scheduler.sh` script handles the following tasks automatically:
- Checks for Python 3.11 installation
- Creates a Python 3.11 virtual environment if it doesn't exist
- Activates the virtual environment
- Installs all required packages including webdriver_manager
- Runs the job_scheduler.py script
- Deactivates the virtual environment when done

To run the job scheduler:

```bash
./run_job_scheduler.sh
```

### 2. Web Application Script

The `run_webapp.sh` script handles the following tasks automatically:
- Checks for Node.js installation
- Installs npm dependencies
- Kills any existing processes on ports 3000-3009
- Starts the Next.js development server

To run the web application:

```bash
./run_webapp.sh
```

The web application will be available at http://localhost:3000

## Important Notes

1. **Separate Environments**: The job scheduler runs in a Python environment, while the web application runs using Node.js. These are separate systems that communicate through the shared PostgreSQL database.

2. **Database Connection**: Both systems require a connection to the PostgreSQL database. Make sure the database is running and accessible, and that the connection details are correctly configured in the `.env` file.

3. **Virtual Environment**: The Python virtual environment (py311env) is created in the project root directory. If you want to activate it manually, you can use:

```bash
source py311env/bin/activate
```

4. **Error Handling**: The scripts include error checking and will display colorized output to help diagnose any issues that might occur during execution.

## Troubleshooting

If you encounter any issues:

1. **Python Version**: Make sure Python 3.11 is installed on your system. The job scheduler is specifically designed to work with Python 3.11.

2. **Node.js Version**: Ensure you have a recent version of Node.js installed for running the web application.

3. **PostgreSQL**: Verify that PostgreSQL is running and the connection details in `.env` are correct.

4. **Port Conflicts**: If you're having trouble with port conflicts, the run_webapp.sh script attempts to kill processes on ports 3000-3009, but you may need to manually check and kill processes if issues persist. 