import os
import time
import pandas as pd
import psycopg2
from datetime import datetime, timedelta
import logging
import schedule
from csvdownload import download_csv_files
import glob
from sqlalchemy import create_engine
import numpy as np
import hashlib
import json
import subprocess
from typing import Tuple, Dict, List

# Define job categories and their corresponding URLs
JOB_CATEGORIES = {
    "Software Engineering": "https://www.newgrad-jobs.com/",
    "Data Analyst": "https://www.newgrad-jobs.com/?k=da",
    "Business Analyst": "https://www.newgrad-jobs.com/?k=ba",
    "Machine Learning and AI": "https://www.newgrad-jobs.com/?k=aiml",
    "Cybersecurity": "https://www.newgrad-jobs.com/?k=cs",
    "Data Engineer": "https://www.newgrad-jobs.com/?k=de"
}

# Configure logging
logging.basicConfig(
    filename='job_listing_processor.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Database configuration
DB_NAME = "joblistingsportal"
DB_USER = os.getenv("DB_USER", "saipraneethkonuri")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

# Directory configuration
DOWNLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "joblistings")

def get_database_connection():
    """Create and return a database connection"""
    try:
        # Try multiple times to connect to the database
        max_retries = 3
        retry_count = 0
        last_error = None
        
        while retry_count < max_retries:
            try:
                conn = psycopg2.connect(
                    dbname=DB_NAME,
                    user=DB_USER,
                    password=DB_PASSWORD,
                    host=DB_HOST,
                    port=DB_PORT
                )
                logging.info("Successfully connected to the database")
                return conn
            except Exception as e:
                last_error = e
                retry_count += 1
                logging.warning(f"Database connection attempt {retry_count} failed: {str(e)}")
                time.sleep(2)  # Wait before retrying
        
        # If we get here, all retries failed
        logging.error(f"Database connection error after {max_retries} attempts: {str(last_error)}")
        raise last_error
    except Exception as e:
        logging.error(f"Database connection error: {str(e)}")
        raise

def get_latest_csv():
    """Get the most recently downloaded CSV file"""
    try:
        list_of_files = glob.glob(os.path.join(DOWNLOAD_DIR, '*.csv'))
        if not list_of_files:
            return None
        latest_file = max(list_of_files, key=os.path.getctime)
        return latest_file
    except Exception as e:
        logging.error(f"Error finding latest CSV: {str(e)}")
        return None

def calculate_content_hash(row: pd.Series) -> str:
    """Calculate a hash of the job listing content to detect changes"""
    # Create a dictionary of relevant fields for change detection
    content_dict = {
        'position_title': str(row.get('position_title', '')),
        'company': str(row.get('company', '')),
        'location': str(row.get('location', '')),
        'salary': str(row.get('salary', '')),
        'qualifications': str(row.get('qualifications', '')),
        'work_model': str(row.get('work_model', '')),
        'company_size': str(row.get('company_size', '')),
        'company_industry': str(row.get('company_industry', '')),
        'h1b_sponsored': str(row.get('h1b_sponsored', '')),
        'is_new_grad': str(row.get('is_new_grad', ''))
    }
    
    # Create a consistent string representation and hash it
    content_str = json.dumps(content_dict, sort_keys=True)
    return hashlib.sha256(content_str.encode()).hexdigest()

def mark_inactive_listings(conn, current_listings: List[Tuple[str, str, str]]) -> int:
    """Keep all listings active regardless of whether they're in the current dataset"""
    # This function has been modified to no longer mark listings as inactive
    # It now returns 0 to indicate no listings were changed
    logging.info("Skipping marking listings as inactive - all listings will remain active")
    return 0

def process_all_job_categories(csv_files=None, specific_category=None):
    """Process job listings from specified CSV files or for a specific category"""
    success = True
    
    if csv_files and specific_category:
        # Process specific CSV files for a given category
        for csv_file in csv_files:
            if os.path.exists(csv_file):
                try:
                    logging.info(f"Processing {specific_category} jobs from {csv_file}")
                    if process_csv_file(csv_file, specific_category):
                        logging.info(f"Successfully processed {specific_category} jobs from {csv_file}")
                    else:
                        logging.error(f"Failed to process {specific_category} jobs from {csv_file}")
                        success = False
                except Exception as e:
                    logging.error(f"Error processing {specific_category} jobs from {csv_file}: {str(e)}")
                    success = False
            else:
                logging.error(f"CSV file not found: {csv_file}")
                success = False
    else:
        # Process all categories (download handled in job_scheduler.py)
        logging.info("No specific CSV files or category provided. Skip processing.")
        return False
    
    return success

