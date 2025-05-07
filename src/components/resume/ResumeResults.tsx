'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ResumeCustomizationResult } from '@/types/resume';
import { getDownloadPdfUrl, getViewPdfUrl } from '@/lib/resume-service';
import { Download, FileText, RefreshCw } from 'lucide-react';

interface ResumeResultsProps {
  result: ResumeCustomizationResult;
  onReset: () => void;
}

export function ResumeResults({ result, onReset }: ResumeResultsProps) {
  const viewPdfUrl = result.pdf_path || result.s3_url 
    ? getViewPdfUrl(result.pdf_path, result.s3_url)
    : '';
    
  const downloadPdfUrl = result.pdf_path || result.s3_url 
    ? getDownloadPdfUrl(result.pdf_path, result.s3_url)
    : '';

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-black">Resume Customization Results</h2>
        <Button onClick={onReset} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Start Over
        </Button>
      </div>

      {/* PDF Preview and Download */}
      {viewPdfUrl && (
        <div className="backdrop-blur-md bg-white/30 p-6 rounded-xl border border-white/50 shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-black">Resume Preview</h3>
          <div className="aspect-[8.5/11] w-full bg-white mb-4 overflow-hidden rounded-lg shadow-inner">
            <iframe 
              src={viewPdfUrl}
              className="w-full h-full"
              title="Resume Preview"
            />
          </div>
          <div className="flex justify-center gap-4">
            <a 
              href={downloadPdfUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 gap-2"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </a>
          </div>
        </div>
      )}

      {/* Skills Analysis */}
      <div className="backdrop-blur-md bg-white/30 p-6 rounded-xl border border-white/50 shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-black">Skills Analysis</h3>
        
        <div className="space-y-4">
          {/* Matched Skills */}
          <div>
            <h4 className="font-semibold text-black">Matched Skills</h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {result.skills_analysis && result.skills_analysis.matched_skills ? 
                result.skills_analysis.matched_skills.map((skill, index) => (
                  <span 
                    key={index}
                    className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
                  >
                    {skill}
                  </span>
                )) : (
                  <span className="text-sm text-gray-500">No matched skills found</span>
                )
              }
            </div>
          </div>
          
          {/* Missing Skills */}
          <div>
            <h4 className="font-semibold text-black">Missing Skills</h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {result.skills_analysis && result.skills_analysis.missing_skills ?
                result.skills_analysis.missing_skills.map((skill, index) => (
                  <span 
                    key={index}
                    className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
                  >
                    {skill}
                  </span>
                )) : (
                  <span className="text-sm text-gray-500">No missing skills found</span>
                )
              }
            </div>
          </div>
        </div>
      </div>

      {/* Talking Points */}
      {result.talking_points && result.talking_points.length > 0 && (
        <div className="backdrop-blur-md bg-white/30 p-6 rounded-xl border border-white/50 shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-black">Interview Talking Points</h3>
          <ul className="space-y-2 list-disc pl-5">
            {result.talking_points.map((point, index) => (
              <li key={index} className="text-black">{point}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Customized Sections */}
      {result.customized_sections && result.customized_sections.length > 0 && (
        <div className="backdrop-blur-md bg-white/30 p-6 rounded-xl border border-white/50 shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-black">Customized Sections</h3>
          <div className="space-y-6">
            {result.customized_sections.map((section, index) => (
              <div key={index}>
                <h4 className="font-semibold text-black">{section.title}</h4>
                <Separator className="my-2" />
                <div className="whitespace-pre-wrap text-black">{section.content}</div>
                
                {section.original_content && (
                  <div className="mt-4">
                    <details className="bg-white/20 p-3 rounded-lg">
                      <summary className="cursor-pointer font-medium">Original Content</summary>
                      <div className="mt-2 whitespace-pre-wrap text-gray-700">{section.original_content}</div>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 