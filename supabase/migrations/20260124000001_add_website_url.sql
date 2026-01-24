-- Cursive Platform - Add Website URL to Workspaces
-- Migration to support website URL in onboarding and website scraping

-- Add website_url column to workspaces
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Add company_description column for scraped data
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS company_description TEXT;

-- Add industry_keywords column for scraped data
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS industry_keywords TEXT[];

-- Add scrape_status column to track website scraping
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS scrape_status TEXT DEFAULT 'pending';

-- Add index for website_url
CREATE INDEX IF NOT EXISTS idx_workspaces_website_url ON workspaces(website_url) WHERE website_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN workspaces.website_url IS 'Company website URL entered during onboarding';
COMMENT ON COLUMN workspaces.company_description IS 'Company description scraped from website';
COMMENT ON COLUMN workspaces.industry_keywords IS 'Industry keywords extracted from website';
COMMENT ON COLUMN workspaces.scrape_status IS 'Website scrape status: pending, processing, completed, failed';
