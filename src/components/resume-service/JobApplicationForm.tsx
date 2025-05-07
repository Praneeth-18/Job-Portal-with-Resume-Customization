import React, { useState } from 'react';
import GlassCard from './GlassCard';
import GlassButton from './GlassButton';

interface JobApplicationFormProps {
  onSubmit: (jobDescription: string, resumeFile: File) => Promise<void>;
  isLoading: boolean;
}

const JobApplicationForm: React.FC<JobApplicationFormProps> = ({ onSubmit, isLoading }) => {
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
    <GlassCard className="p-8 max-w-4xl mx-auto backdrop-blur-xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="jobDescription" className="block mb-2 font-medium text-white">
            Job Description
          </label>
          <textarea
            id="jobDescription"
            rows={8}
            className="w-full p-3 layered bg-layer border-border outline-none focus:border-accent focus:ring-1 focus:ring-accent rounded-ios text-white"
            placeholder="Paste the job description here"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            required
          />
        </div>
        
        <div>
          <label htmlFor="resumeFile" className="block mb-2 font-medium text-white">
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
              className="layered cursor-pointer p-3 flex-1 text-center text-white rounded-ios"
            >
              {resumeFile ? resumeFile.name : 'Click to select your resume PDF'}
            </label>
            {resumeFile && (
              <button 
                type="button" 
                className="layered p-2 bg-red-500/20 hover:bg-red-500/30 rounded-ios text-white"
                onClick={() => setResumeFile(null)}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <GlassButton 
            type="submit" 
            className={`text-lg py-3 px-12 rounded-ios text-white ${isLoading ? 'bg-green-500/40 hover:bg-green-500/50' : 'bg-accent hover:brightness-110'}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Resume...
              </span>
            ) : 'Process Resume'}
          </GlassButton>
        </div>
      </form>
    </GlassCard>
  );
};

export default JobApplicationForm; 