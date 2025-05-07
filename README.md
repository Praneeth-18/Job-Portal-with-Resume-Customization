# Job Portal Application

A comprehensive job portal application with job listings, application tracking, and resume customization features.

## Features

- Job listings with filtering and search
- Job application tracking
- H1B visa sponsorship filter
- New grad job filter
- Resume customization with AI
- PDF resume generation

## Project Structure

- `src/` - Next.js frontend application
- `scripts/` - Backend scripts for job data processing
- `resume-service/` - Resume customization microservice

## Setup and Running Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL
- Python 3.11 (for resume service)
- LaTeX (for PDF generation in resume service)

### Step 1: Database Setup

1. Ensure PostgreSQL is running
2. Create a database named `joblistingsportal`
3. Run the database setup script:
   ```bash
   psql -U your_username -d joblistingsportal -f create_tables.sql
   ```

### Step 2: Environment Setup

1. Create a `.env.local` file in the root directory:
   ```
   RESUME_SERVICE_URL=http://localhost:8000
   ```

2. Ensure your database connection string is correctly set in the scripts

### Step 3: Start the Resume Service Backend

1. Navigate to the resume service backend directory:
   ```bash
   cd resume-service/backend
   ```

2. Create and activate a Python 3.11 virtual environment:
   ```bash
   # macOS/Linux
   python3.11 -m venv .venv
   source .venv/bin/activate
   
   # Windows
   py -3.11 -m venv .venv
   .venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your-api-key-here
   ```

5. Start the backend server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### Step 4: Start the Job Scheduler

In a new terminal window:

```bash
./run_job_scheduler.sh
```

This script will:
- Fetch new job listings from various sources
- Process and store them in the database
- Run on a schedule to keep job listings up to date

### Step 5: Run the Apply Link Fetcher (Optional)

In another terminal window:

```bash
./fetch_actual_links.sh
```

This script will:
- Process job listings to find the actual application links
- Update the database with direct application URLs

### Step 6: Start the Frontend Application

In another terminal window:

```bash
npm install
npm run dev
```

The application will be available at http://localhost:3000

## Usage

1. **Browse Jobs**: Visit the dashboard to see all job listings
2. **Apply to Jobs**: Click "Apply" on any job listing
3. **Track Applications**: View your applications in the "My Applications" section
4. **Customize Resume**: Upload your resume and a job description in the "Resume" section to get AI-powered customization

## Troubleshooting

### Frontend Issues
- Check browser console for errors
- Ensure all API endpoints are responding correctly

### Job Scheduler Issues
- Check `job_scheduler.log` for errors
- Verify database connection

### Resume Service Issues
- Ensure Python 3.11 is being used
- Check `app.log` in the resume-service/backend directory
- Verify OpenAI API key is valid

## Development

To contribute to this project:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request
