import { NextResponse } from 'next/server';

// Environment variable for resume service, defaulting to localhost for development
const RESUME_SERVICE_URL = process.env.RESUME_SERVICE_URL || 'http://localhost:8000';

export async function GET(req: Request) {
  try {
    console.log('LaTeX view route called');
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path');
    const s3Url = searchParams.get('s3_url');
    
    console.log('Parameters:', { path, s3Url });
    
    if (!path && !s3Url) {
      console.error('Missing required parameters');
      return NextResponse.json(
        { error: 'Either path or s3_url parameter is required', redirect: 'https://www.overleaf.com/upload' },
        { status: 400 }
      );
    }
    
    // Build the query parameters
    const queryParams = new URLSearchParams();
    if (path) queryParams.append('path', path);
    if (s3Url) queryParams.append('s3_url', s3Url);
    
    // Create the complete URL
    const requestUrl = `${RESUME_SERVICE_URL}/view-latex/?${queryParams.toString()}`;
    console.log('Forwarding request to:', requestUrl);
    
    // Simple timeout for the fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout - shorter for faster fallback
    
    try {
      // Forward the request to view the LaTeX
      const response = await fetch(
        requestUrl,
        { 
          method: 'GET',
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      // If the response is not successful, return a redirect URL to Overleaf upload
      if (!response.ok) {
        console.error(`LaTeX view error: ${response.status}`);
        return NextResponse.json(
          { error: `Could not retrieve LaTeX content`, redirect: 'https://www.overleaf.com/upload' },
          { status: 502 }
        );
      }
      
      // Get the LaTeX content
      const latexContent = await response.text();
      
      // If we get empty content, return a redirect URL to Overleaf upload
      if (!latexContent || latexContent.trim() === '') {
        console.error('Empty LaTeX content received');
        return NextResponse.json(
          { error: 'Empty LaTeX content received', redirect: 'https://www.overleaf.com/upload' },
          { status: 500 }
        );
      }
      
      // Return the LaTeX with the correct content type
      return new NextResponse(latexContent, {
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      console.error('Fetch error:', fetchError.message || 'Unknown fetch error');
      
      // Always return a redirect URL to Overleaf upload in case of errors
      return NextResponse.json(
        { 
          error: fetchError.name === 'AbortError' ? 'Request timed out' : 'Failed to fetch LaTeX',
          redirect: 'https://www.overleaf.com/upload'
        },
        { status: 503 }
      );
    }
  } catch (error: any) {
    console.error('Error viewing LaTeX:', error.message || 'Unknown error');
    
    // Always return a redirect URL to Overleaf upload in case of errors
    return NextResponse.json(
      { error: 'Failed to process LaTeX request', redirect: 'https://www.overleaf.com/upload' },
      { status: 500 }
    );
  }
} 