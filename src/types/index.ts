// Define job category types
export type JobCategory =
  | 'Software Engineering'
  | 'Data Analyst'
  | 'Business Analyst'
  | 'Machine Learning and AI'
  | 'Cybersecurity'
  | 'Data Engineer'
  | 'Frontend Engineer'
  | 'Backend Engineer'
  | 'Full Stack Engineer'
  | 'DevOps Engineer'
  | 'QA Engineer'
  | 'Product Manager'
  | 'Project Manager'
  | 'UX/UI Designer'
  | 'Mobile Developer'
  | 'Cloud Engineer'
  | 'Database Administrator'
  | 'Security Engineer'
  | 'Network Engineer'
  | 'Systems Engineer'
  | 'AI/ML Engineer'
  | string; // Allow any string for flexibility in case new categories are added

// Define a job listing type that matches our transformed data
export interface JobListingType {
  id: number;
  positionTitle: string;
  postingDate: Date;
  applyLink?: string | null;
  actualApplyLink?: string | null;
  workModel?: string | null;
  location?: string | null;
  company: string;
  companySize?: string | null;
  companyIndustry?: string | null;
  salary?: string | null;
  qualifications?: string | null;
  h1bSponsored: boolean;
  isNewGrad: boolean;
  jobCategory?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSeenAt: Date;
  contentHash: string;
} 