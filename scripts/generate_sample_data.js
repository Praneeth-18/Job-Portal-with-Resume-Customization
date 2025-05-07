import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seedJobCategories() {
  try {
    console.log("Generating sample job listings with different categories...");
    
    // Create sample job listings for different categories
    const categories = [
      "Software Engineering",
      "Data Analyst",
      "Business Analyst",
      "Machine Learning and AI",
      "Cybersecurity",
      "Data Engineer"
    ];
    
    // Clear existing data first
    console.log("Clearing existing job listings...");
    await prisma.jobListing.deleteMany({});
    console.log("Existing job listings deleted.");
    
    // Sample data by category
    const sampleData = {
      "Software Engineering": [
        {
          positionTitle: 'Software Engineer',
          company: 'Tech Corp',
          postingDate: new Date('2025-04-01'),
          applyLink: 'https://example.com/jobs/1',
          workModel: 'Remote',
          location: 'San Francisco, CA',
          companySize: '1001-5000',
          companyIndustry: 'Technology',
          salary: '$120K-$150K',
          qualifications: '1. Experience with Python\n2. JavaScript knowledge',
          h1bSponsored: true,
          isNewGrad: true,
          contentHash: 'se-1'
        },
        {
          positionTitle: 'Frontend Developer',
          company: 'WebDev Inc',
          postingDate: new Date('2025-04-02'),
          applyLink: 'https://example.com/jobs/2',
          workModel: 'Hybrid',
          location: 'New York, NY',
          companySize: '101-250',
          companyIndustry: 'Technology',
          salary: '$100K-$120K',
          qualifications: '1. React.js experience',
          h1bSponsored: false,
          isNewGrad: true,
          contentHash: 'se-2'
        },
        {
          positionTitle: 'Backend Engineer',
          company: 'Server Systems',
          postingDate: new Date('2025-04-03'),
          applyLink: 'https://example.com/jobs/3',
          workModel: 'On Site',
          location: 'Boston, MA',
          companySize: '501-1000',
          companyIndustry: 'Technology',
          salary: '$130K-$160K',
          qualifications: '1. Node.js\n2. Database design',
          h1bSponsored: true,
          isNewGrad: false,
          contentHash: 'se-3'
        }
      ],
      "Data Analyst": [
        {
          positionTitle: 'Data Analyst',
          company: 'Data Insights',
          postingDate: new Date('2025-04-01'),
          applyLink: 'https://example.com/jobs/4',
          workModel: 'Remote',
          location: 'Chicago, IL',
          companySize: '251-500',
          companyIndustry: 'Business Intelligence',
          salary: '$90K-$110K',
          qualifications: '1. SQL proficiency\n2. Data visualization',
          h1bSponsored: true,
          isNewGrad: true,
          contentHash: 'da-1'
        },
        {
          positionTitle: 'Business Intelligence Analyst',
          company: 'InfoCorp',
          postingDate: new Date('2025-04-02'),
          applyLink: 'https://example.com/jobs/5',
          workModel: 'Hybrid',
          location: 'Seattle, WA',
          companySize: '1001-5000',
          companyIndustry: 'Technology',
          salary: '$95K-$115K',
          qualifications: '1. Tableau experience',
          h1bSponsored: false,
          isNewGrad: true,
          contentHash: 'da-2'
        }
      ],
      "Business Analyst": [
        {
          positionTitle: 'Business Analyst',
          company: 'Business Solutions',
          postingDate: new Date('2025-04-01'),
          applyLink: 'https://example.com/jobs/6',
          workModel: 'On Site',
          location: 'Austin, TX',
          companySize: '251-500',
          companyIndustry: 'Consulting',
          salary: '$85K-$100K',
          qualifications: '1. Requirements gathering\n2. Process modeling',
          h1bSponsored: true,
          isNewGrad: true,
          contentHash: 'ba-1'
        },
        {
          positionTitle: 'Systems Analyst',
          company: 'Tech Systems',
          postingDate: new Date('2025-04-02'),
          applyLink: 'https://example.com/jobs/7',
          workModel: 'Hybrid',
          location: 'Denver, CO',
          companySize: '501-1000',
          companyIndustry: 'Technology',
          salary: '$90K-$110K',
          qualifications: '1. UML\n2. SDLC knowledge',
          h1bSponsored: false,
          isNewGrad: false,
          contentHash: 'ba-2'
        }
      ],
      "Machine Learning and AI": [
        {
          positionTitle: 'Machine Learning Engineer',
          company: 'AI Research',
          postingDate: new Date('2025-04-01'),
          applyLink: 'https://example.com/jobs/8',
          workModel: 'Remote',
          location: 'San Jose, CA',
          companySize: '251-500',
          companyIndustry: 'Artificial Intelligence',
          salary: '$140K-$180K',
          qualifications: '1. PyTorch or TensorFlow\n2. ML algorithms',
          h1bSponsored: true,
          isNewGrad: false,
          contentHash: 'ml-1'
        },
        {
          positionTitle: 'AI Research Scientist',
          company: 'DeepThought',
          postingDate: new Date('2025-04-02'),
          applyLink: 'https://example.com/jobs/9',
          workModel: 'On Site',
          location: 'Cambridge, MA',
          companySize: '101-250',
          companyIndustry: 'Artificial Intelligence',
          salary: '$150K-$190K',
          qualifications: '1. PhD in AI/ML\n2. Publication record',
          h1bSponsored: true,
          isNewGrad: true,
          contentHash: 'ml-2'
        }
      ],
      "Cybersecurity": [
        {
          positionTitle: 'Security Analyst',
          company: 'SecureSystems',
          postingDate: new Date('2025-04-01'),
          applyLink: 'https://example.com/jobs/10',
          workModel: 'Hybrid',
          location: 'Washington, DC',
          companySize: '501-1000',
          companyIndustry: 'Cybersecurity',
          salary: '$110K-$140K',
          qualifications: '1. Network security\n2. Intrusion detection',
          h1bSponsored: true,
          isNewGrad: false,
          contentHash: 'cs-1'
        },
        {
          positionTitle: 'Security Engineer',
          company: 'CyberDefense',
          postingDate: new Date('2025-04-02'),
          applyLink: 'https://example.com/jobs/11',
          workModel: 'Remote',
          location: 'Atlanta, GA',
          companySize: '251-500',
          companyIndustry: 'Cybersecurity',
          salary: '$120K-$150K',
          qualifications: '1. Encryption methods\n2. Security audits',
          h1bSponsored: false,
          isNewGrad: true,
          contentHash: 'cs-2'
        }
      ],
      "Data Engineer": [
        {
          positionTitle: 'Data Engineer',
          company: 'DataFlow',
          postingDate: new Date('2025-04-01'),
          applyLink: 'https://example.com/jobs/12',
          workModel: 'On Site',
          location: 'Portland, OR',
          companySize: '101-250',
          companyIndustry: 'Technology',
          salary: '$125K-$155K',
          qualifications: '1. ETL design\n2. Data warehousing',
          h1bSponsored: true,
          isNewGrad: true,
          contentHash: 'de-1'
        },
        {
          positionTitle: 'Big Data Engineer',
          company: 'BigData Inc',
          postingDate: new Date('2025-04-02'),
          applyLink: 'https://example.com/jobs/13',
          workModel: 'Remote',
          location: 'Miami, FL',
          companySize: '251-500',
          companyIndustry: 'Technology',
          salary: '$130K-$160K',
          qualifications: '1. Hadoop\n2. Spark',
          h1bSponsored: false,
          isNewGrad: false,
          contentHash: 'de-2'
        }
      ]
    };
    
    // Insert data for each category
    for (const category of categories) {
      const jobs = sampleData[category];
      
      if (jobs) {
        // Add the category to each job
        const jobsWithCategory = jobs.map(job => ({
          ...job,
          jobCategory: category
        }));
        
        // Insert the jobs
        await prisma.jobListing.createMany({
          data: jobsWithCategory,
          skipDuplicates: true
        });
        
        console.log(`Added ${jobsWithCategory.length} ${category} jobs`);
      }
    }
    
    // Count total jobs created
    const totalJobs = await prisma.jobListing.count();
    console.log(`Total job listings created: ${totalJobs}`);
    
    // Count jobs with h1b sponsorship
    const h1bJobs = await prisma.jobListing.count({
      where: { h1bSponsored: true }
    });
    console.log(`Jobs with H1B sponsorship: ${h1bJobs}`);
    
    // Count new grad jobs
    const newGradJobs = await prisma.jobListing.count({
      where: { isNewGrad: true }
    });
    console.log(`New grad jobs: ${newGradJobs}`);
    
    console.log("Sample data generation complete!");
  } catch (error) {
    console.error('Error generating sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedJobCategories(); 