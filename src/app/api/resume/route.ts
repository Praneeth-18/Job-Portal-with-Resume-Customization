import { NextResponse } from 'next/server';

// Environment variable for resume service, defaulting to localhost for development
const RESUME_SERVICE_URL = process.env.RESUME_SERVICE_URL || 'http://localhost:8000';

export async function POST(req: Request) {
  try {
    // Get the multipart form data from the request
    const formData = await req.formData();
    
    console.log('Received resume customization request');
    
    // Forward the request to the resume microservice
    const response = await fetch(`${RESUME_SERVICE_URL}/customize-resume/`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - it will be set automatically with the boundary
    });
    
    // If the microservice returns an error, pass it along
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Resume service error: ${response.status} ${response.statusText}`, errorText);
      
      return NextResponse.json(
        { error: `Resume service error: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    // Get the parsed resume data from the microservice
    const data = await response.json();
    
    // Return the data to the client
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error processing resume:', error);
    
    return NextResponse.json(
      { error: 'Failed to process resume' },
      { status: 500 }
    );
  }
}

// Proxy endpoint for viewing PDFs
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path');
    const s3Url = searchParams.get('s3_url');
    
    if (!path && !s3Url) {
      return NextResponse.json(
        { error: 'Either path or s3_url parameter is required' },
        { status: 400 }
      );
    }
    
    // Build the query parameters
    const queryParams = new URLSearchParams();
    if (path) queryParams.append('path', path);
    if (s3Url) queryParams.append('s3_url', s3Url);
    
    // Forward the request to view the PDF
    const response = await fetch(
      `${RESUME_SERVICE_URL}/view-pdf/?${queryParams.toString()}`,
      { method: 'GET' }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`PDF view error: ${response.status} ${response.statusText}`, errorText);
      
      return NextResponse.json(
        { error: `PDF view error: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    // Get the PDF data
    const pdfData = await response.arrayBuffer();
    
    // Return the PDF with the correct content type
    return new NextResponse(pdfData, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
      },
    });
  } catch (error) {
    console.error('Error viewing PDF:', error);
    
    return NextResponse.json(
      { error: 'Failed to view PDF' },
      { status: 500 }
    );
  }
} 