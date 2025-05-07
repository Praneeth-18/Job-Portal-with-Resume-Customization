import { ApplicationsList } from '@/components/applications/ApplicationsList';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/PageHeader';
import { Suspense } from 'react';

export const revalidate = 0; // Don't cache this page

async function getApplications() {
  const applications = await db.userApplication.findMany({
    where: {
      userId: 'default-user', // We'll update this when we add authentication
    },
    include: {
      jobListing: true,
      statusHistory: {
        orderBy: {
          changedAt: 'desc',
        },
      },
    },
    orderBy: {
      appliedAt: 'desc',
    },
  });

  return applications;
}

export default async function ApplicationsPage() {
  const applications = await getApplications();

  return (
    <div className="container mx-auto py-8 px-4">
      <PageHeader 
        heading="My Applications"
        text="Track and manage your job applications"
      />
      <Suspense fallback={
        <div className="text-center p-10 section-card">
          <div className="inline-block bg-accent/70 text-white px-4 py-2 rounded-ios font-medium">Loading applications...</div>
        </div>
      }>
        <ApplicationsList applications={applications} />
      </Suspense>
    </div>
  );
} 