import logging
import time
import signal
import sys
import os
from apscheduler.schedulers.background import BackgroundScheduler
from job_listing_processor import process_all_job_categories, verify_data_integrity
from csvdownload import download_csv_files
import csvdownload

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("job_scheduler.log"),
        logging.StreamHandler()
    ]
)

# Global flag to indicate shutdown
shutdown_requested = False

def signal_handler(sig, frame):
    """Handle SIGINT and SIGTERM signals for graceful shutdown"""
    global shutdown_requested
    logging.info("Shutdown signal received, gracefully stopping...")
    shutdown_requested = True

# Register signal handlers
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def job_processing_task():
    """Main task to be executed by the scheduler"""
    if shutdown_requested:
        return
    
    try:
        logging.info("Starting job processing task")
        
        # Process one category at a time - download and then immediately process
        for category, url in csvdownload.JOB_CATEGORIES.items():
            logging.info(f"Starting download and processing for category: {category}")
            
            # Download this category
            try:
                # Create a timestamped filename
                import time
                timestamp = time.strftime("%Y%m%d_%H%M%S")
                category_slug = category.lower().replace(' ', '_').replace('&', 'and')
                filename = f"{category_slug}_jobs_{timestamp}.csv"
                
                # Setup the path
                import os
                base_dir = os.path.join(os.getcwd(), 'data')
                os.makedirs(base_dir, exist_ok=True)
                output_path = os.path.join(base_dir, filename)
                
                # Import the download function
                from csvdownload import download_csv
                
                # Try to download the CSV
                logging.info(f"Downloading {category} to {output_path}")
                success = download_csv(csvdownload.JOB_CATEGORIES[category], output_path)
                
                if success and os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                    logging.info(f"Successfully downloaded {category} CSV to {output_path}")
                    file_size = os.path.getsize(output_path)
                    logging.info(f"CSV file for {category} exists with size {file_size} bytes")
                    
                    # Now immediately process this category with the correct category label
                    logging.info(f"Processing {category} jobs from {output_path}")
                    processing_success = process_all_job_categories([output_path], category)
                    
                    if processing_success:
                        logging.info(f"Successfully processed {category} jobs")
                    else:
                        logging.error(f"Failed to process {category} jobs")
                else:
                    logging.error(f"Failed to download {category} CSV or file is empty")
                
                # Add a delay between categories to avoid rate limiting
                logging.info(f"Waiting 5 seconds before downloading the next category...")
                time.sleep(5)
                
            except Exception as e:
                logging.error(f"Error processing category {category}: {str(e)}")
                import traceback
                logging.error(traceback.format_exc())
        
        # Verify data integrity
        integrity_check = verify_data_integrity()
        if integrity_check:
            logging.info("Data integrity check passed")
        else:
            logging.warning("Data integrity check failed")
            
        logging.info("Job processing task completed")
        
    except Exception as e:
        logging.error(f"Error in job processing task: {str(e)}")
        logging.error(f"Exception details: {type(e).__name__}")
        import traceback
        logging.error(traceback.format_exc())

def main():
    """Main function to start the scheduler"""
    logging.info("Starting job scheduler")
    
    # Create a scheduler
    scheduler = BackgroundScheduler()
    
    # Schedule the job processing task to run every hour
    scheduler.add_job(job_processing_task, 'interval', hours=1)
    
    # Start the scheduler
    scheduler.start()
    logging.info("Scheduler started, running job every hour")
    
    # Also run the job immediately when starting
    job_processing_task()
    
    # Keep the script running until shutdown is requested
    try:
        while not shutdown_requested:
            time.sleep(1)
    except (KeyboardInterrupt, SystemExit):
        pass
    
    # Shut down the scheduler
    scheduler.shutdown()
    logging.info("Scheduler shut down, exiting")

if __name__ == "__main__":
    main() 