def record_processing_history(conn, filename, stats):
    """Record the CSV processing history in the database"""
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO csv_processing_history 
                (filename, processed_count, inserted_count, updated_count)
                VALUES (%s, %s, %s, %s)
            """, (
                filename,
                stats['processed'],
                stats['inserted'],
                stats['updated']
            ))
        logging.info(f"Recorded processing history for {filename}")
    except Exception as e:
        logging.error(f"Error recording processing history: {str(e)}")
        # Don't rollback here as we'll handle transaction management in the calling function
        raise

def process_csv_file(csv_file_path: str, job_category: str = "Software Engineering") -> bool:
    """Process the CSV file and update the database with changes"""
    conn = None
    try:
        # Verify the file exists
        if not os.path.exists(csv_file_path):
            logging.error(f"CSV file not found: {csv_file_path}")
            return False
            
        # Log the job category being processed
        logging.info(f"Processing CSV file {os.path.basename(csv_file_path)} with job_category={job_category}")
        
        # Verify job category is valid
        if job_category not in JOB_CATEGORIES:
            logging.error(f"Invalid job category: {job_category}. Must be one of: {', '.join(JOB_CATEGORIES.keys())}")
            return False
            
        # Read CSV file
        try:
            df = pd.read_csv(csv_file_path)
        except Exception as e:
            logging.error(f"Error reading CSV file {csv_file_path}: {str(e)}")
            return False
        
        # Log basic info about the dataframe
        logging.info(f"CSV contains {len(df)} rows with columns: {', '.join(df.columns)}")
        
        # Verify required columns exist
        required_columns = ['Position Title', 'Date', 'Company']
        for col in required_columns:
            if col not in df.columns:
                logging.error(f"CSV is missing required column: {col}")
                return False
        
        # Clean and prepare the data
        column_mapping = {
            'Position Title': 'position_title',
            'Date': 'date',
            'Apply': 'apply',
            'Work Model': 'work_model',
            'Location': 'location',
            'Company': 'company',
            'Company Size': 'company_size',
            'Company Industry': 'company_industry',
            'Salary': 'salary',
            'Qualifications': 'qualifications',
            'H1b Sponsored': 'h1b_sponsored',
            'Is New Grad': 'is_new_grad',
            'Category': 'csv_category'  # Map the Category column if present
        }
        df = df.rename(columns=column_mapping)
        
        # Convert date format and add one day to fix timezone display issue
        try:
            df['posting_date'] = pd.to_datetime(df['date'])
        except Exception as e:
            logging.error(f"Error converting date column: {str(e)}")
            # Try to repair the date column
            try:
                logging.info("Attempting to repair date column")
                df['date'] = df['date'].astype(str)
                df['posting_date'] = pd.to_datetime(df['date'], errors='coerce')
                # Remove rows with invalid dates
                invalid_dates = df['posting_date'].isna().sum()
                if invalid_dates > 0:
                    logging.warning(f"Removing {invalid_dates} rows with invalid dates")
                    df = df.dropna(subset=['posting_date'])
            except Exception as repair_error:
                logging.error(f"Failed to repair date column: {str(repair_error)}")
                return False
        
        # Convert boolean columns - update logic as per requirements with case sensitivity
        # For h1b_sponsored: "yes" -> True, "not sure"/"no" -> False (case sensitive)
        df['h1b_sponsored'] = df['h1b_sponsored'].apply(lambda x: True if str(x).lower() == 'yes' else False)
        
        # For is_new_grad: "yes" -> True, Empty/Other -> False (case sensitive)
        df['is_new_grad'] = df['is_new_grad'].apply(lambda x: True if str(x).lower() == 'yes' else False)
        
        # Add job category to each row - prioritize the CSV Category column if it exists
        if 'csv_category' in df.columns:
            logging.info(f"Using Category column from CSV file")
            # Check if all categories in the CSV are the same
            unique_categories = df['csv_category'].dropna().unique()
            
            if len(unique_categories) == 1 and unique_categories[0] in JOB_CATEGORIES:
                csv_category = unique_categories[0]
                logging.info(f"CSV contains a single category: {csv_category}")
                
                # Use CSV category if it matches the expected one, otherwise log a warning
                if csv_category != job_category:
                    logging.warning(f"CSV category ({csv_category}) differs from specified category ({job_category})")
                    logging.info(f"Using CSV category: {csv_category} for consistency")
                    job_category = csv_category
            elif len(unique_categories) > 1:
                logging.warning(f"CSV contains multiple categories: {unique_categories}")
                logging.info(f"Enforcing specified category: {job_category}")
            else:
                logging.warning(f"CSV category not recognized, using specified category: {job_category}")
        
        logging.info(f"Setting job_category={job_category} for all {len(df)} rows")
        df['job_category'] = job_category
        
        # Verify job category was set correctly
        category_counts = df['job_category'].value_counts()
        logging.info(f"Job category distribution after assignment: {category_counts.to_dict()}")
        
        # Calculate content hash for each row
        df['content_hash'] = df.apply(calculate_content_hash, axis=1)
        
        # Replace NaN values with None
        df = df.replace({np.nan: None})
        
        # Begin transaction
        conn = get_database_connection()
        
        # Keep track of statistics
        stats = {
            'processed': len(df),
            'updated': 0,
            'inserted': 0,
            'errors': 0
        }
        
        # Create a list of current listings for inactive marking
        current_listings = list(zip(
            df['position_title'].fillna(''),
            df['company'].fillna(''),
            df['posting_date']
        ))
        
        # Check if csv_processing_history table exists
        with conn.cursor() as cur:
            try:
                cur.execute("""
                    SELECT EXISTS (
                       SELECT FROM information_schema.tables 
                       WHERE table_schema = 'public'
                       AND table_name = 'csv_processing_history'
                    )
                """)
                table_exists = cur.fetchone()[0]
                
                if not table_exists:
                    logging.info("Creating csv_processing_history table")
                    cur.execute("""
                        CREATE TABLE csv_processing_history (
                            id SERIAL PRIMARY KEY,
                            filename VARCHAR(255) NOT NULL,
                            processed_count INTEGER,
                            inserted_count INTEGER,
                            updated_count INTEGER,
                            processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    """)
                    conn.commit()
            except Exception as e:
                logging.error(f"Error checking/creating csv_processing_history table: {str(e)}")
                conn.rollback()
        
        # Mark old listings as inactive
        inactive_count = mark_inactive_listings(conn, current_listings)
        logging.info(f"Marked {inactive_count} listings as inactive")
        
        # Process each row
        for idx, row in df.iterrows():
            row_conn = None

            # Skip rows with missing required fields
            if pd.isna(row['position_title']) or pd.isna(row['company']) or pd.isna(row['posting_date']):
                logging.warning(f"Skipping row {idx+1} with missing required fields: {row['position_title']} at {row['company']}")
                stats['errors'] += 1
                continue
            
            try:
                # Using a separate connection for each row to ensure atomic transactions
                row_conn = get_database_connection()
                with row_conn.cursor() as cur:
                    # Double-check the job_category is correctly set to the intended category
                    if row['job_category'] != job_category:
                        logging.warning(f"Job category mismatch: found {row['job_category']} but expected {job_category} for {row['position_title']} at {row['company']}")
                        # Fix it
                        row['job_category'] = job_category
                        
                    # Ensure values are properly typed
                    safe_values = {
                        'position_title': str(row['position_title']) if not pd.isna(row['position_title']) else None,
                        'posting_date': row['posting_date'] if not pd.isna(row['posting_date']) else None,
                        'apply': str(row['apply']) if not pd.isna(row['apply']) else None,
                        'work_model': str(row['work_model']) if not pd.isna(row['work_model']) else None,
                        'location': str(row['location']) if not pd.isna(row['location']) else None,
                        'company': str(row['company']) if not pd.isna(row['company']) else None,
                        'company_size': str(row['company_size']) if not pd.isna(row['company_size']) else None,
                        'company_industry': str(row['company_industry']) if not pd.isna(row['company_industry']) else None,
                        'salary': str(row['salary']) if not pd.isna(row['salary']) else None,
                        'qualifications': str(row['qualifications']) if not pd.isna(row['qualifications']) else None,
                        'h1b_sponsored': bool(row['h1b_sponsored']),
                        'is_new_grad': bool(row['is_new_grad']),
                        'job_category': str(row['job_category']),
                        'content_hash': str(row['content_hash'])
                    }
                        
                    # Check for existing listing with the same apply link before inserting
                    cur.execute("""
                        SELECT id FROM job_listings 
                        WHERE apply_link = %s
                    """, (safe_values['apply'],))
                    
                    existing_apply_link = cur.fetchone()
                    
                    if existing_apply_link:
                        # Apply link already exists, update instead of insert
                        existing_id = existing_apply_link[0]
                        cur.execute("""
                            UPDATE job_listings
                            SET last_seen_at = CURRENT_TIMESTAMP, 
                                is_active = TRUE,
                                job_category = %s,
                                position_title = %s,
                                company = %s,
                                location = %s,
                                work_model = %s,
                                content_hash = %s
                            WHERE id = %s
                            RETURNING id
                        """, (
                            safe_values['job_category'], 
                            safe_values['position_title'],
                            safe_values['company'],
                            safe_values['location'],
                            safe_values['work_model'],
                            safe_values['content_hash'],
                            existing_id
                        ))
                        
                        # Commit each row's update immediately
                        row_conn.commit()
                        stats['updated'] += 1
                        logging.info(f"Updated existing job with same apply link: {safe_values['position_title']} at {safe_values['company']} (ID: {existing_id})")
                    else:
                        # No existing apply link found, proceed with insert
                        try:
                            cur.execute("""
                                INSERT INTO job_listings (
                                    position_title, posting_date, apply_link,
                                    work_model, location, company, company_size,
                                    company_industry, salary, qualifications,
                                    h1b_sponsored, is_new_grad, job_category,
                                    content_hash, created_at, updated_at, last_seen_at, is_active
                                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                                          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, TRUE)
                                RETURNING id
                            """, (
                                safe_values['position_title'], safe_values['posting_date'], safe_values['apply'],
                                safe_values['work_model'], safe_values['location'], safe_values['company'],
                                safe_values['company_size'], safe_values['company_industry'], safe_values['salary'],
                                safe_values['qualifications'], safe_values['h1b_sponsored'],
                                safe_values['is_new_grad'], safe_values['job_category'], safe_values['content_hash']
                            ))
                            
                            # Get the inserted ID
                            inserted_id = cur.fetchone()[0]
                            
                            # Commit each row's insert immediately
                            row_conn.commit()
                            stats['inserted'] += 1
                            logging.info(f"Inserted job: {safe_values['position_title']} at {safe_values['company']} with category {safe_values['job_category']} (ID: {inserted_id})")
                            
                            # Verify the job was inserted with the correct category
                            cur.execute("""
                                SELECT job_category FROM job_listings
                                WHERE id = %s
                            """, (inserted_id,))
                            result = cur.fetchone()
                            if result and result[0] != safe_values['job_category']:
                                logging.error(f"Category mismatch after insert: DB has {result[0]} but expected {safe_values['job_category']} for {safe_values['position_title']}")
                                # Attempt to fix the category
                                cur.execute("""
                                    UPDATE job_listings
                                    SET job_category = %s
                                    WHERE id = %s
                                """, (safe_values['job_category'], inserted_id))
                                row_conn.commit()
                                logging.info(f"Fixed category for job ID {inserted_id}")
                        except psycopg2.errors.UniqueViolation:
                            # If there was a duplicate, update the last_seen_at field and ensure correct category
                            row_conn.rollback()  # Rollback the failed INSERT
                            cur.execute("""
                                UPDATE job_listings
                                SET last_seen_at = CURRENT_TIMESTAMP, 
                                    is_active = TRUE,
                                    job_category = %s
                                WHERE position_title = %s 
                                AND company = %s 
                                AND posting_date = %s
                                RETURNING id
                            """, (safe_values['job_category'], safe_values['position_title'], safe_values['company'], safe_values['posting_date']))
                            
                            result = cur.fetchone()
                            updated_id = result[0] if result else None
                            
                            # Commit each row's update immediately
                            row_conn.commit()
                            stats['updated'] += 1
                            logging.info(f"Updated job: {safe_values['position_title']} at {safe_values['company']} with category {safe_values['job_category']} (ID: {updated_id})")
            except Exception as e:
                stats['errors'] += 1
                logging.error(f"Error processing row {idx+1} ({row.get('position_title', 'Unknown')} at {row.get('company', 'Unknown')}): {str(e)}")
                if row_conn:
                    row_conn.rollback()  # Only roll back this row's transaction
            finally:
                if row_conn:
                    row_conn.close()
        
        # Record the CSV processing history
        record_processing_history(conn, os.path.basename(csv_file_path), stats)
        conn.commit()  # Final commit for the processing history
        
        logging.info(f"Processed {stats['processed']} listings: {stats['inserted']} inserted, {stats['updated']} updated, {stats['errors']} errors for category {job_category}")
        
        # Return success only if at least some rows were processed successfully
        return stats['inserted'] + stats['updated'] > 0
    
    except Exception as e:
        logging.error(f"Error processing CSV file: {str(e)}")
        import traceback
        logging.error(traceback.format_exc())
        if conn:
            conn.rollback()
        return False
    
    finally:
        if conn:
            conn.close()

def verify_data_integrity():
    """Verify data integrity and log any issues"""
    try:
        with get_database_connection() as conn:
            with conn.cursor() as cur:
                # Check for duplicate listings
                cur.execute("""
                    SELECT position_title, company, posting_date, COUNT(*)
                    FROM job_listings
                    GROUP BY position_title, company, posting_date
                    HAVING COUNT(*) > 1
                """)
                duplicates = cur.fetchall()
                if duplicates:
                    logging.warning(f"Found {len(duplicates)} duplicate listings")
                
                # Check for listings with missing required fields
                cur.execute("""
                    SELECT id, position_title
                    FROM job_listings
                    WHERE position_title IS NULL
                    OR company IS NULL
                    OR posting_date IS NULL
                """)
                invalid = cur.fetchall()
                if invalid:
                    logging.warning(f"Found {len(invalid)} listings with missing required fields")
                
                # Check for stale listings
                cur.execute("""
                    SELECT COUNT(*)
                    FROM job_listings
                    WHERE is_active = TRUE
                    AND last_seen_at < CURRENT_TIMESTAMP - INTERVAL '48 hours'
                """)
                stale_count = cur.fetchone()[0]
                if stale_count > 0:
                    logging.warning(f"Found {stale_count} potentially stale active listings")
                
                return not (duplicates or invalid or stale_count > 0)
    
    except Exception as e:
        logging.error(f"Error verifying data integrity: {str(e)}")
        return False

def job_collection_task():
    """Main task to be run hourly"""
    logging.info("Starting job collection task")
    try:
        # Download CSV files for all categories
        logging.info("Downloading CSV files for all job categories")
        results = download_csv_files()
        
        # Process each successfully downloaded category
        successful_downloads = {}
        for category, result in results.items():
            if result['success']:
                successful_downloads[category] = result['path']
                logging.info(f"Successfully downloaded CSV for {category}")
            else:
                logging.error(f"Failed to download CSV for {category}")
        
        if not successful_downloads:
            logging.error("No categories were successfully downloaded")
            return
        
        # Process all the downloaded files
        for category, csv_path in successful_downloads.items():
            logging.info(f"Processing {category} from {csv_path}")
            success = process_csv_file(csv_path, category)
            if success:
                logging.info(f"Successfully processed {category} jobs")
            else:
                logging.error(f"Failed to process {category} jobs")
        
        # Verify data integrity
        if verify_data_integrity():
            logging.info("Job collection task completed successfully with verified integrity")
        else:
            logging.warning("Job collection completed but data integrity issues were found")
            
        # After processing all job listings, start the apply links fetcher
        # Commented out to run the apply links fetcher manually in a separate terminal
        """
        try:
            script_dir = os.path.dirname(os.path.abspath(__file__))
            root_dir = os.path.dirname(script_dir)
            fetch_script_path = os.path.join(root_dir, "fetch_actual_links.sh")
            
            logging.info("Starting the actual apply links fetcher in the background")
            subprocess.Popen(
                [fetch_script_path], 
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                shell=True,
                cwd=root_dir
            )
            logging.info("Actual apply links fetcher started successfully")
        except Exception as e:
            logging.error(f"Failed to start actual apply links fetcher: {str(e)}")
        """
    
    except Exception as e:
        logging.error(f"Error in job collection task: {str(e)}")
        import traceback
        logging.error(traceback.format_exc())

def main():
    """Main function to schedule and run the job collection task"""
    logging.info("Starting job listing collection service")
    
    # Schedule the task to run every hour
    schedule.every().hour.do(job_collection_task)
    
    # Run the task immediately on startup
    job_collection_task()
    
    # Keep the script running
    while True:
        schedule.run_pending()
        time.sleep(60)  # Wait for 60 seconds before checking schedule again

if __name__ == "__main__":
    main() 