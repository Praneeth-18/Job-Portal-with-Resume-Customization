import requests
import os
import logging
import time
import tempfile
import shutil
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("csv_download.log"),
        logging.StreamHandler()
    ]
)

# Job categories and their URLs
JOB_CATEGORIES = {
    "Software Engineering": "https://www.newgrad-jobs.com/",
    "Data Analyst": "https://www.newgrad-jobs.com/?k=da",
    "Business Analyst": "https://www.newgrad-jobs.com/?k=ba",
    "Machine Learning and AI": "https://www.newgrad-jobs.com/?k=aiml",
    "Cybersecurity": "https://www.newgrad-jobs.com/?k=cs",
    "Data Engineer": "https://www.newgrad-jobs.com/?k=de"
}

def download_csv(url, output_path):
    """Download CSV from the specified URL using Selenium and save it to the output path."""
    try:
        # Ensure the directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Get the category name from the URL
        category = next((cat for cat, cat_url in JOB_CATEGORIES.items() if cat_url == url), "Unknown")
        logging.info(f"Downloading {category} jobs from {url}")
        
        # Configure ChromeOptions
        chrome_options = webdriver.ChromeOptions()
        download_dir = os.path.dirname(output_path)
        prefs = {
            "download.default_directory": download_dir,
            "download.prompt_for_download": False,
            "download.directory_upgrade": True,
            "safebrowsing.enabled": True,
        }
        chrome_options.add_experimental_option("prefs", prefs)
        
        # Add additional options to make Chrome more stable
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--disable-features=NetworkService")
        chrome_options.add_argument("--window-size=1920x1080")
        chrome_options.add_argument("--disable-notifications")
        chrome_options.add_argument("--disable-extensions")
        
        # Add headless mode to run in background
        chrome_options.add_argument("--headless")
        
        driver = None
        try:
            # Set up Selenium with ChromeDriverManager to handle driver installation
            driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
            logging.info(f"Chrome started in headless mode for {category}")
            driver.get(url)
            
            # Wait for the page to load
            wait = WebDriverWait(driver, 30)  # Increased wait time
            
            # Wait for the Airtable iframe to load
            logging.info(f"Waiting for Airtable iframe to load for {category}")
            iframe = wait.until(
                EC.presence_of_element_located((By.ID, "airtable-box"))
            )
            
            # Hide the overlapping element if it exists
            try:
                driver.execute_script("document.querySelector('.flex-block-53').style.display = 'none';")
            except:
                pass
            
            # Scroll the iframe into the center of the viewport
            driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", iframe)
            
            # Switch to the iframe context
            driver.switch_to.frame(iframe)
            logging.info(f"Switched to iframe for {category}")
            
            # Wait for the "Download CSV" button to be clickable
            logging.info(f"Looking for Download CSV button for {category}")
            download_button = wait.until(
                EC.element_to_be_clickable((By.XPATH, "//a[contains(@class, 'flex-inline') and contains(.//div, 'Download CSV')]"))
            )
            
            # Scroll the button into the center of the viewport
            driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", download_button)
            
            # Wait for the button to be visible
            wait.until(EC.visibility_of(download_button))
            
            # Click the button
            download_button.click()
            logging.info(f"Download button clicked for {category}")
            
            # Wait for the file to download
            logging.info(f"Waiting for {category} CSV file to download")
            time.sleep(15)  # Increased wait time
            
            # Get the most recently downloaded file
            downloaded_files = []
            for filename in os.listdir(download_dir):
                if filename.endswith('.csv') and os.path.isfile(os.path.join(download_dir, filename)):
                    file_path = os.path.join(download_dir, filename)
                    downloaded_files.append((file_path, os.path.getmtime(file_path)))
            
            if not downloaded_files:
                logging.error(f"No CSV files were downloaded for {category}")
                return False
            
            # Sort by modification time to get the latest
            latest_file = max(downloaded_files, key=lambda x: x[1])[0]
            
            # Validate the downloaded CSV file
            try:
                import pandas as pd
                df = pd.read_csv(latest_file)
                
                if len(df) == 0:
                    logging.error(f"Downloaded CSV for {category} is empty")
                    return False
                
                logging.info(f"CSV contains {len(df)} rows with columns: {', '.join(df.columns)}")
                
                # Check for required columns
                required_columns = ['Position Title', 'Date', 'Company']
                missing_columns = [col for col in required_columns if col not in df.columns]
                if missing_columns:
                    logging.error(f"CSV for {category} is missing required columns: {missing_columns}")
                    return False
                
                # Add a category column to the CSV file
                df['Category'] = category
                df.to_csv(latest_file, index=False)
                logging.info(f"Added Category={category} column to CSV file")
                
            except Exception as e:
                logging.error(f"Error validating CSV for {category}: {str(e)}")
                return False
            
            # Move and rename the file to the specified output path
            shutil.move(latest_file, output_path)
            logging.info(f"Successfully downloaded CSV for {category} to {output_path}")
            
            return True
            
        except Exception as e:
            logging.error(f"Error downloading CSV for {category}: {str(e)}")
            return False
        finally:
            if driver:
                try:
                    driver.switch_to.default_content()
                except:
                    pass
                driver.quit()
                logging.info(f"Chrome browser closed for {category}")
                
    except Exception as e:
        logging.error(f"Error setting up download for {url}: {str(e)}")
        return False

