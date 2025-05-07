import { Suspense } from 'react';
import { Pool } from 'pg';
import { JobListings } from '@/components/job-listings/JobListings';
import { PageHeader } from '@/components/PageHeader';

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Constants
const ITEMS_PER_PAGE = 200;

type CategoryStats = {
  category: string;
  count: number;
  totalPages: number;
};

const calculateTotalPages = (count: number) => Math.max(1, Math.ceil(count / ITEMS_PER_PAGE));

async function getNewGradJobListings(page: number | string = 1, category: string | null = null) {
  try {
    // Convert page to number if it's a string
    const pageNumber = typeof page === 'string' ? parseInt(page) : page;
    
    // Calculate pagination values
    const offset = (pageNumber - 1) * ITEMS_PER_PAGE;
    const limit = ITEMS_PER_PAGE;

    // Build where clause based on parameters
    let whereClause = `WHERE is_new_grad = TRUE`;
    const queryParams: (string | number)[] = [limit, offset];
    
    // Add category filter if provided
    if (category && category !== 'All Categories') {
      whereClause += ` AND job_category = $3`;
      queryParams.push(category);
    }
    
    // Get paginated New Grad job listings
    const jobsQuery = `
      SELECT * FROM job_listings 
      ${whereClause}
      ORDER BY posting_date DESC
      LIMIT $1 OFFSET $2
    `;
    
    const jobsResult = await pool.query(jobsQuery, queryParams);
    
    // Count total New Grad jobs for pagination
    // Make sure to use proper parameter indexing for the count query
    let countQuery: string;
    let countParams: string[] = [];
    
    if (category && category !== 'All Categories') {
      countQuery = `SELECT COUNT(*) FROM job_listings WHERE is_new_grad = TRUE AND job_category = $1`;
      countParams = [category];
    } else {
      countQuery = `SELECT COUNT(*) FROM job_listings WHERE is_new_grad = TRUE`;
      countParams = [];
    }
    
    const countResult = await pool.query(countQuery, countParams);
    
    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = calculateTotalPages(totalCount);
    
    // Get all unique categories for New Grad jobs
    const categoriesResult = await pool.query(
      `SELECT DISTINCT job_category FROM job_listings WHERE is_new_grad = TRUE ORDER BY job_category`
    );
    
    const allCategories = ['All Categories', ...categoriesResult.rows
      .map((c: any) => c.job_category || 'Uncategorized')
      .filter((c: any) => c !== null)
      .sort()];
    
    console.log(`Found ${jobsResult.rows.length} New Grad jobs for page ${typeof page === 'string' ? parseInt(page) : page} of ${totalPages}`);
    
    // Transform jobs data to match expected format in UI
    const jobs = jobsResult.rows.map(row => ({
      id: row.id,
      positionTitle: row.position_title,
      company: row.company,
      location: row.location,
      workModel: row.work_model,
      jobCategory: row.job_category,
      postingDate: row.posting_date,
      applyLink: row.apply_link,
      actualApplyLink: row.actual_apply_link,
      salary: row.salary,
      qualifications: row.qualifications,
      companySize: row.company_size,
      companyIndustry: row.company_industry,
      h1bSponsored: row.h1b_sponsored,
      isActive: row.is_active,
      isNewGrad: row.is_new_grad,
      createdAt: row.created_at || new Date(),
      updatedAt: row.updated_at || new Date(),
      lastSeenAt: row.last_seen_at || new Date(),
      contentHash: row.content_hash || ''
    }));
    
    return { jobs, totalPages, allCategories, category: category || 'All Categories' };
  } catch (error) {
    console.error('Error fetching New Grad job listings:', error);
    // Return empty results on error
    return { jobs: [], totalPages: 0, allCategories: ['All Categories'], category: 'All Categories' };
  }
}

async function getCategoryStats(): Promise<CategoryStats[]> {
  try {
    // Get counts for each category in New Grad jobs
    const result = await pool.query(
      `SELECT job_category, COUNT(*) as count 
       FROM job_listings 
       WHERE is_new_grad = TRUE
       GROUP BY job_category 
       ORDER BY job_category`
    );
    
    // Add "All Categories" entry
    const totalResult = await pool.query(
      `SELECT COUNT(*) as count FROM job_listings WHERE is_new_grad = TRUE`
    );
    
    const totalCount = parseInt(totalResult.rows[0].count);
    
    const stats = [
      {
        category: 'All Categories',
        count: totalCount,
        totalPages: calculateTotalPages(totalCount),
      },
      ...result.rows.map((cat: any) => ({
        category: cat.job_category || 'Uncategorized',
        count: parseInt(cat.count),
        totalPages: calculateTotalPages(parseInt(cat.count)),
      }))
    ];
    
    return stats;
  } catch (error) {
    console.error('Error fetching New Grad category stats:', error);
    return [];
  }
}

export default async function NewGradJobsPage({
  searchParams,
}: {
  searchParams: { page?: string; category?: string; };
}) {
  // Convert searchParams to standard values with proper types
  const pageParam = searchParams?.page ? String(searchParams.page) : undefined;
  const categoryParam = searchParams?.category ? String(searchParams.category) : undefined;
  
  // Parse page number with fallback to 1
  const page = pageParam ? parseInt(pageParam) : 1;
  const currentPage = isNaN(page) ? 1 : page;
  const selectedCategory = categoryParam || 'All Categories';
  
  // Get New Grad job listings with pagination and category filter
  const { jobs, totalPages, allCategories } = await getNewGradJobListings(
    currentPage, 
    selectedCategory !== 'All Categories' ? selectedCategory : null
  );

  // Get all category statistics for showing counts and pagination
  const categoryStats = await getCategoryStats();

  return (
    <div className="container mx-auto py-8 px-4">
      <PageHeader
        heading="New Grad Jobs"
        text="Find jobs specifically for recent graduates and entry-level positions"
      />
      <Suspense fallback={<div>Loading New Grad job listings...</div>}>
        <JobListings 
          jobs={jobs} 
          totalPages={totalPages} 
          currentPage={currentPage} 
          allCategories={allCategories}
          selectedCategory={selectedCategory}
          categoryStats={categoryStats}
        />
      </Suspense>
    </div>
  );
} 