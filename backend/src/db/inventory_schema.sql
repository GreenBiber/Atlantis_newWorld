-- ═══════════════════════════════════════════════════════════════════
-- SCHLEIER & DUNKEL — DB-Schema Erweiterung (SRS v3.1)
-- Ergänzt bestehende schema.sql
-- ═══════════════════════════════════════════════════════════════════

-- ── INVENTAR ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id        UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  item_id       TEXT NOT NULL,                    -- Referenz auf items.ts (W01, A01, ART01, C01, ...)
  slot          TEXT NOT NULL,                    -- 'weapon' | 'armor' | 'artifact' | 'bag'
  equipped      BOOLEAN NOT NULL DEFAULT FALSE,
  rune_slots    TEXT[] NOT NULL DEFAULT '{}',     -- Array von Rune-IDs (in Reihenfolge)
  active_rune_word TEXT,                          -- ID des aktiven Runenwortes oder NULL
  acquired_at_step INT NOT NULL DEFAULT 0,
  acquired_from TEXT NOT NULL DEFAULT 'unknown',  -- 'event', 'combat', 'merchant', 'chest'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_run_id ON inventory(run_id);
CREATE INDEX IF NOT EXISTS idx_inventory_equipped ON inventory(run_id, equipped) WHERE equipped = TRUE;

-- Constraints: Nur 1 Waffe, 1 Rüstung ausrüsten; max 3 Artefakte; bag unbegrenzt
-- (Enforcement in Backend-Logik, nicht DB-Level für Flexibilität)

