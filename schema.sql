-- Child Spree D1 Schema
-- Run: npm run db:migrate (production) or npm run db:migrate:local (dev)

CREATE TABLE IF NOT EXISTS nominations (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, sent, complete, declined
  parent_token TEXT UNIQUE, -- unique token for parent intake link

  -- Child info
  child_first TEXT NOT NULL,
  child_last TEXT NOT NULL,
  school TEXT NOT NULL,
  grade TEXT NOT NULL,

  -- Nominator info
  nominator_name TEXT NOT NULL,
  nominator_role TEXT NOT NULL,
  nominator_email TEXT NOT NULL,

  -- Parent/guardian contact
  parent_name TEXT NOT NULL,
  parent_phone TEXT,
  parent_email TEXT,

  -- Details
  reason TEXT,
  siblings TEXT,
  additional_notes TEXT,

  -- Timestamps
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  approved_at TEXT,
  sent_at TEXT,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS parent_intake (
  id TEXT PRIMARY KEY,
  nomination_id TEXT NOT NULL UNIQUE REFERENCES nominations(id),

  -- Sizes
  shirt_size TEXT NOT NULL,
  pant_size TEXT NOT NULL,
  shoe_size TEXT NOT NULL,

  -- Preferences
  favorite_colors TEXT,
  avoid_colors TEXT,
  allergies TEXT,
  preferences TEXT,

  -- Video
  video_key TEXT, -- R2 object key
  video_uploaded INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_nominations_status ON nominations(status);
CREATE INDEX IF NOT EXISTS idx_nominations_school ON nominations(school);
CREATE INDEX IF NOT EXISTS idx_nominations_parent_token ON nominations(parent_token);
CREATE INDEX IF NOT EXISTS idx_parent_intake_nomination ON parent_intake(nomination_id);
