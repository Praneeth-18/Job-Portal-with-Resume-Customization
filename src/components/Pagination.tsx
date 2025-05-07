'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // Calculate range of pages to show
  const getPageRange = () => {
    const range = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      range.push(i);
    }
    
    return range;
  };
  
  const pageRange = getPageRange();
  
  return (
    <nav className="flex justify-center">
      <ul className="flex space-x-1.5">
        {/* Previous Button */}
        <li>
          <button
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`flex items-center justify-center px-3 py-2 rounded-ios text-sm backdrop-blur-xl
                      ${currentPage === 1 
                        ? 'bg-layer/50 text-white/40 opacity-50 cursor-not-allowed' 
                        : 'bg-layer text-white hover:bg-card transition-all'} `}
            aria-label="Previous Page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </li>
        
        {/* Page 1 (if not in range) */}
        {pageRange[0] > 1 && (
          <>
            <li>
              <button
                onClick={() => onPageChange(1)}
                className="flex items-center justify-center w-10 h-10 rounded-ios text-sm 
                        bg-layer text-white hover:bg-card transition-all backdrop-blur-xl"
              >
                1
              </button>
            </li>
            {pageRange[0] > 2 && (
              <li className="flex items-center">
                <span className="px-1 text-white">···</span>
              </li>
            )}
          </>
        )}
        
        {/* Page Numbers */}
        {pageRange.map((page) => (
          <li key={page}>
            <button
              onClick={() => onPageChange(page)}
              className={`flex items-center justify-center w-10 h-10 rounded-ios text-sm transition-all backdrop-blur-xl
                        ${currentPage === page 
                          ? 'bg-accent text-white font-medium shadow-sm' 
                          : 'bg-layer text-white hover:bg-card'}`}
            >
              {page}
            </button>
          </li>
        ))}
        
        {/* Last Page (if not in range) */}
        {pageRange[pageRange.length - 1] < totalPages && (
          <>
            {pageRange[pageRange.length - 1] < totalPages - 1 && (
              <li className="flex items-center">
                <span className="px-1 text-white">···</span>
              </li>
            )}
            <li>
              <button
                onClick={() => onPageChange(totalPages)}
                className="flex items-center justify-center w-10 h-10 rounded-ios text-sm 
                        bg-layer text-white hover:bg-card transition-all backdrop-blur-xl"
              >
                {totalPages}
              </button>
            </li>
          </>
        )}
        
        {/* Next Button */}
        <li>
          <button
            onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`flex items-center justify-center px-3 py-2 rounded-ios text-sm backdrop-blur-xl
                      ${currentPage === totalPages 
                        ? 'bg-layer/50 text-white/40 opacity-50 cursor-not-allowed' 
                        : 'bg-layer text-white hover:bg-card transition-all'}`}
            aria-label="Next Page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </li>
      </ul>
    </nav>
  );
} 