def download_csv_files():
    """Download CSV files for all job categories."""
    results = {}
    base_dir = os.path.join(os.getcwd(), 'data')
    os.makedirs(base_dir, exist_ok=True)
    
    # Define retry parameters
    max_attempts = 2
    initial_delay = 5  # seconds
    
    for category, url in JOB_CATEGORIES.items():
        success = False
        output_path = None
        attempt = 0
        
        while attempt < max_attempts and not success:
            attempt += 1
            try:
                # Use a more specific filename format with timestamp to prevent conflicts
                timestamp = time.strftime("%Y%m%d_%H%M%S")
                category_slug = category.lower().replace(' ', '_').replace('&', 'and')
                category_filename = f"{category_slug}_jobs_{timestamp}.csv"
                output_path = os.path.join(base_dir, category_filename)
                
                logging.info(f"Downloading {category} jobs from {url} to {output_path} (Attempt {attempt}/{max_attempts})")
                success = download_csv(url, output_path)
                
                if success:
                    logging.info(f"Successfully downloaded {category} CSV to {output_path}")
                    # Verify the file was created and has content
                    if os.path.exists(output_path):
                        file_size = os.path.getsize(output_path)
                        if file_size > 0:
                            logging.info(f"CSV file for {category} has size {file_size} bytes")
                            # Validate file content
                            try:
                                import pandas as pd
                                df = pd.read_csv(output_path)
                                if len(df) == 0:
                                    logging.warning(f"CSV file for {category} contains no rows")
                                    success = False
                                else:
                                    logging.info(f"CSV file for {category} contains {len(df)} rows")
                                    # Double-check required columns exist
                                    required_columns = ['Position Title', 'Company', 'Date']
                                    if not all(col in df.columns for col in required_columns):
                                        logging.error(f"CSV file for {category} is missing required columns: {[col for col in required_columns if col not in df.columns]}")
                                        success = False
                            except Exception as e:
                                logging.error(f"Error validating CSV content for {category}: {str(e)}")
                                success = False
                        else:
                            logging.warning(f"CSV file for {category} exists but is empty (0 bytes)")
                            success = False
                    else:
                        logging.error(f"CSV file for {category} was not created at {output_path}")
                        success = False
                
                if not success and attempt < max_attempts:
                    retry_delay = initial_delay * attempt
                    logging.info(f"Download failed for {category} on attempt {attempt}. Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
            except Exception as e:
                logging.error(f"Error processing {category} (Attempt {attempt}/{max_attempts}): {str(e)}")
                if attempt < max_attempts:
                    retry_delay = initial_delay * attempt
                    logging.info(f"Error downloading {category}. Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                success = False
        
        # Store the final result
        results[category] = {
            'success': success,
            'path': output_path if success else None
        }
        
        # Add a delay between category downloads to avoid rate limiting
        if category != list(JOB_CATEGORIES.keys())[-1]:  # Skip delay after last category
            logging.info(f"Waiting 5 seconds before downloading the next category...")
            time.sleep(5)
    
    # Log summary of all downloads
    successful_categories = [cat for cat, res in results.items() if res['success']]
    failed_categories = [cat for cat, res in results.items() if not res['success']]
    
    logging.info(f"Download summary - Successful: {len(successful_categories)}/{len(JOB_CATEGORIES)}")
    if successful_categories:
        logging.info(f"Successfully downloaded: {', '.join(successful_categories)}")
    if failed_categories:
        logging.error(f"Failed to download: {', '.join(failed_categories)}")
    
    return results

if __name__ == "__main__":
    download_csv_files()