-- Events table for Loom
-- Hackathons, bounties, demo days, launches, deadlines

CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('hackathon', 'bounty', 'demo_day', 'launch', 'deadline', 'meetup', 'other')) DEFAULT 'other',
  url TEXT,
  location TEXT,
  prize_pool TEXT,
  tags TEXT[] DEFAULT '{}',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_starts ON events(starts_at);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_tags ON events USING GIN(tags);
CREATE INDEX idx_events_creator ON events(creator_id);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read events" ON events FOR SELECT USING (true);
CREATE POLICY "Service write events" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update events" ON events FOR UPDATE WITH CHECK (true);

-- Add 'upcoming' board
INSERT INTO boards (slug, name, description, is_default) VALUES
  ('upcoming', 'Upcoming', 'Hackathons, bounties, and deadlines', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Add 'marketplace' board if not exists
INSERT INTO boards (slug, name, description, is_default) VALUES
  ('marketplace', 'Marketplace', 'Jobs, bounties, gigs, and collabs', TRUE)
ON CONFLICT (slug) DO NOTHING;
