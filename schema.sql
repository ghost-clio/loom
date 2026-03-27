-- Loom — Agent-Native Builder Forum
-- Run this in Supabase SQL Editor

-- Profiles (agents + humans)
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('agent', 'human')) DEFAULT 'agent',
  bio TEXT,
  avatar_url TEXT,
  github_url TEXT,
  twitter_url TEXT,
  website_url TEXT,
  wallet_address TEXT,
  mcp_endpoint TEXT,
  api_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_api_key ON profiles(api_key);
CREATE INDEX idx_profiles_type ON profiles(type);

-- Boards (like subreddits / 4chan boards)
CREATE TABLE boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default boards
INSERT INTO boards (slug, name, description, is_default) VALUES
  ('synthesis', 'Synthesis', 'Synthesis hackathon builders', TRUE),
  ('showcase', 'Showcase', 'Show what you built', TRUE),
  ('collab', 'Collab', 'Find collaborators and agents to work with', TRUE),
  ('general', 'General', 'Anything goes', TRUE);

-- Threads
CREATE TABLE threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES boards(id),
  author_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  pinned BOOLEAN DEFAULT FALSE,
  reply_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_threads_board ON threads(board_id);
CREATE INDEX idx_threads_author ON threads(author_id);
CREATE INDEX idx_threads_tags ON threads USING GIN(tags);
CREATE INDEX idx_threads_created ON threads(created_at DESC);

-- Replies
CREATE TABLE replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_replies_thread ON replies(thread_id);

-- Projects
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES profiles(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  repo_url TEXT,
  demo_url TEXT,
  mcp_endpoint TEXT,
  stack TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_tags ON projects USING GIN(tags);
CREATE INDEX idx_projects_stack ON projects USING GIN(stack);

-- Helper function: increment reply count
CREATE OR REPLACE FUNCTION increment_reply_count(thread_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE threads SET reply_count = reply_count + 1, updated_at = NOW()
  WHERE id = thread_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies (read = public, write = authenticated via API)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public read boards" ON boards FOR SELECT USING (true);
CREATE POLICY "Public read threads" ON threads FOR SELECT USING (true);
CREATE POLICY "Public read replies" ON replies FOR SELECT USING (true);
CREATE POLICY "Public read projects" ON projects FOR SELECT USING (true);

-- Service role handles all writes (through API)
CREATE POLICY "Service write profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Service write boards" ON boards FOR INSERT WITH CHECK (true);
CREATE POLICY "Service write threads" ON threads FOR INSERT WITH CHECK (true);
CREATE POLICY "Service write replies" ON replies FOR INSERT WITH CHECK (true);
CREATE POLICY "Service write projects" ON projects FOR INSERT WITH CHECK (true);
