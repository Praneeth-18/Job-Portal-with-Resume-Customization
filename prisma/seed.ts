import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const main = async () => {
  // Create sample job listings
  const jobs = await Promise.all([
    prisma.jobListing.create({
      data: {
        positionTitle: "Software Engineer",
        postingDate: new Date(),
        company: "Tech Corp",
        companySize: "1000+",
        companyIndustry: "Technology",
        location: "San Francisco, CA",
        workModel: "Hybrid",
        salary: "$120,000 - $180,000",
        qualifications: "5+ years of experience in software development",
        h1bSponsored: true,
        isNewGrad: false,
        isActive: true,
        contentHash: "tech-corp-swe-1"
      },
    }),
    prisma.jobListing.create({
      data: {
        positionTitle: "Junior Developer",
        postingDate: new Date(),
        company: "Startup Inc",
        companySize: "10-50",
        companyIndustry: "Software",
        location: "Remote",
        workModel: "Remote",
        salary: "$80,000 - $100,000",
        qualifications: "0-2 years of experience, CS degree or equivalent",
        h1bSponsored: false,
        isNewGrad: true,
        isActive: true,
        contentHash: "startup-inc-jr-dev-1"
      },
    }),
  ]);

  console.log('Seeded database with sample job listings');
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 