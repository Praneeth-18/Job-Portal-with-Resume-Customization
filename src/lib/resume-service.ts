import { ResumeCustomizationResult } from "@/types/resume";

/**
 * Customize a resume for a specific job description
 * 
 * @param jobDescription The job description text
 * @param resumeFile The resume file (PDF)
 * @returns The customization result
 */
export async function customizeResume(
  jobDescription: string,
  resumeFile: File
): Promise<ResumeCustomizationResult> {
  const formData = new FormData();
  formData.append('job_description_text', jobDescription);
  formData.append('resume', resumeFile);

  const response = await fetch('/api/resume', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to customize resume');
  }

  const data = await response.json();
  console.log('Resume customization API response:', data);
  return data;
}

/**
 * Get the URL for viewing a PDF
 * 
 * @param path The path to the PDF file (optional)
 * @param s3Url The S3 URL of the PDF (optional)
 * @returns The URL for viewing the PDF
 */
export function getViewPdfUrl(path?: string, s3Url?: string): string {
  if (!path && !s3Url) {
    throw new Error('Either path or s3Url must be provided');
  }

  const params = new URLSearchParams();
  if (path) params.append('path', path);
  if (s3Url) params.append('s3_url', s3Url);

  return `/api/resume?${params.toString()}`;
}

/**
 * Get the URL for downloading a PDF
 * 
 * @param path The path to the PDF file (optional)
 * @param s3Url The S3 URL of the PDF (optional)
 * @returns The URL for downloading the PDF
 */
export function getDownloadPdfUrl(path?: string, s3Url?: string): string {
  if (!path && !s3Url) {
    throw new Error('Either path or s3Url must be provided');
  }

  const params = new URLSearchParams();
  if (path) params.append('path', path);
  if (s3Url) params.append('s3_url', s3Url);

  return `/api/resume/download?${params.toString()}`;
} 