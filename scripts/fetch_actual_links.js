import puppeteer from 'puppeteer';
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Extract Pool from pg
const { Pool } = pg;

// Create log directory if it doesn't exist
const LOG_DIR = path.join(__dirname, 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Configure logging
const logFile = path.join(LOG_DIR, `actual_links_${new Date().toISOString().split('T')[0]}.log`);
const logger = fs.createWriteStream(logFile, { flags: 'a' });

function log(message) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}`;
  console.log(formattedMessage);
  logger.write(formattedMessage + '\n');
}

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://saipraneethkonuri@localhost:5432/joblistingsportal?schema=public'
});

// Cookie jar for authentication
const cookieJar = [
  { name: 'SESSION_ID',   value: 'fd6b584b818e48f398551dee770d5d4c', domain: 'jobright.ai', path: '/', httpOnly: true,  secure: true, sameSite: 'Lax' },
  { name: '__stripe_mid', value: '565ea7ff-f521-45b8-aa94-bfc2e722e7f0f60b78', domain: 'jobright.ai', path: '/', httpOnly: false, secure: true, sameSite: 'Strict' },
  { name: '_clck',        value: 'kf7ep4%7C2%7Cfve%7C0%7C1898',          domain: 'jobright.ai', path: '/', httpOnly: false, secure: false, sameSite: 'Lax' },
  { name: '_clsk',        value: 'xr49aa%7C1745703182964%7C12%7C1%7Cn.clarity.ms%2Fcollect', domain: 'jobright.ai', path: '/', httpOnly: false, secure: false, sameSite: 'Lax' },
  { name: '_fbp',         value: 'fb.1.1741898092480.517065837929298741', domain: 'jobright.ai', path: '/', httpOnly: false, secure: false, sameSite: 'Lax' },
  { name: '_ga',          value: 'GA1.1.1163292672.1741898093',          domain: 'jobright.ai', path: '/', httpOnly: false, secure: false, sameSite: 'Lax' }
];

// Helper function for sleeping
const sleep = ms => new Promise(res => setTimeout(res, ms));

// Get unique job categories from the database
async function getJobCategories() {
  try {
    const query = `
      SELECT DISTINCT job_category 
      FROM job_listings 
      WHERE job_category IS NOT NULL
      ORDER BY job_category
    `;
    const result = await pool.query(query);
    return result.rows.map(row => row.job_category);
  } catch (error) {
    log(`Error fetching job categories: ${error.message}`);
    return [];
  }
}

// Get multiple unprocessed job listings for a specific category
async function getUnprocessedJobListingsByCategory(category, limit = 10) {
  try {
    const query = `
      SELECT id, apply_link, position_title, company 
      FROM job_listings 
      WHERE actual_apply_link IS NULL 
      AND apply_link IS NOT NULL 
      AND apply_link != ''
      AND job_category = $1
      LIMIT $2
    `;
    const result = await pool.query(query, [category, limit]);
    return result.rows;
  } catch (error) {
    log(`Error fetching unprocessed job listings for category ${category}: ${error.message}`);
    return [];
  }
}

// Count unprocessed job listings by category
async function countUnprocessedJobListingsByCategory() {
  try {
    const query = `
      SELECT job_category, COUNT(*) as count
      FROM job_listings 
      WHERE actual_apply_link IS NULL 
      AND apply_link IS NOT NULL 
      AND apply_link != ''
      GROUP BY job_category
      ORDER BY job_category
    `;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    log(`Error counting unprocessed job listings by category: ${error.message}`);
    return [];
  }
}

// Update job listing with actual apply link
async function updateJobListing(id, actualApplyLink, originalApplyLink) {
  try {
    // If actualApplyLink is about:blank or a non-http link, use the original apply link
    const finalLink = (actualApplyLink === 'about:blank' || !actualApplyLink.startsWith('http')) 
      ? originalApplyLink 
      : actualApplyLink;
    
    // Don't update if the link is the same as original (unless forced by debug parameter)
    if (finalLink === originalApplyLink) {
      log(`⚠️ Not updating job listing ${id} - actual link is the same as original link: ${finalLink}`);
      return true;
    }
    
    const query = `
      UPDATE job_listings 
      SET actual_apply_link = $1, 
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
    `;
    await pool.query(query, [finalLink, id]);
    log(`✅ Updated job listing ${id} with apply link: ${finalLink}`);
    return true;
  } catch (error) {
    log(`❌ Error updating job listing ${id}: ${error.message}`);
    return false;
  }
}

// Process a single job listing to get its actual apply link
async function processJobListing(jobListing) {
  let browser = null;
  try {
    log(`Processing job listing ${jobListing.id} - "${jobListing.position_title}" at ${jobListing.company}`);
    
    browser = await puppeteer.launch({ 
      headless: 'new',  // Use headless mode in production
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set cookies for authentication
    await page.setCookie(...cookieJar);
    
    // Navigate to the job page
    log(`Visiting page: ${jobListing.apply_link}`);
    await page.goto(jobListing.apply_link, { waitUntil: 'networkidle0', timeout: 15000 });
    
    // Wait for and click the apply button - try multiple selectors
    const applyButton = await Promise.race([
      page.waitForSelector('#apply-now-button-id', { timeout: 10000 }),
      page.waitForSelector('button:has-text("Apply Now")', { timeout: 10000 }),
      page.waitForSelector('[data-testid="apply-button"]', { timeout: 10000 })
    ]).catch(err => {
      log(`Error finding apply button: ${err.message}`);
      return null;
    });

    if (!applyButton) {
      log(`Could not find apply button for job ${jobListing.id}, using original link`);
      await updateJobListing(jobListing.id, jobListing.apply_link, jobListing.apply_link);
      return true;
    }
    
    // Setup popup listener before clicking
    let popupUrl = null;
    const popupPromise = new Promise((resolve) => {
      page.on('popup', async (popup) => {
        try {
          // Get the initial popup URL
          popupUrl = popup.url();
          
          // If it's about:blank, wait for navigation
          if (popupUrl === 'about:blank') {
            await popup.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }).catch(() => {});
            popupUrl = popup.url();
          }
          
          log(`Popup URL detected: ${popupUrl}`);
          
          // If we have a valid URL, use it immediately
          if (popupUrl && popupUrl !== 'about:blank' && popupUrl.startsWith('http')) {
            log(`Using popup URL: ${popupUrl}`);
            await updateJobListing(jobListing.id, popupUrl, jobListing.apply_link);
            resolve(true);
            return;
          }
          resolve(false);
        } catch (err) {
          log(`Error handling popup: ${err.message}`);
          resolve(false);
        }
      });
    });

    // Click the apply button
    await applyButton.click();

    // Handle the autofill confirmation popup if it appears
    try {
      // Wait for the "No, Apply Manually" button with a very short timeout
      const noButton = await Promise.race([
        page.waitForSelector('button.index_confirm-popup-no-button__9FwZ6', { timeout: 1000 }),
        page.waitForSelector('button:has-text("No, Apply Manually")', { timeout: 1000 })
      ]).catch(() => null);

      // If the button exists, click it immediately
      if (noButton) {
        log('Found autofill popup, clicking "No, Apply Manually"');
        await noButton.click();
        // Very short pause to let the popup close
        await sleep(200);
      }
    } catch (err) {
      // Don't log anything for this expected case
    }
    
    // Wait for popup with a reasonable timeout
    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(false), 5000));
    const popupHandled = await Promise.race([popupPromise, timeoutPromise]);

    // If popup was handled successfully, we're done
    if (popupHandled) {
      return true;
    }

    // Only if no popup was detected or handled, use the original link
    log(`No popup detected, using original link: ${jobListing.apply_link}`);
    await updateJobListing(jobListing.id, jobListing.apply_link, jobListing.apply_link);
    return true;
  } catch (error) {
    log(`❌ Error processing job listing ${jobListing.id}: ${error.message}`);
    // If there was an error, still update with the original link
    try {
      await updateJobListing(jobListing.id, jobListing.apply_link, jobListing.apply_link);
    } catch (updateError) {
      log(`❌ Error updating job listing after failure: ${updateError.message}`);
    }
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Main function to run the script
async function main() {
  log('Starting to fetch actual apply links for job listings');
  
  try {
    // Get count of unprocessed listings by category
    const categoryCounts = await countUnprocessedJobListingsByCategory();
    let totalUnprocessed = categoryCounts.reduce((sum, cat) => sum + parseInt(cat.count), 0);
    
    log(`Found ${totalUnprocessed} total job listings that need actual apply links`);
    
    // Log breakdown by category
    categoryCounts.forEach(cat => {
      log(`Category ${cat.job_category}: ${cat.count} listings`);
    });
    
    // Get all categories
    const categories = await getJobCategories();
    
    if (categories.length === 0) {
      log('No categories found. Exiting.');
      return;
    }
    
    // Process multiple listings per category at a time
    while (totalUnprocessed > 0) {
      let processedThisRound = 0;
      
      // Process each category
      for (const category of categories) {
        // Get batch of job listings for current category
        const jobListings = await getUnprocessedJobListingsByCategory(category, 10);
        
        if (jobListings.length > 0) {
          log(`Processing ${jobListings.length} listings from category: ${category}`);
          
          // Process each job listing in the batch
          for (const jobListing of jobListings) {
            await processJobListing(jobListing);
            processedThisRound++;
            log(`Completed processing ${processedThisRound} jobs in current round`);
          }
        }
      }
      
      // If no jobs were processed this round, we're done
      if (processedThisRound === 0) {
        log('No more unprocessed job listings found');
        break;
      }
      
      // Re-count remaining unprocessed listings
      const updatedCategoryCounts = await countUnprocessedJobListingsByCategory();
      totalUnprocessed = updatedCategoryCounts.reduce((sum, cat) => sum + parseInt(cat.count), 0);
      log(`Remaining job listings to process: ${totalUnprocessed}`);
    }
    
    log('Finished fetching actual apply links for all job listings');
  } catch (error) {
    log(`Critical error in main processing loop: ${error.message}`);
  } finally {
    // Close database connection
    await pool.end();
    logger.end();
  }
}

// Run the main function
main().catch(error => {
  log(`Unhandled error: ${error.message}`);
  process.exit(1);
}); 