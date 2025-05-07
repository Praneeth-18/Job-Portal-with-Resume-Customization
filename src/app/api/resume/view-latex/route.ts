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
        { error: 'Either path or s3_url parameter is required' },
        { status: 400 }
      );
    }
    
    // Build the query parameters
    const queryParams = new URLSearchParams();
    if (path) queryParams.append('path', path);
    if (s3Url) queryParams.append('s3_url', s3Url);
    
    // Create the complete URL for debugging
    const requestUrl = `${RESUME_SERVICE_URL}/view-latex/?${queryParams.toString()}`;
    console.log('Forwarding request to:', requestUrl);
    
    // Forward the request to view the LaTeX
    const response = await fetch(requestUrl, { method: 'GET' });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`LaTeX view error: ${response.status} ${response.statusText}`, errorText);
      
      return NextResponse.json(
        { error: `LaTeX view error (${response.status}): ${errorText || response.statusText}` },
        { status: response.status }
      );
    }
    
    // Get the LaTeX content
    const latexContent = await response.text();
    console.log('LaTeX content length:', latexContent.length);
    
    if (!latexContent || latexContent.trim() === '') {
      console.error('Empty LaTeX content received');
      return NextResponse.json(
        { error: 'Empty LaTeX content received from the service' },
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
  } catch (error) {
    console.error('Error viewing LaTeX:', error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error 
      ? `${error.name}: ${error.message}` 
      : 'Unknown error';
    
    return NextResponse.json(
      { error: `Failed to view LaTeX: ${errorMessage}` },
      { status: 500 }
    );
  }
} 