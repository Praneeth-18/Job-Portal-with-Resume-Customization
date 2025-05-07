import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateJobListings() {
  try {
    // Get all job listings
    const jobListings = await prisma.jobListing.findMany();
    
    for (const job of jobListings) {
      // Detect if it's a new grad role based on position title and qualifications
      const isNewGrad = detectNewGradRole(job);
      
      // Update the job listing with smart defaults
      await prisma.jobListing.update({
        where: { id: job.id },
        data: {
          isNewGrad: isNewGrad ?? false,
          h1bSponsored: job.h1bSponsored ?? false,
          workModel: job.workModel ?? 'On Site',
          isActive: job.isActive ?? true,
        },
      });
    }
    
    console.log('Successfully updated job listings with defaults');
  } catch (error) {
    console.error('Error updating job listings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function detectNewGradRole(job: any): boolean {
  const newGradKeywords = [
    'new grad',
    'new graduate',
    'entry level',
    'entry-level',
    'junior',
    'associate',
    'university grad',
    'recent graduate',
    'fresh graduate',
    '0-2 years',
    'early career',
  ];
  
  const text = `${job.positionTitle} ${job.qualifications ?? ''}`.toLowerCase();
  
  // Check for new grad keywords in position title or qualifications
  return newGradKeywords.some(keyword => text.includes(keyword));
}

updateJobListings(); 