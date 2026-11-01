-- One-of-one special avatar availability is rolled once when a live session is created.
-- Each special is independently rolled at a 15% rate and can be claimed by one player per session.
CREATE TABLE IF NOT EXISTS session_specials (
  session_id INTEGER NOT NULL,
  special_id TEXT NOT NULL CHECK (special_id IN ('phoenix', 'shadowdragon')),
  player_id INTEGER,
  claimed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (session_id, special_id)
);
