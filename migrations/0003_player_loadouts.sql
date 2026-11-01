-- Store each player's selected character, car, and Shooter progress.
CREATE TABLE IF NOT EXISTS player_loadouts (
  player_id INTEGER PRIMARY KEY,
  session_id INTEGER NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('shooter', 'racing')),
  choice_id TEXT NOT NULL,
  health INTEGER NOT NULL DEFAULT 100,
  enemies_defeated INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
