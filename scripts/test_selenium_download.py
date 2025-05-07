import os
import logging
import sys
from csvdownload import download_csv, JOB_CATEGORIES

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("test_selenium_download.log")
    ]
)

def test_download():
    """Test downloading a CSV file for a single category"""
    # Create output directory
    data_dir = os.path.join(os.getcwd(), 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    # Pick a single category to test
    category = "Software Engineering"
    url = JOB_CATEGORIES[category]
    
    # Set output path
    output_path = os.path.join(data_dir, f"{category.lower().replace(' ', '_')}_jobs.csv")
    
    print(f"Testing CSV download for {category} from {url}")
    print(f"Output will be saved to {output_path}")
    
    # Attempt to download the CSV
    success = download_csv(url, output_path)
    
    if success:
        print(f"✅ Successfully downloaded CSV for {category}")
        if os.path.exists(output_path):
            print(f"File size: {os.path.getsize(output_path)} bytes")
            print(f"File exists at: {output_path}")
            
            # Print first few lines of the CSV
            try:
                with open(output_path, 'r') as f:
                    lines = f.readlines()[:5]
                    print("\nFirst few lines of the CSV:")
                    for line in lines:
                        print(line.strip())
            except Exception as e:
                print(f"Error reading CSV file: {str(e)}")
    else:
        print(f"❌ Failed to download CSV for {category}")

if __name__ == "__main__":
    test_download() 