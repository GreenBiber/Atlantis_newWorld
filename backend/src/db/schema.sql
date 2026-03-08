-- ============================================================
-- SCHLEIER & DUNKEL — Datenbank-Schema v1.1
-- Basierend auf SRS v2.0 Kapitel 14
-- ============================================================

-- Users
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Runs
CREATE TABLE IF NOT EXISTS runs (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER REFERENCES users(id),
  region              TEXT NOT NULL,
  hero_class          TEXT NOT NULL DEFAULT 'kaempfer',
  status              TEXT NOT NULL DEFAULT 'active',
  -- status: active | dead | escaped | completed | schleier_besiegt
  seed                BIGINT NOT NULL,
  step_count          INTEGER NOT NULL DEFAULT 0,
  current_hero_node   TEXT,
  current_veil_node   TEXT,
  planned_route       TEXT,   -- JSON array der geplanten Knoten
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

-- Hero State
CREATE TABLE IF NOT EXISTS hero_state (
  id              SERIAL PRIMARY KEY,
  run_id          INTEGER REFERENCES runs(id) UNIQUE,
  hero_class      TEXT NOT NULL DEFAULT 'kaempfer',
  hp              INTEGER NOT NULL DEFAULT 100,
  max_hp          INTEGER NOT NULL DEFAULT 100,
  armor           INTEGER NOT NULL DEFAULT 0,
  mana            INTEGER NOT NULL DEFAULT 0,
  max_mana        INTEGER NOT NULL DEFAULT 0,
  threat          INTEGER NOT NULL DEFAULT 0,
  visibility      INTEGER NOT NULL DEFAULT 0,
  corruption      INTEGER NOT NULL DEFAULT 0,
  gold            INTEGER NOT NULL DEFAULT 20,
  escape_count    INTEGER NOT NULL DEFAULT 0,
  army_strength   INTEGER NOT NULL DEFAULT 0,
  learned_skills  TEXT    NOT NULL DEFAULT '[]',  -- JSON array
  artifacts       TEXT    NOT NULL DEFAULT '[]'   -- JSON array
);

-- Veil State
CREATE TABLE IF NOT EXISTS veil_state (
  id              SERIAL PRIMARY KEY,
  run_id          INTEGER REFERENCES runs(id) UNIQUE,
  stage           INTEGER NOT NULL DEFAULT 1,
  hunters_active  BOOLEAN NOT NULL DEFAULT FALSE,
  budget          INTEGER NOT NULL DEFAULT 0,
  current_node    TEXT,
  boss_id         TEXT,
  boss_name       TEXT,
  boss_hp         INTEGER NOT NULL DEFAULT 60,
  boss_max_hp     INTEGER NOT NULL DEFAULT 60,
  boss_active     BOOLEAN NOT NULL DEFAULT TRUE,
  escape_count    INTEGER NOT NULL DEFAULT 0
);

-- Army Units (beide Seiten)
CREATE TABLE IF NOT EXISTS army_units (
  id        SERIAL PRIMARY KEY,
  run_id    INTEGER REFERENCES runs(id),
  side      TEXT NOT NULL,       -- hero | veil
  unit_type TEXT NOT NULL,
  count     INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT army_units_unique UNIQUE (run_id, side, unit_type)
);

-- Leader Heroes / Bösewicht-Helden
CREATE TABLE IF NOT EXISTS hero_leaders (
  id          SERIAL PRIMARY KEY,
  run_id      INTEGER REFERENCES runs(id),
  side        TEXT NOT NULL,     -- hero | veil
  leader_id   TEXT NOT NULL,
  hp          INTEGER NOT NULL DEFAULT 60,
  max_hp      INTEGER NOT NULL DEFAULT 60,
  active      BOOLEAN NOT NULL DEFAULT TRUE
);

-- Artefakte
CREATE TABLE IF NOT EXISTS artifacts (
  id          SERIAL PRIMARY KEY,
  run_id      INTEGER REFERENCES runs(id),
  artifact_id TEXT NOT NULL,
  active      BOOLEAN NOT NULL DEFAULT TRUE
);

-- Map Nodes
CREATE TABLE IF NOT EXISTS map_nodes (
  id          SERIAL PRIMARY KEY,
  run_id      INTEGER REFERENCES runs(id),
  node_key    TEXT NOT NULL,
  node_type   TEXT NOT NULL DEFAULT 'neutral',
  risk_color  TEXT NOT NULL DEFAULT 'green',
  side        TEXT NOT NULL DEFAULT 'neutral',   -- hero | veil | neutral
  x           FLOAT NOT NULL,
  y           FLOAT NOT NULL,
  is_revealed BOOLEAN NOT NULL DEFAULT FALSE,
  is_visited  BOOLEAN NOT NULL DEFAULT FALSE,
  is_blocked  BOOLEAN NOT NULL DEFAULT FALSE,
  tags        TEXT NOT NULL DEFAULT '[]'         -- JSON array
);

-- Map Edges
CREATE TABLE IF NOT EXISTS map_edges (
  id          SERIAL PRIMARY KEY,
  run_id      INTEGER REFERENCES runs(id),
  from_node   TEXT NOT NULL,
  to_node     TEXT NOT NULL,
  is_blocked  BOOLEAN NOT NULL DEFAULT FALSE
);

-- Event Log
CREATE TABLE IF NOT EXISTS event_log (
  id          SERIAL PRIMARY KEY,
  run_id      INTEGER REFERENCES runs(id),
  step        INTEGER NOT NULL,
  node_key    TEXT NOT NULL DEFAULT '',
  event_id    TEXT NOT NULL,
  choice      TEXT,
  effects     JSONB,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_runs_user_id        ON runs(user_id);
CREATE INDEX IF NOT EXISTS idx_runs_status         ON runs(status);
CREATE INDEX IF NOT EXISTS idx_hero_state_run_id   ON hero_state(run_id);
CREATE INDEX IF NOT EXISTS idx_veil_state_run_id   ON veil_state(run_id);
CREATE INDEX IF NOT EXISTS idx_army_units_run_id   ON army_units(run_id);
CREATE INDEX IF NOT EXISTS idx_map_nodes_run_id    ON map_nodes(run_id);
CREATE INDEX IF NOT EXISTS idx_map_edges_run_id    ON map_edges(run_id);
CREATE INDEX IF NOT EXISTS idx_event_log_run_id    ON event_log(run_id);
