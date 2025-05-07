'use client';

import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Filter, CheckCircle2, Briefcase, GraduationCap } from 'lucide-react';
import { JobListingCard } from './JobListingCard';
import { JobListingType, JobCategory } from '@/types';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Pagination } from '@/components/Pagination';

// Define CategoryStats type
export type CategoryStats = {
  category: string;
  count: number;
  totalPages: number;
};

interface JobListingsProps {
  jobs: JobListingType[];
  totalPages: number;
  currentPage: number;
  allCategories: string[];
  selectedCategory: string;
  categoryStats?: CategoryStats[]; // Optional for backward compatibility
}

export function JobListings({ 
  jobs, 
  totalPages, 
  currentPage, 
  allCategories, 
  selectedCategory,
  categoryStats = []
}: JobListingsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState({
    search: '',
    category: selectedCategory || 'Software Engineering',
    showH1b: false,
    showNewGrad: false,
    h1bSponsored: false,
    isNewGrad: false,
  });
  
  const [appliedJobs, setAppliedJobs] = useState<{[key: string]: boolean}>({});
  const [hideApplied, setHideApplied] = useState(false);

  // Update filters when selectedCategory changes
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      category: selectedCategory || 'Software Engineering'
    }));
  }, [selectedCategory]);
  
  // Load applied jobs from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadAppliedJobs = () => {
        const applied: {[key: string]: boolean} = {};
        
        // Loop through localStorage to find applied jobs
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('job_applied_')) {
            const jobId = key.replace('job_applied_', '');
            applied[jobId] = true;
          }
        }
        
        setAppliedJobs(applied);
      };
      
      loadAppliedJobs();
      
      // Add event listener to update when localStorage changes
      window.addEventListener('storage', loadAppliedJobs);
      
      return () => {
        window.removeEventListener('storage', loadAppliedJobs);
      };
    }
  }, []);

  // Log category stats for debugging
  useEffect(() => {
    if (categoryStats.length > 0) {
      console.log('Category Stats:', categoryStats);
      console.log('Selected Category:', selectedCategory);
      const stat = categoryStats.find(s => s.category === selectedCategory);
      if (stat) {
        console.log(`Found ${stat.count} jobs for ${selectedCategory} with ${stat.totalPages} pages`);
      }
    }
  }, [categoryStats, selectedCategory]);

  // Get category count from categoryStats
  const getCategoryCount = (category: string): number => {
    const stat = categoryStats.find(s => s.category === category);
    return stat ? stat.count : 0;
  };

  // Get total items to display count
  const getDisplayCount = (): number => {
    if (selectedCategory) {
      return getCategoryCount(selectedCategory);
    }
    return jobs.length;
  };

  // Function to calculate the range of jobs being displayed
  const getJobRange = () => {
    const itemsPerPage = 200; // This should match your backend ITEMS_PER_PAGE
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, getCategoryCount(selectedCategory));
    return { start, end };
  };

  // Function to handle category change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value;
    
    // Create new URLSearchParams object
    const params = new URLSearchParams(searchParams.toString());
    // Update category and reset to page 1
    params.set('category', newCategory);
    params.set('page', '1');
    
    // Navigate to new URL with updated parameters
    router.push(`${pathname}?${params.toString()}`);
  };

  // Function to handle pagination
  const goToPage = (page: number) => {
    // Create new URLSearchParams object
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    if (selectedCategory) {
      params.set('category', selectedCategory);
    }
    
    // Navigate to new URL with updated parameters
    router.push(`${pathname}?${params.toString()}`);
  };

  // Function to handle H1B button click
  const handleH1BFilterClick = () => {
    router.push('/h1b-jobs');
  };

  // Function to handle New Grad button click
  const handleNewGradFilterClick = () => {
    router.push('/new-grad');
  };
  
  // Function to toggle hide applied jobs
  const toggleHideApplied = () => {
    setHideApplied(!hideApplied);
  };

  // Filter jobs based on applied status
  const filteredJobs = jobs.filter(job => {
    // Hide job if it's been applied to and hideApplied is true
    if (hideApplied && appliedJobs[job.id.toString()]) {
      return false;
    }
    
    // Client-side search filter
    if (filters.search && !job.positionTitle?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !job.company?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-8">
      {/* Search and filters section with section-card styling */}
      <div className="section-card">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center mb-4">
          <div className="flex flex-col md:flex-row gap-4 w-full">
            {/* Category Selector - Glassmorphism style */}
            <div className="w-full md:w-1/3">
              <label htmlFor="category" className="block text-sm font-medium text-white mb-2">
                Job Category
              </label>
              <div className="relative">
                <select
                  id="category"
                  className="w-full pl-4 pr-10 py-3 text-base text-white bg-layer
                            border-none rounded-ios focus:outline-none focus:ring-2 focus:ring-accent 
                            shadow-sm transition-all backdrop-blur-xl"
                  value={filters.category}
                  onChange={handleCategoryChange}
                >
                  {allCategories.map((category) => (
                    <option key={category} value={category} className="bg-gray-800 text-white">
                      {category} ({getCategoryCount(category)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Search Box - Glassmorphism style */}
            <div className="w-full md:w-2/3">
              <label htmlFor="search" className="block text-sm font-medium text-white mb-2">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  className="block w-full pl-10 pr-4 py-3 text-base text-white bg-layer
                           border-none rounded-ios focus:outline-none focus:ring-2 focus:ring-accent
                           shadow-sm transition-all backdrop-blur-xl"
                  placeholder="Search by title or company"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filter buttons - Glassmorphism style */}
        <div className="flex flex-wrap gap-3 mt-4">
          <button
            onClick={handleH1BFilterClick}
            className="flex items-center gap-2 px-4 py-2 bg-layer btn-h1b text-white font-medium rounded-ios 
                     backdrop-blur-xl shadow-sm transition-all"
          >
            <Briefcase className="h-4 w-4" />
            H1B Jobs
          </button>
          
          <button
            onClick={handleNewGradFilterClick}
            className="flex items-center gap-2 px-4 py-2 bg-layer btn-newgrad text-white font-medium rounded-ios
                     backdrop-blur-xl shadow-sm transition-all"
          >
            <GraduationCap className="h-4 w-4" />
            New Grad
          </button>
          
          <button
            onClick={toggleHideApplied}
            className={`flex items-center gap-2 px-4 py-2 
                       ${hideApplied ? 'bg-green-500/40' : 'bg-layer'} 
                       text-white font-medium rounded-ios backdrop-blur-xl shadow-sm
                       hover:${hideApplied ? 'bg-green-500/50' : 'bg-card'} transition-all`}
          >
            <CheckCircle2 className="h-4 w-4" />
            {hideApplied ? 'Showing All Jobs' : 'Hide Applied Jobs'}
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="flex justify-between items-center">
        <p className="text-white">
          {filteredJobs.length > 0 ? (
            <>
              Showing <span className="font-medium">{getJobRange().start}-{getJobRange().end}</span> of {getDisplayCount()} jobs in {filters.category}
            </>
          ) : (
            `No jobs found in ${filters.category}`
          )}
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          </div>
        )}
      </div>

      {/* Job listings grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.map((job) => (
          <JobListingCard key={job.id} job={job} />
        ))}
      </div>

      {/* Empty state */}
      {filteredJobs.length === 0 && (
        <div className="section-card text-center py-10">
          <p className="text-white text-lg mb-4">No matching jobs found</p>
          <button
            onClick={() => setFilters({ ...filters, search: '' })}
            className="px-4 py-2 bg-accent text-white font-medium rounded-ios"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Bottom pagination for mobile */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 md:hidden">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        </div>
      )}
    </div>
  );
} 