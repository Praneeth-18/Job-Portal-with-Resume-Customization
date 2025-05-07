import { CustomizeResumeResponse } from '@/types/resume-service';

// Use the API_BASE_URL from environment or proxy through our own API
const API_BASE_URL = '/api/resume';

/**
 * Customize resume with job description and resume
 */
export const customizeResume = async (jobDescription: string, resumeFile: File): Promise<CustomizeResumeResponse> => {
  const formData = new FormData();
  formData.append('job_description_text', jobDescription);
  formData.append('resume', resumeFile);

  const response = await fetch(`${API_BASE_URL}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to customize resume');
  }

  return response.json();
};

export const getApiBaseUrl = (): string => {
  return API_BASE_URL;
}; 