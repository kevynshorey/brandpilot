-- Waitlist / early access email capture
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  source TEXT DEFAULT 'landing',          -- where the signup came from (landing, blog, etc.)
  referrer TEXT,                           -- HTTP referrer if available
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT waitlist_email_unique UNIQUE (email)
);

-- Index for admin queries
CREATE INDEX IF NOT EXISTS idx_waitlist_created ON waitlist (created_at DESC);

-- RLS: only service role can insert/read (no user-facing RLS needed)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Allow inserts from authenticated and anon (public form)
CREATE POLICY "Anyone can join waitlist" ON waitlist
  FOR INSERT
  WITH CHECK (true);

-- Only service role can read (admin dashboard later)
CREATE POLICY "Service role can read waitlist" ON waitlist
  FOR SELECT
  USING (auth.role() = 'service_role');
