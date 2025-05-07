import { NextResponse } from 'next/server';

// Environment variable for resume service, defaulting to localhost for development
const RESUME_SERVICE_URL = process.env.RESUME_SERVICE_URL || 'http://localhost:8000';

export async function GET(req: Request) {
  try {
    console.log('PDF download route called');
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
    const requestUrl = `${RESUME_SERVICE_URL}/download-pdf/?${queryParams.toString()}`;
    console.log('Forwarding request to:', requestUrl);
    
    // Forward the request with timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout (increased)
    
    try {
      // Forward the request to download the PDF
      const response = await fetch(
        requestUrl,
        { 
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Accept': 'application/pdf, application/json'
          }
        }
      );
      
      clearTimeout(timeoutId);
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        let errorText = '';
        try {
          // Try to parse as JSON first
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorJson = await response.json();
            errorText = JSON.stringify(errorJson);
            console.error('JSON error response:', errorJson);
          } else {
            errorText = await response.text();
            console.error('Text error response:', errorText);
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          errorText = 'Could not parse error response';
        }
        
        console.error(`PDF download error: ${response.status} ${response.statusText}`, errorText);
        
        return NextResponse.json(
          { error: `PDF download error (${response.status}): ${errorText || response.statusText}` },
          { status: response.status }
        );
      }
      
      // Get the PDF data
      const pdfData = await response.arrayBuffer();
      console.log('PDF data size:', pdfData.byteLength);
      
      if (!pdfData || pdfData.byteLength === 0) {
        console.error('Empty PDF data received');
        return NextResponse.json(
          { error: 'Empty PDF received from the service' },
          { status: 500 }
        );
      }
      
      // Get the filename from the Content-Disposition header or use a default
      const contentDisposition = response.headers.get('Content-Disposition') || 'attachment; filename="resume.pdf"';
      
      // Return the PDF with the correct content type and disposition
      return new NextResponse(pdfData, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': contentDisposition,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('Request timed out');
        return NextResponse.json(
          { error: 'Request to PDF download service timed out' },
          { status: 504 }
        );
      }
      
      console.error('Fetch error details:', fetchError);
      
      return NextResponse.json(
        { error: `Fetch error: ${fetchError.message || 'Unknown fetch error'}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error downloading PDF:', error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error 
      ? `${error.name}: ${error.message}` 
      : 'Unknown error';
    
    return NextResponse.json(
      { error: `Failed to download PDF: ${errorMessage}` },
      { status: 500 }
    );
  }
} 