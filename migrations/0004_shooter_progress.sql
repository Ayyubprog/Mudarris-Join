-- Add persistent combat progress to Shooter loadouts.
ALTER TABLE player_loadouts ADD COLUMN health INTEGER NOT NULL DEFAULT 100;
ALTER TABLE player_loadouts ADD COLUMN enemies_defeated INTEGER NOT NULL DEFAULT 0;