-- ── RUNEN-INVENTAR ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rune_inventory (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id        UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  rune_id       TEXT NOT NULL,                    -- Referenz auf runes.ts (R_EL, VR_EL, ...)
  side          TEXT NOT NULL DEFAULT 'hero',     -- 'hero' | 'veil'
  socketed_into UUID REFERENCES inventory(id),    -- NULL = im Beutel
  slot_position INT,                              -- Position im Item-Socket (0-2)
  acquired_at_step INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rune_inventory_run_id ON rune_inventory(run_id);
CREATE INDEX IF NOT EXISTS idx_rune_inventory_socketed ON rune_inventory(socketed_into) WHERE socketed_into IS NOT NULL;

-- ── AKTIVE FLÜCHE ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS active_curses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id              UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  curse_id            TEXT NOT NULL,              -- Referenz auf curses.ts
  side                TEXT NOT NULL DEFAULT 'hero', -- 'hero' | 'veil'
  remaining_duration  INT,                        -- NULL = permanent/run-scoped
  duration_type       TEXT NOT NULL DEFAULT 'rooms', -- 'rooms' | 'permanent' | 'run'
  applied_at_step     INT NOT NULL DEFAULT 0,
  source              TEXT NOT NULL DEFAULT 'unknown',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_active_curses_run_id ON active_curses(run_id, side);

-- ── AKTIVE ANFÜHRER-HELDEN ───────────────────────────────────────────
-- Erweitert/ersetzt hero_leaders aus v2.0
CREATE TABLE IF NOT EXISTS active_leaders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id                UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  leader_id             TEXT NOT NULL,            -- Referenz auf leaders.ts (L01-L08)
  side                  TEXT NOT NULL DEFAULT 'hero', -- 'hero' | 'veil'
  current_hp            INT NOT NULL,
  max_hp                INT NOT NULL,
  consecutive_losses    INT NOT NULL DEFAULT 0,
  ability_last_used_step INT NOT NULL DEFAULT -999,
  is_alive              BOOLEAN NOT NULL DEFAULT TRUE,
  recruited_at_step     INT NOT NULL DEFAULT 0,
  departed_at_step      INT,                      -- NULL = noch aktiv
  departure_reason      TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_active_leaders_run_id ON active_leaders(run_id, side);
CREATE INDEX IF NOT EXISTS idx_active_leaders_alive ON active_leaders(run_id, is_alive) WHERE is_alive = TRUE;

-- ── ERWEITERUNGEN BESTEHENDER TABELLEN ──────────────────────────────

-- runs-Tabelle: neue Felder
ALTER TABLE runs
  ADD COLUMN IF NOT EXISTS region_depth INT NOT NULL DEFAULT 1,       -- Wie viele Regionen abgeschlossen
  ADD COLUMN IF NOT EXISTS score INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS veil_runes_active TEXT[] NOT NULL DEFAULT '{}', -- Schleier-Runen (gestohlen/eigen)
  ADD COLUMN IF NOT EXISTS active_rune_words TEXT[] NOT NULL DEFAULT '{}'; -- Aktive Runenwörter (Held)

-- hero_state-Tabelle: neue Felder
ALTER TABLE hero_state
  ADD COLUMN IF NOT EXISTS active_curse_ids TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS active_synergy_ids TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS equipped_weapon TEXT,       -- item_id
  ADD COLUMN IF NOT EXISTS equipped_armor TEXT,        -- item_id
  ADD COLUMN IF NOT EXISTS equipped_artifacts TEXT[] NOT NULL DEFAULT '{}'; -- max 3 item_ids

-- map_nodes: Spezial-Objekt-Felder
ALTER TABLE map_nodes
  ADD COLUMN IF NOT EXISTS special_object TEXT,        -- 'tower' | 'cave' | 'tunnel' | 'cliff' | 'cellar' | NULL
  ADD COLUMN IF NOT EXISTS special_object_cleared BOOLEAN NOT NULL DEFAULT FALSE;

-- ── VIEWS FÜR GAME-STATE ────────────────────────────────────────────
CREATE OR REPLACE VIEW v_run_full_state AS
SELECT
  r.id AS run_id,
  r.user_id,
  r.status,
  r.region,
  r.region_depth,
  r.score,
  hs.hp,
  hs.max_hp,
  hs.armor,
  hs.mana,
  hs.max_mana,
  hs.threat,
  hs.visibility,
  hs.corruption,
  hs.gold,
  hs.escape_count,
  hs.army_strength,
  hs.active_curse_ids,
  hs.equipped_weapon,
  hs.equipped_armor,
  hs.equipped_artifacts,
  -- Armee-Zusammenfassung
  (SELECT json_agg(json_build_object('unit_type', unit_type, 'count', count))
   FROM army_units WHERE run_id = r.id AND side = 'hero') AS hero_army,
  (SELECT json_agg(json_build_object('unit_type', unit_type, 'count', count))
   FROM army_units WHERE run_id = r.id AND side = 'veil') AS veil_army,
  -- Aktive Anführer
  (SELECT json_agg(json_build_object('leader_id', leader_id, 'current_hp', current_hp, 'is_alive', is_alive))
   FROM active_leaders WHERE run_id = r.id AND side = 'hero' AND is_alive = TRUE) AS hero_leaders,
  -- Aktive Flüche
  (SELECT json_agg(json_build_object('curse_id', curse_id, 'remaining', remaining_duration))
   FROM active_curses WHERE run_id = r.id AND side = 'hero') AS hero_curses,
  -- Inventar
  (SELECT json_agg(json_build_object('id', id, 'item_id', item_id, 'slot', slot, 'equipped', equipped, 'rune_slots', rune_slots))
   FROM inventory WHERE run_id = r.id) AS inventory_items
FROM runs r
JOIN hero_state hs ON hs.run_id = r.id;

-- ── SCORE-BERECHNUNG ────────────────────────────────────────────────
-- Score-Funktion (für Sprint 4 Leaderboard)
CREATE OR REPLACE FUNCTION calculate_run_score(p_run_id UUID)
RETURNS INT AS $$
DECLARE
  v_score INT := 0;
  v_rooms INT;
  v_steps INT;
  v_army_strength INT;
  v_corruption INT;
  v_escape_count INT;
  v_region_depth INT;
  v_status TEXT;
BEGIN
  SELECT
    hs.army_strength,
    hs.corruption,
    hs.escape_count,
    r.region_depth,
    r.status,
    COUNT(DISTINCT mn.id) FILTER (WHERE mn.visited = TRUE) AS rooms_visited,
    hs.step
  INTO
    v_army_strength, v_corruption, v_escape_count,
    v_region_depth, v_status, v_rooms, v_steps
  FROM runs r
  JOIN hero_state hs ON hs.run_id = r.id
  LEFT JOIN map_nodes mn ON mn.run_id = r.id
  WHERE r.id = p_run_id
  GROUP BY hs.army_strength, hs.corruption, hs.escape_count, r.region_depth, r.status, hs.step;

  -- Basis-Score
  v_score := v_rooms * 100;
  v_score := v_score + v_steps * 50;
  v_score := v_score + v_army_strength * 10;
  v_score := v_score + v_region_depth * 500;

  -- Bonus für sauberes Spielen
  v_score := v_score - (v_corruption * 50);
  v_score := v_score - (v_escape_count * 100);

  -- Sieg-Bonus
  IF v_status = 'schleier_besiegt' THEN
    v_score := v_score + 5000;
  ELSIF v_status = 'completed' THEN
    v_score := v_score + 1000;
  END IF;

  RETURN GREATEST(0, v_score);
END;
$$ LANGUAGE plpgsql;
