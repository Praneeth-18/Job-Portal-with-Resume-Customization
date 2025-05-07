# Resume Service Integration

This document describes how to set up and run the resume service integration for the job portal.

## Overview

The resume service consists of two parts:
1. A Python backend that processes resumes and job descriptions using AI
2. A frontend integration in our Next.js job portal application

## Setup Instructions

### 1. Python Backend Setup

The backend requires Python 3.11. Follow these steps to set it up:

1. Navigate to the backend directory:
   ```bash
   cd resume-service/backend
   ```

2. Create a Python 3.11 virtual environment:
   ```bash
   # macOS/Linux
   python3.11 -m venv .venv
   
   # Windows
   py -3.11 -m venv .venv
   ```

3. Activate the virtual environment:
   ```bash
   # macOS/Linux
   source .venv/bin/activate
   
   # Windows
   .venv\Scripts\activate
   ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your-api-key-here
   ```

6. Start the backend server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

   The API will be available at: http://localhost:8000

### 2. Frontend Integration

The frontend integration is already set up in the job portal application. It communicates with the Python backend via API endpoints.

To configure the frontend:

1. Create or modify the `.env.local` file in the root directory of the job portal:
   ```
   RESUME_SERVICE_URL=http://localhost:8000
   ```

2. Start the Next.js development server:
   ```bash
   npm run dev
   ```

3. Access the resume customization feature at: http://localhost:3000/resume

## API Endpoints

The job portal exposes these API endpoints to proxy requests to the Python backend:

- `POST /api/resume` - Customize a resume for a job description
- `GET /api/resume` - View a PDF resume
- `GET /api/resume/download` - Download a PDF resume

## Troubleshooting

1. **Backend Connection Issues**:
   - Ensure the Python backend is running on port 8000
   - Check that the RESUME_SERVICE_URL environment variable is set correctly

2. **PDF Generation Issues**:
   - Ensure LaTeX is installed on the system running the Python backend
   - Check the backend logs for detailed error messages

3. **API Errors**:
   - Check the browser console and network tab for error details
   - Examine the backend logs for more information

## Dependencies

- Python 3.11
- OpenAI API key
- LaTeX (for PDF generation)
- Node.js 18+ (for the frontend)

## Credits

This integration uses the resume customization service developed by the resume team. 