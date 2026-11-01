-- Store each player's selected character for Shooter or vehicle for Race Car.
CREATE TABLE IF NOT EXISTS player_loadouts (
  player_id INTEGER PRIMARY KEY,
  session_id INTEGER NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('shooter', 'racing')),
  choice_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
