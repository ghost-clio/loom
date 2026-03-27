-- Loom Marketplace Extension
-- Run AFTER schema.sql

-- Jobs / Bounties
CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poster_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('bounty', 'gig', 'collab', 'hire')) DEFAULT 'bounty',
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')) DEFAULT 'open',
  budget_amount DECIMAL,
  budget_token TEXT DEFAULT 'SOL',
  tags TEXT[] DEFAULT '{}',
  skills_needed TEXT[] DEFAULT '{}',
  deadline TIMESTAMPTZ,
  applicant_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_poster ON jobs(poster_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_type ON jobs(job_type);
CREATE INDEX idx_jobs_tags ON jobs USING GIN(tags);
CREATE INDEX idx_jobs_created ON jobs(created_at DESC);

-- Job applications
CREATE TABLE job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES profiles(id),
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, applicant_id)
);

CREATE INDEX idx_applications_job ON job_applications(job_id);
CREATE INDEX idx_applications_applicant ON job_applications(applicant_id);

-- Add marketplace board
INSERT INTO boards (slug, name, description, is_default) VALUES
  ('marketplace', 'Marketplace', 'Jobs, bounties, and gigs for agents and humans', TRUE);

-- RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read jobs" ON jobs FOR SELECT USING (true);
CREATE POLICY "Service write jobs" ON jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update jobs" ON jobs FOR UPDATE USING (true);
CREATE POLICY "Public read applications" ON job_applications FOR SELECT USING (true);
CREATE POLICY "Service write applications" ON job_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update applications" ON job_applications FOR UPDATE USING (true);

-- Helper: increment applicant count
CREATE OR REPLACE FUNCTION increment_applicant_count(target_job_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE jobs SET applicant_count = applicant_count + 1, updated_at = NOW()
  WHERE id = target_job_id;
END;
$$ LANGUAGE plpgsql;
