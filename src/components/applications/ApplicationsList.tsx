'use client';

import { useState, useEffect } from 'react';
import { UserApplication, JobListing, ApplicationStatusHistory } from '@prisma/client';
import { format } from 'date-fns';
import { Building2, MapPin, Calendar, ChevronDown, Filter } from 'lucide-react';

type ApplicationWithDetails = UserApplication & {
  jobListing: JobListing;
  statusHistory: ApplicationStatusHistory[];
};

interface ApplicationsListProps {
  applications: ApplicationWithDetails[];
}

const STATUS_OPTIONS = ['Applied', 'Interviewing', 'Rejected', 'Offer Received'];

export function ApplicationsList({ applications }: ApplicationsListProps) {
  const [expandedTimelines, setExpandedTimelines] = useState<Record<number, boolean>>({});
  const [filters, setFilters] = useState({
    status: '',
    category: '',
  });
  const [filteredApplications, setFilteredApplications] = useState<ApplicationWithDetails[]>(applications);

  // Extract unique categories from job listings for all application categories
  const availableCategories = (() => {
    // Get categories from the applications
    const appCategories = new Set<string>();
    applications.forEach(app => {
      if (app.jobListing.jobCategory) {
        appCategories.add(app.jobListing.jobCategory);
      }
    });
    
    return Array.from(appCategories).sort();
  })();

  // Calculate status counts
  const statusCounts = (() => {
    const counts: Record<string, number> = {};
    STATUS_OPTIONS.forEach(status => counts[status] = 0);
    
    applications.forEach(app => {
      if (app.currentStatus) {
        counts[app.currentStatus] = (counts[app.currentStatus] || 0) + 1;
      }
    });
    
    return counts;
  })();

  // Filter applications based on selected filters
  useEffect(() => {
    let result = [...applications];
    
    if (filters.status) {
      result = result.filter(app => app.currentStatus === filters.status);
    }
    
    if (filters.category) {
      result = result.filter(app => app.jobListing.jobCategory === filters.category);
    }
    
    setFilteredApplications(result);
  }, [applications, filters]);

  const toggleTimeline = (applicationId: number) => {
    setExpandedTimelines((prev) => ({
      ...prev,
      [applicationId]: !prev[applicationId],
    }));
  };

  const handleStatusChange = async (applicationId: number, newStatus: string) => {
    try {
      const response = await fetch('/api/applications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update application status. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Status counts */}
      <div className="section-card">
        <div className="grid grid-cols-5 gap-4">
          {STATUS_OPTIONS.map(status => (
            <div 
              key={status} 
              className={`flex flex-col items-center p-3 rounded-ios-lg backdrop-blur-xl w-full h-24 justify-center ${
                status === 'Interviewing' ? 'bg-blue-500/20' : 
                status === 'Rejected' ? 'bg-red-500/20' : 
                status === 'Offer Received' ? 'bg-green-500/20' : 
                'bg-gray-500/20'
              }`}
            >
              <div className="text-2xl font-bold text-white">{statusCounts[status] || 0}</div>
              <div className="text-sm text-white/80">{status}</div>
            </div>
          ))}
          <div className="flex flex-col items-center p-3 rounded-ios-lg backdrop-blur-xl bg-orange-500/20 w-full h-24 justify-center">
            <div className="text-2xl font-bold text-white">{applications.length}</div>
            <div className="text-sm text-white/80">Total</div>
          </div>
        </div>
      </div>
      
      {/* Filter controls */}
      <div className="section-card">
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-white mb-1">Filter by Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full rounded-ios-lg px-3 py-2 text-sm font-medium text-white bg-card border-none backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          
          {availableCategories.length > 0 && (
            <div className="flex flex-col">
              <label className="text-sm font-medium text-white mb-1">Filter by Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-ios-lg px-3 py-2 text-sm font-medium text-white bg-card border-none backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">All Categories</option>
                {availableCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="flex items-end">
            <button 
              onClick={() => setFilters({ status: '', category: '' })}
              className="rounded-ios-lg bg-card border-none backdrop-blur-xl px-4 py-2 text-sm font-medium text-white hover:bg-accent/30 transition-all focus:outline-none focus:ring-2 focus:ring-accent"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>
      
      {/* Active filters display */}
      {(filters.status || filters.category) && (
        <div className="flex items-center gap-2 text-sm text-white section-card py-3">
          <Filter className="h-4 w-4" />
          <span>Showing: </span>
          {filters.status && <span className="font-medium">{filters.status}</span>}
          {filters.status && filters.category && <span> in </span>}
          {filters.category && <span className="font-medium">{filters.category}</span>}
          <span> ({filteredApplications.length} applications)</span>
        </div>
      )}

      {/* Applications list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredApplications.map((application) => {
          // Determine gradient colors based on status
          const getStatusColors = () => {
            switch(application.currentStatus) {
              case 'Interviewing':
                return 'from-blue-400/40 to-blue-500/30';
              case 'Rejected':
                return 'from-red-400/40 to-red-500/30';
              case 'Offer Received':
                return 'from-green-400/40 to-green-500/30';
              default: // Applied
                return 'from-gray-400/40 to-gray-500/30';
            }
          };
          
          return (
            <div
              key={application.id}
              className={`rounded-ios-lg bg-card backdrop-blur-xl p-5 shadow-lg 
                          hover:shadow-xl hover:translate-y-[-8px] transition-all duration-300 ease-in-out
                          bg-gradient-to-br ${getStatusColors()}`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-white">
                      {application.jobListing.positionTitle}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-sm text-white">
                      <Building2 className="h-4 w-4" />
                      <span>{application.jobListing.company}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {application.jobListing.jobCategory && (
                        <span className="inline-block bg-layer backdrop-blur-xl rounded-ios px-3 py-1 text-xs font-medium text-white">
                          {application.jobListing.jobCategory}
                        </span>
                      )}
                      
                      {/* Status badge */}
                      <span className={`inline-block backdrop-blur-xl px-3 py-1 text-xs font-medium rounded-ios
                                      ${application.currentStatus === 'Interviewing' ? 'bg-blue-500/70 text-white' : 
                                        application.currentStatus === 'Rejected' ? 'bg-red-500/70 text-white' :
                                        application.currentStatus === 'Offer Received' ? 'bg-green-500/70 text-white' :
                                        'bg-gray-500/70 text-white'}`}>
                        {application.currentStatus}
                      </span>
                    </div>
                  </div>
                  <select
                    value={application.currentStatus}
                    onChange={(e) => handleStatusChange(application.id, e.target.value)}
                    className="rounded-ios-lg bg-layer backdrop-blur-xl px-3 py-2 text-sm font-medium text-white hover:bg-card transition-all"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-white">
                  {application.jobListing.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{application.jobListing.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Applied on {format(new Date(application.appliedAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => toggleTimeline(application.id)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-layer/70 text-white text-sm font-medium rounded-ios hover:bg-layer transition-all"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transform transition-transform ${
                        expandedTimelines[application.id] ? 'rotate-180' : ''
                      }`}
                    />
                    {expandedTimelines[application.id] ? 'Hide' : 'Show'} Timeline
                  </button>
                  
                  <button
                    onClick={() => {
                      const link = application.jobListing.applyLink;
                      if (link) window.open(link, '_blank');
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-accent/30 text-white text-sm font-medium rounded-ios hover:bg-accent/40 transition-all ml-auto"
                  >
                    View Job Details
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-4 w-4" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                      />
                    </svg>
                  </button>
                </div>

                {expandedTimelines[application.id] && (
                  <div className="mt-6 pt-2">
                    <div className="relative">
                      {/* Timeline connector line */}
                      <div className="absolute top-0 bottom-0 left-[10px] w-[2px] bg-gradient-to-b from-accent via-accent/80 to-accent/40"></div>
                      
                      {/* Timeline events */}
                      <div className="space-y-6">
                        {/* Status history entries */}
                        {application.statusHistory.map((history, index) => {
                          // Determine status color
                          const getStatusColor = () => {
                            switch(history.status) {
                              case 'Interviewing': return 'bg-blue-500';
                              case 'Rejected': return 'bg-red-500';
                              case 'Offer Received': return 'bg-green-500';
                              default: return 'bg-gray-500';
                            }
                          };
                          
                          return (
                            <div key={history.id} className="relative flex items-start gap-4 pl-7">
                              {/* Event dot */}
                              <div className={`absolute left-0 top-0 h-5 w-5 rounded-full ${getStatusColor()} shadow-md flex items-center justify-center ring-2 ring-white/20`}>
                                {index === 0 && (
                                  <div className="h-2 w-2 rounded-full bg-white"></div>
                                )}
                              </div>
                              
                              {/* Event content */}
                              <div className="flex-1 glassmorphism bg-white/5 backdrop-blur-md p-3 rounded-ios">
                                <div className="flex justify-between items-start">
                                  <p className="font-medium text-white text-base">{history.status}</p>
                                  <span className="text-xs text-white/70">
                                    {format(new Date(history.changedAt), 'MMM d, yyyy')}
                                  </span>
                                </div>
                                <p className="text-xs text-white/70">
                                  {format(new Date(history.changedAt), 'h:mm a')}
                                </p>
                                {history.notes && (
                                  <p className="mt-2 text-sm text-white/90 bg-white/5 p-2 rounded-md">
                                    {history.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Applied entry at the bottom of the timeline */}
                        <div className="relative flex items-start gap-4 pl-7">
                          {/* Event dot */}
                          <div className="absolute left-0 top-0 h-5 w-5 rounded-full bg-gray-500 shadow-md flex items-center justify-center ring-2 ring-white/20">
                            <div className="h-2 w-2 rounded-full bg-white"></div>
                          </div>
                          
                          {/* Event content */}
                          <div className="flex-1 glassmorphism bg-white/5 backdrop-blur-md p-3 rounded-ios">
                            <div className="flex justify-between items-start">
                              <p className="font-medium text-white text-base">Applied</p>
                              <span className="text-xs text-white/70">
                                {format(new Date(application.appliedAt), 'MMM d, yyyy')}
                              </span>
                            </div>
                            <p className="text-xs text-white/70">
                              {format(new Date(application.appliedAt), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredApplications.length === 0 && (
        <div className="text-center py-12 section-card">
          <p className="text-lg font-medium text-white">No applications found</p>
          <p className="text-white/80 mt-2">Try adjusting your filters or apply for more jobs</p>
        </div>
      )}
    </div>
  );
} 