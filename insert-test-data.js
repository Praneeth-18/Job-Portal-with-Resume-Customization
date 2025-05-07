import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://saipraneethkonuri@localhost:5432/joblistingsportal?schema=public'
});

async function insertTestData() {
  console.log('Inserting test data into job_listings...');
  
  try {
    // First, delete any existing data
    await pool.query('DELETE FROM job_listings');
    console.log('Cleared existing job_listings data');
    
    // Sample job categories
    const categories = [
      'Software Engineering',
      'Data Analyst',
      'Business Analyst',
      'Machine Learning and AI',
      'Cybersecurity',
      'Data Engineer'
    ];
    
    // Sample companies
    const companies = [
      'Google',
      'Microsoft',
      'Amazon',
      'Apple',
      'Meta',
      'Netflix',
      'Adobe',
      'IBM',
      'Salesforce',
      'Twitter'
    ];
    
    // Generate 50 sample job listings
    const sampleJobs = [];
    
    for (let i = 1; i <= 50; i++) {
      const categoryIndex = Math.floor(Math.random() * categories.length);
      const companyIndex = Math.floor(Math.random() * companies.length);
      
      sampleJobs.push({
        position_title: `${categories[categoryIndex]} Position ${i}`,
        posting_date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        apply_link: 'https://example.com/apply',
        work_model: ['Remote', 'Hybrid', 'In-Office'][Math.floor(Math.random() * 3)],
        location: ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA'][Math.floor(Math.random() * 4)],
        company: companies[companyIndex],
        company_size: ['Small', 'Medium', 'Large'][Math.floor(Math.random() * 3)],
        company_industry: 'Technology',
        salary: `$${(Math.floor(Math.random() * 150) + 50)}K - $${(Math.floor(Math.random() * 150) + 100)}K`,
        qualifications: 'Bachelor\'s degree in Computer Science or related field\n3+ years of experience',
        h1b_sponsored: Math.random() > 0.7,
        is_new_grad: Math.random() > 0.8,
        job_category: categories[categoryIndex],
        content_hash: `hash-${i}`,
        is_active: true
      });
    }
    
    // Insert sample jobs into database
    const insertPromises = sampleJobs.map(job => {
      const query = `
        INSERT INTO job_listings (
          position_title, posting_date, apply_link, work_model, location, 
          company, company_size, company_industry, salary, qualifications,
          h1b_sponsored, is_new_grad, job_category, content_hash, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `;
      const values = [
        job.position_title, job.posting_date, job.apply_link, job.work_model, job.location,
        job.company, job.company_size, job.company_industry, job.salary, job.qualifications,
        job.h1b_sponsored, job.is_new_grad, job.job_category, job.content_hash, job.is_active
      ];
      
      return pool.query(query, values);
    });
    
    await Promise.all(insertPromises);
    console.log(`Successfully inserted ${sampleJobs.length} job listings`);
    
    // Verify data was inserted
    const countResult = await pool.query('SELECT COUNT(*) FROM job_listings');
    console.log(`Total job listings in database: ${countResult.rows[0].count}`);
    
  } catch (error) {
    console.error('Error inserting test data:', error);
  } finally {
    await pool.end();
  }
}

insertTestData(); 