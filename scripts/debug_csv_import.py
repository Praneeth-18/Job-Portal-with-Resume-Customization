import os
import pandas as pd
import psycopg2
import logging
import numpy as np
import hashlib
import json
from datetime import datetime
import sys

# Configure logging to stdout for debugging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
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
        logging.error(f"Database connection error: {str(e)}")
        raise

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

def debug_csv_import():
    """Debug CSV import by reading a CSV file and inserting a few rows into the database"""
    conn = None
    try:
        # Find the latest CSV file
        csv_files = [f for f in os.listdir(DOWNLOAD_DIR) if f.endswith('.csv')]
        if not csv_files:
            logging.error("No CSV files found in the directory")
            return
        
        # Sort by modification time to get the latest
        latest_csv = max(csv_files, key=lambda x: os.path.getmtime(os.path.join(DOWNLOAD_DIR, x)))
        csv_file_path = os.path.join(DOWNLOAD_DIR, latest_csv)
        logging.info(f"Using CSV file: {csv_file_path}")
        
        # Read CSV file
        df = pd.read_csv(csv_file_path)
        logging.info(f"CSV contains {len(df)} rows")
        
        # Display the column names
        logging.info(f"CSV columns: {df.columns.tolist()}")
        
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
            'Is New Grad': 'is_new_grad'
        }
        df = df.rename(columns=column_mapping)
        
        # Convert date format to timestamp for Prisma compatibility
        df['posting_date'] = pd.to_datetime(df['date'])
        
        # Convert boolean columns with case sensitivity
        df['h1b_sponsored'] = df['h1b_sponsored'].apply(lambda x: True if x == 'yes' else False)
        df['is_new_grad'] = df['is_new_grad'].apply(lambda x: True if x == 'yes' else False)
        
        # Calculate content hash for each row
        df['content_hash'] = df.apply(calculate_content_hash, axis=1)
        
        # Replace NaN values with None
        df = df.replace({np.nan: None})
        
        # Connect to the database
        conn = get_database_connection()
        
        # Process all rows from the CSV
        for i, row in df.iterrows():
            try:
                with conn.cursor() as cur:
                    # Insert the row
                    try:
                        cur.execute("""
                            INSERT INTO job_listings (
                                position_title, posting_date, apply_link,
                                work_model, location, company, company_size,
                                company_industry, salary, qualifications,
                                h1b_sponsored, is_new_grad, content_hash,
                                created_at, updated_at, last_seen_at, is_active
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                                      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, TRUE)
                        """, (
                            row['position_title'], row['posting_date'], row['apply'],
                            row['work_model'], row['location'], row['company'],
                            row['company_size'], row['company_industry'], row['salary'],
                            row['qualifications'], row['h1b_sponsored'],
                            row['is_new_grad'], row['content_hash']
                        ))
                        if i % 50 == 0:
                            logging.info(f"Processed {i} rows so far")
                    except psycopg2.errors.UniqueViolation:
                        # If there's a unique constraint violation, just update the last_seen_at
                        conn.rollback()  # Need to rollback the failed transaction
                        cur.execute("""
                            UPDATE job_listings
                            SET last_seen_at = CURRENT_TIMESTAMP,
                                is_active = TRUE
                            WHERE position_title = %s
                            AND company = %s
                            AND posting_date = %s
                        """, (row['position_title'], row['company'], row['posting_date']))
                    except Exception as e:
                        logging.error(f"Error inserting row {i}: {str(e)}")
                        conn.rollback()
            except Exception as e:
                logging.error(f"Error processing row {i}: {str(e)}")
                conn.rollback()
                continue
        
        # Commit the changes
        conn.commit()
        logging.info("Debug import completed successfully")
    except Exception as e:
        logging.error(f"Error debugging CSV import: {str(e)}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    debug_csv_import() 