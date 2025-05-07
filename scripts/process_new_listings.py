import os
import logging
import sys
import traceback
import pandas as pd
from csvdownload import download_csv
from job_listing_processor import process_csv_file, get_latest_csv, get_database_connection

# Configure logging to both file and console
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scripts/job_processing.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

def process_new_listings():
    """
    Main function to handle the download and processing of new job listings.
    This function will:
    1. Download the latest CSV file
    2. Process the CSV file and update the database
    3. Log the results
    """
    try:
        print("Starting job listings update process")
        
        # Test database connection first
        try:
            print("Testing database connection...")
            conn = get_database_connection()
            print("Database connection successful!")
            conn.close()
        except Exception as e:
            print(f"Database connection failed: {str(e)}")
            print(f"Traceback:\n{traceback.format_exc()}")
            return False
        
        # Step 1: Download the CSV file
        print("Downloading new CSV file...")
        download_success = download_csv()
        
        if not download_success:
            print("Failed to download CSV file")
            return False
            
        # Step 2: Get the path to the latest CSV file
        latest_csv = get_latest_csv()
        if not latest_csv:
            print("No CSV file found after download")
            return False
            
        # Step 3: Process the CSV file and update the database
        print(f"Processing CSV file: {latest_csv}")
        try:
            # First, let's check if we can read the CSV
            try:
                df = pd.read_csv(latest_csv)
                print(f"Successfully read CSV file with {len(df)} rows")
                print("CSV columns:", df.columns.tolist())
            except Exception as e:
                print(f"Error reading CSV file: {str(e)}")
                print(f"Traceback:\n{traceback.format_exc()}")
                return False
            
            process_success = process_csv_file(latest_csv)
            
            if process_success:
                print("Successfully processed job listings and updated database")
                return True
            else:
                print("Failed to process job listings")
                return False
        except Exception as e:
            print(f"Error processing CSV file: {str(e)}")
            print(f"Traceback:\n{traceback.format_exc()}")
            return False
            
    except Exception as e:
        print(f"Error in process_new_listings: {str(e)}")
        print(f"Traceback:\n{traceback.format_exc()}")
        return False

if __name__ == "__main__":
    success = process_new_listings()
    print(f"Job listings update {'completed successfully' if success else 'failed'}") 