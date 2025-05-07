import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

interface CSVRow {
  'Position Title': string;
  'Date': string;
  'Apply': string;
  'Work Model': string;
  'Location': string;
  'Company': string;
  'Company Size': string;
  'Company Industry': string;
  'Salary': string;
  'Qualifications': string;
  'H1b Sponsored': string;
  'Is New Grad': string;
}

// Categories and their corresponding CSV files
const categoryFiles = {
  "Software Engineering": "software_engineering_jobs.csv",
  "Data Analyst": "data_analyst_jobs.csv",
  "Business Analyst": "business_analyst_jobs.csv",
  "Machine Learning and AI": "machine_learning_and_ai_jobs.csv",
  "Cybersecurity": "cybersecurity_jobs.csv",
  "Data Engineer": "data_engineer_jobs.csv"
};

// Generate a content hash for deduplication
function generateContentHash(row: CSVRow): string {
  const contentObj = {
    positionTitle: row['Position Title'] || '',
    company: row['Company'] || '',
    location: row['Location'] || '',
    salary: row['Salary'] || '',
    qualifications: row['Qualifications'] || '',
    workModel: row['Work Model'] || '',
    companySize: row['Company Size'] || '',
    companyIndustry: row['Company Industry'] || '',
    h1bSponsored: row['H1b Sponsored'] || '',
    isNewGrad: row['Is New Grad'] || ''
  };
  
  return createHash('sha256')
    .update(JSON.stringify(contentObj))
    .digest('hex');
}

async function importCSVFiles() {
  try {
    console.log('Starting CSV import process...');
    
    // Clear existing job listings
    await prisma.jobListing.deleteMany({});
    console.log('Cleared existing job listings');
    
    let totalImported = 0;
    
    // Process each category CSV file
    for (const [category, fileName] of Object.entries(categoryFiles)) {
      const filePath = path.join(process.cwd(), 'data', fileName);
      
      if (fs.existsSync(filePath)) {
        console.log(`Processing ${category} from ${filePath}`);
        
        const rows: CSVRow[] = [];
        
        // Read the CSV file
        await new Promise((resolve, reject) => {
          fs.createReadStream(filePath)
            .pipe(csv.parse({ headers: true }))
            .on('error', error => reject(error))
            .on('data', (row: CSVRow) => rows.push(row))
            .on('end', () => resolve(rows));
        });
        
        console.log(`Read ${rows.length} rows from ${fileName}`);
        
        // Process rows into jobs
        const jobs = rows.map((row) => {
          return {
            positionTitle: row['Position Title'],
            postingDate: new Date(row['Date']),
            applyLink: row['Apply'],
            workModel: row['Work Model'],
            location: row['Location'],
            company: row['Company'],
            companySize: row['Company Size'],
            companyIndustry: row['Company Industry'],
            salary: row['Salary'],
            qualifications: row['Qualifications'],
            h1bSponsored: row['H1b Sponsored'] === 'yes',
            isNewGrad: row['Is New Grad'] === 'yes',
            jobCategory: category,
            contentHash: generateContentHash(row),
            lastSeenAt: new Date(),
            isActive: true
          };
        });
        
        // Insert the jobs
        const result = await prisma.jobListing.createMany({
          data: jobs,
          skipDuplicates: true
        });
        
        console.log(`Imported ${result.count} ${category} jobs`);
        totalImported += result.count;
      } else {
        console.log(`CSV file not found: ${filePath}`);
      }
    }
    
    console.log(`Total jobs imported: ${totalImported}`);
    
    // Get H1B sponsored count
    const h1bCount = await prisma.jobListing.count({
      where: { h1bSponsored: true }
    });
    console.log(`Jobs with H1B sponsorship: ${h1bCount}`);
    
    // Get new grad count
    const newGradCount = await prisma.jobListing.count({
      where: { isNewGrad: true }
    });
    console.log(`New grad jobs: ${newGradCount}`);
    
    console.log('CSV import completed successfully');
  } catch (error) {
    console.error('Error importing CSV files:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importCSVFiles(); 