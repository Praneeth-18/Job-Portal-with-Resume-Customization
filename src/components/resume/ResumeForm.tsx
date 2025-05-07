'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Upload } from 'lucide-react';

interface ResumeFormProps {
  onSubmit: (jobDescription: string, resumeFile: File) => Promise<void>;
  isLoading: boolean;
}

export function ResumeForm({ onSubmit, isLoading }: ResumeFormProps) {
  const [jobDescription, setJobDescription] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription || !resumeFile) {
      alert('Please provide both a job description and a resume file');
      return;
    }
    
    try {
      await onSubmit(jobDescription, resumeFile);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <div className="backdrop-blur-md bg-white/30 p-6 rounded-xl border border-white/50 shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="jobDescription" className="block mb-2 font-medium text-black">
            Job Description
          </label>
          <textarea
            id="jobDescription"
            rows={8}
            className="w-full p-3 backdrop-blur-md bg-white/20 border border-white/30 rounded-lg text-black outline-none focus:border-white/50"
            placeholder="Paste the job description here"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            required
          />
        </div>
        
        <div>
          <label htmlFor="resumeFile" className="block mb-2 font-medium text-black">
            Upload Resume (PDF)
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              id="resumeFile"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              required
            />
            <label 
              htmlFor="resumeFile" 
              className="flex-1 cursor-pointer p-3 backdrop-blur-md bg-white/20 border border-white/30 rounded-lg text-black text-center"
            >
              {resumeFile ? resumeFile.name : 'Click to select your resume PDF'}
            </label>
            {resumeFile && (
              <Button 
                type="button" 
                variant="destructive"
                onClick={() => setResumeFile(null)}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <Button 
            type="submit" 
            disabled={isLoading}
            className="px-8 py-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Process Resume
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 