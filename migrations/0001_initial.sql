CREATE TABLE teacher_profiles (
  auth_user_id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT 'Teacher',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE games (
  id BIGSERIAL PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  grade TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  mode TEXT NOT NULL DEFAULT 'classic',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX games_teacher_created_idx ON games(teacher_id, created_at DESC);

CREATE TABLE questions (
  id BIGSERIAL PRIMARY KEY,
  game_id BIGINT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'quiz',
  prompt TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  time_limit INTEGER NOT NULL DEFAULT 20,
  points INTEGER NOT NULL DEFAULT 1000,
  media_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_id, position)
);

CREATE TABLE classes (
  id BIGSERIAL PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  name TEXT NOT NULL,
  grade TEXT NOT NULL DEFAULT '',
  join_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX classes_teacher_idx ON classes(teacher_id);

CREATE TABLE class_students (
  id BIGSERIAL PRIMARY KEY,
  class_id BIGINT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  external_ref TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE live_sessions (
  id BIGSERIAL PRIMARY KEY,
  pin TEXT NOT NULL UNIQUE,
  game_id BIGINT NOT NULL REFERENCES games(id),
  teacher_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  current_question INTEGER NOT NULL DEFAULT -1,
  question_started_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX live_sessions_teacher_idx ON live_sessions(teacher_id, created_at DESC);

CREATE TABLE players (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT 'tiger',
  score INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  last_answered_question INTEGER NOT NULL DEFAULT -1,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, nickname)
);
CREATE INDEX players_session_score_idx ON players(session_id, score DESC);

CREATE TABLE answers (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  response_ms INTEGER NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(player_id, question_id)
);
CREATE INDEX answers_session_question_idx ON answers(session_id, question_id);

CREATE TABLE session_events (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);