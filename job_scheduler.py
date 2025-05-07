from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger
import logging
import subprocess
import os
import signal
import sys
from datetime import datetime

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('job_scheduler.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)
process = None

def run_job():
    global process
    try:
        # Kill any existing process
        if process is not None:
            try:
                os.kill(process.pid, signal.SIGTERM)
                logger.info(f"Terminated previous process with PID {process.pid}")
            except OSError:
                pass
        
        logger.info("Starting CSV download and processing job")
        
        # Run the job listing processor script from scripts directory
        script_path = os.path.join(os.path.dirname(__file__), 'scripts', 'job_listing_processor.py')
        venv_python = os.path.join(os.path.dirname(__file__), 'job_processor_env', 'bin', 'python3')
        
        # Check if files exist
        if not os.path.exists(script_path):
            logger.error(f"Script not found at: {script_path}")
            return
        
        if not os.path.exists(venv_python):
            logger.warning(f"Virtual environment Python not found at: {venv_python}")
            # Fallback to system python
            venv_python = 'python3'
            logger.info(f"Falling back to system Python: {venv_python}")
        
        # Set up environment variables for Chrome WebDriver
        env = os.environ.copy()
        
        # Add PATH to include chromedriver location if needed
        # env["PATH"] = f"{os.path.join(os.path.dirname(__file__), 'drivers')}:{env.get('PATH', '')}"
        
        # Start the process using the virtual environment Python
        logger.info(f"Executing: {venv_python} {script_path}")
        process = subprocess.Popen([venv_python, script_path], 
                                  stdout=subprocess.PIPE, 
                                  stderr=subprocess.PIPE,
                                  text=True,
                                  env=env)
        
        logger.info(f"Started job_listing_processor.py with PID {process.pid}")
        
        # Monitor initial output
        stdout_data, stderr_data = process.communicate(timeout=1)
        if stdout_data:
            logger.info(f"Initial output: {stdout_data[:500]}...")
        if stderr_data:
            logger.warning(f"Initial error output: {stderr_data[:500]}...")
            
    except subprocess.TimeoutExpired:
        # This is expected as we only waited for 1 second
        logger.info("Process is running in the background")
    except Exception as e:
        logger.error(f"An error occurred while running the job: {str(e)}")
        if isinstance(e, subprocess.SubprocessError):
            logger.error(f"Subprocess details: {e.args}")

def cleanup(signum, frame):
    global process
    if process is not None:
        try:
            os.kill(process.pid, signal.SIGTERM)
            logger.info(f"Terminated process with PID {process.pid} during shutdown")
        except OSError:
            pass
    logger.info("Scheduler stopped.")
    sys.exit(0)

def main():
    global process
    try:
        # Set up signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, cleanup)
        signal.signal(signal.SIGTERM, cleanup)
        
        scheduler = BlockingScheduler()
        
        # Schedule the job to run every hour
        scheduler.add_job(
            run_job,
            trigger=IntervalTrigger(hours=1),
            next_run_time=datetime.now()  # Run immediately when starting
        )
        
        logger.info("Scheduler started. Press Ctrl+C to exit.")
        scheduler.start()
        
    except (KeyboardInterrupt, SystemExit):
        cleanup(None, None)
    except Exception as e:
        logger.error(f"An error occurred in the scheduler: {str(e)}")
        if process is not None:
            try:
                os.kill(process.pid, signal.SIGTERM)
            except OSError:
                pass

if __name__ == "__main__":
    main() 