CREATE TABLE IF NOT EXISTS job_listings (
    id SERIAL PRIMARY KEY,
    position_title VARCHAR(255) NOT NULL,
    posting_date DATE,
    apply_link TEXT,
    work_model VARCHAR(50),
    location TEXT,
    company VARCHAR(255),
    company_size VARCHAR(50),
    company_industry VARCHAR(255),
    salary TEXT,
    qualifications TEXT,
    h1b_sponsored BOOLEAN NOT NULL DEFAULT FALSE,
    is_new_grad BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    content_hash TEXT NOT NULL,
    UNIQUE(position_title, company, posting_date, content_hash)
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_job_listings_updated_at
    BEFORE UPDATE ON job_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a table to track CSV processing history if it doesn't exist
CREATE TABLE IF NOT EXISTS csv_processing_history (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50),
    records_processed INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_inserted INTEGER DEFAULT 0,
    error_message TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_job_listings_content_hash ON job_listings(content_hash);
CREATE INDEX IF NOT EXISTS idx_job_listings_is_active ON job_listings(is_active);
CREATE INDEX IF NOT EXISTS idx_job_listings_last_seen_at ON job_listings(last_seen_at);

-- New table for user applications
CREATE TABLE IF NOT EXISTS user_applications (
    id SERIAL PRIMARY KEY,
    job_listing_id INTEGER REFERENCES job_listings(id),
    user_id VARCHAR(255) NOT NULL, -- We'll use this later for auth
    current_status VARCHAR(50) NOT NULL DEFAULT 'Applied',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    UNIQUE(job_listing_id, user_id)
);

-- Create an enum type for application status
CREATE TYPE application_status AS ENUM ('Applied', 'Interviewing', 'Rejected', 'Offer Received');

-- Table to track application status history
CREATE TABLE IF NOT EXISTS application_status_history (
    id SERIAL PRIMARY KEY,
    user_application_id INTEGER REFERENCES user_applications(id),
    status application_status NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Trigger to update user_applications updated_at
CREATE OR REPLACE FUNCTION update_application_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_applications_updated_at
    BEFORE UPDATE ON user_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_application_updated_at();

-- Trigger to automatically add status changes to history
CREATE OR REPLACE FUNCTION log_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') OR (OLD.current_status IS DISTINCT FROM NEW.current_status) THEN
        INSERT INTO application_status_history (user_application_id, status, notes)
        VALUES (NEW.id, NEW.current_status::application_status, NEW.notes);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_application_status_changes
    AFTER INSERT OR UPDATE ON user_applications
    FOR EACH ROW
    EXECUTE FUNCTION log_application_status_change();

-- Create indexes for better query performance on new tables
CREATE INDEX IF NOT EXISTS idx_user_applications_user_id ON user_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_applications_status ON user_applications(current_status);
CREATE INDEX IF NOT EXISTS idx_application_history_application_id ON application_status_history(user_application_id); 