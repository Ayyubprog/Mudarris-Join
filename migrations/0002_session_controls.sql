ALTER TABLE live_sessions ADD COLUMN join_locked BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE live_sessions ADD COLUMN paused_at TIMESTAMPTZ;