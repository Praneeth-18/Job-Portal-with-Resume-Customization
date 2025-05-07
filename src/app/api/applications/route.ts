import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jobListingId, userId, currentStatus, notes } = body;

    // Validate required fields
    if (!jobListingId || !userId) {
      return NextResponse.json(
        { error: 'Job listing ID and user ID are required' },
        { status: 400 }
      );
    }

    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if the application already exists
      const existingResult = await client.query(
        `SELECT id FROM user_applications WHERE job_listing_id = $1 AND user_id = $2`,
        [jobListingId, userId]
      );

      if (existingResult.rows.length > 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Application already exists', applicationId: existingResult.rows[0].id },
          { status: 409 }
        );
      }
      
      // Insert new application
      const currentTime = new Date().toISOString();
      const insertResult = await client.query(
        `INSERT INTO user_applications
         (job_listing_id, user_id, current_status, applied_at, updated_at, notes)
         VALUES ($1, $2, $3, $4, $4, $5)
         RETURNING id`,
        [jobListingId, userId, currentStatus || 'Applied', currentTime, notes || null]
      );
      
      const applicationId = insertResult.rows[0].id;
      
      // Status history is created automatically by the trigger
      
      await client.query('COMMIT');
      
      return NextResponse.json({ 
        success: true, 
        applicationId,
        message: 'Application created successfully' 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { applicationId, status } = body;

    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update the application status
      const updateResult = await client.query(
        `UPDATE user_applications 
         SET current_status = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING *`,
        [status, applicationId]
      );

      if (updateResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Application not found' },
          { status: 404 }
        );
      }
      
      // Add entry to status history
      const currentTime = new Date().toISOString();
      await client.query(
        `INSERT INTO application_status_history 
         (user_application_id, status, changed_at) 
         VALUES ($1, $2, $3)`,
        [applicationId, status, currentTime]
      );
      
      await client.query('COMMIT');
      
      return NextResponse.json(updateResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get all applications for the user with job listing details
    const result = await pool.query(
      `SELECT a.*, j.* 
       FROM user_applications a
       JOIN job_listings j ON a.job_listing_id = j.id
       WHERE a.user_id = $1
       ORDER BY a.applied_at DESC`,
      [userId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
} 