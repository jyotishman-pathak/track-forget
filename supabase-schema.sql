-- ============================================================
-- TrackForge — Full Schema Migration
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── 1. ENUMS ─────────────────────────────────────────────────
CREATE TYPE track_template AS ENUM ('GAUNTLET', 'PROJECT', 'READING');
CREATE TYPE track_status   AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED');
CREATE TYPE phase_status   AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE task_difficulty AS ENUM ('easy', 'medium', 'hard');

-- ── 2. TRACKS ────────────────────────────────────────────────
CREATE TABLE tracks (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT          NOT NULL,
  slug            TEXT          NOT NULL UNIQUE,
  description     TEXT,
  accent_color    TEXT          NOT NULL DEFAULT '#f59e0b',
  category        TEXT          NOT NULL DEFAULT 'General',
  template        track_template NOT NULL DEFAULT 'GAUNTLET',
  total_tasks     INTEGER       NOT NULL DEFAULT 0,
  completed_tasks INTEGER       NOT NULL DEFAULT 0,
  metadata        JSONB         NOT NULL DEFAULT '{}',
  status          track_status  NOT NULL DEFAULT 'ACTIVE',
  deadline        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ── 3. PHASES ────────────────────────────────────────────────
CREATE TABLE phases (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id        UUID          NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  number          INTEGER       NOT NULL,
  title           TEXT          NOT NULL,
  description     TEXT,
  status          phase_status  NOT NULL DEFAULT 'NOT_STARTED',
  total_tasks     INTEGER       NOT NULL DEFAULT 0,
  completed_tasks INTEGER       NOT NULL DEFAULT 0,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE (track_id, number)
);

-- ── 4. TASKS ─────────────────────────────────────────────────
CREATE TABLE tasks (
  id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id        UUID           NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  description     TEXT           NOT NULL,
  completed       BOOLEAN        NOT NULL DEFAULT false,
  resource_url    TEXT,
  difficulty      task_difficulty,
  cold_redo       BOOLEAN        DEFAULT false,
  time_spent_sec  INTEGER        NOT NULL DEFAULT 0,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- ── 5. SESSIONS ──────────────────────────────────────────────
CREATE TABLE sessions (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id      UUID         NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  started_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  ended_at      TIMESTAMPTZ,
  duration_sec  INTEGER      NOT NULL DEFAULT 0,
  notes         TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── 6. NOTES ─────────────────────────────────────────────────
CREATE TABLE notes (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  content    TEXT         NOT NULL,
  track_id   UUID         REFERENCES tracks(id) ON DELETE CASCADE,
  phase_id   UUID         REFERENCES phases(id) ON DELETE CASCADE,
  pinned     BOOLEAN      NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── 7. FUNCTION: increment_task_time ─────────────────────────
-- Called via supabase.rpc('increment_task_time', { task_id, additional_seconds })
CREATE OR REPLACE FUNCTION increment_task_time(task_id UUID, additional_seconds INTEGER)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE tasks
  SET time_spent_sec = time_spent_sec + additional_seconds
  WHERE id = task_id;
END;
$$;

-- ── 8. AUTO-UPDATE updated_at ────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tracks_updated_at BEFORE UPDATE ON tracks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── 9. ROW LEVEL SECURITY ────────────────────────────────────
-- Your app doesn't use auth, so we allow full public access.
ALTER TABLE tracks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON tracks   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON phases   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON tasks    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON notes    FOR ALL USING (true) WITH CHECK (true);
