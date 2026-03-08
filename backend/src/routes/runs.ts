import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { generateGraph } from '../game/graph';
import { createRng } from '../utils/prng';
import {
  calcArmyStrength,
  executeCombatRound,
  calcVictoryLoot,
} from '../game/combat';
import { getEventForRoom, applyEffects, EVENTS } from '../game/events';
import {
  computeVeilRoute,
  updateVeilStage,
  applyVeilAction,
  shouldVeilFlee,
} from '../game/veil';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────────────────────
// Hilfsdaten
// ─────────────────────────────────────────────────────────────────────────────

const VEIL_BOSSES = [
  { id: 'SH1', name: 'Morvaen der Zerrissene', type: 'fighter' },
  { id: 'SH2', name: 'Die Flüsternde',         type: 'mage'    },
  { id: 'SH3', name: 'Blutrichter Kayn',        type: 'fighter' },
  { id: 'SH4', name: 'Nebelspinnerin',          type: 'mage'    },
  { id: 'SH5', name: 'Der Letzte Wächter',      type: 'fighter' },
];

// ─────────────────────────────────────────────────────────────────────────────
// POST /runs  —  Neuen Run erstellen
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req: AuthRequest, res: Response) => {
  const { region, heroClass } = req.body;
  if (!region || !heroClass)
    return res.status(400).json({ error: 'region und heroClass erforderlich' });

  const seed      = Date.now() & 0xffffffff;
  const rng       = createRng(seed);
  const graph     = generateGraph(seed);
  const isKaempfer = heroClass === 'kaempfer';

  // Boss auswählen
  const bossPool = VEIL_BOSSES.filter(b =>
    region === 'grenzlande' ? b.type === 'fighter' : b.type === 'mage'
  );
  const boss = bossPool[rng.int(0, bossPool.length - 1)];

  const heroStart = graph.heroStart;
  const veilStart = graph.veilStart;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Runs-Tabelle ──────────────────────────────────────────────────────────
    const runRes = await client.query(
      `INSERT INTO runs
         (user_id, region, hero_class, seed, status,
          current_hero_node, current_veil_node, step_count)
       VALUES ($1,$2,$3,$4,'active',$5,$6,0)
       RETURNING id`,
      [req.userId, region, heroClass, seed, heroStart, veilStart]
    );
    const runId: number = runRes.rows[0].id;

    // ── Hero State ────────────────────────────────────────────────────────────
    await client.query(
      `INSERT INTO hero_state
         (run_id, hero_class, hp, max_hp, armor, mana, max_mana,
          threat, visibility, corruption, gold, escape_count,
          learned_skills, army_strength)
       VALUES ($1,$2,$3,$4,$5,$6,$7, 0,0,0, 20, 0, $8, 0)`,
      [
        runId,
        heroClass,
        isKaempfer ? 120 : 80,
        isKaempfer ? 120 : 80,
        isKaempfer ? 8   : 3,
        isKaempfer ? 0   : 80,
        80,
        JSON.stringify(isKaempfer ? ['F1', 'F2'] : ['M1', 'M3']),
      ]
    );

    // ── Veil State ────────────────────────────────────────────────────────────
    await client.query(
      `INSERT INTO veil_state
         (run_id, stage, hunters_active, budget, current_node,
          boss_id, boss_name, boss_hp, boss_max_hp, boss_active)
       VALUES ($1, 1, false, 0, $2, $3, $4, 60, 60, true)`,
      [runId, veilStart, boss.id, boss.name]
    );

    // ── Armeen ────────────────────────────────────────────────────────────────
    await client.query(
      `INSERT INTO army_units (run_id, side, unit_type, count) VALUES
       ($1,'hero','miliz',   3),
       ($1,'hero','veteran', 0),
       ($1,'hero','elite',   0),
       ($1,'hero','leader',  $2),
       ($1,'hero','mage',    $3)`,
      [runId, isKaempfer ? 1 : 0, isKaempfer ? 0 : 1]
    );
    await client.query(
      `INSERT INTO army_units (run_id, side, unit_type, count) VALUES
       ($1,'veil','soeldner', 3),
       ($1,'veil','waechter', 0),
       ($1,'veil','klaue',    0)`,
      [runId]
    );

    // ── Map Nodes ─────────────────────────────────────────────────────────────
    for (const [key, node] of Object.entries(graph.nodes)) {
      const isRevealed =
        key === heroStart ||
        (graph.nodes[heroStart]?.neighbors ?? []).includes(key);

      await client.query(
        `INSERT INTO map_nodes
           (run_id, node_key, node_type, risk_color, x, y, side,
            is_revealed, is_visited, is_blocked)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false,false)`,
        [
          runId, key, node.type, node.risk, node.x, node.y,
          node.isHeroStart ? 'hero' : node.isVeilStart ? 'veil' : 'neutral',
          isRevealed,
        ]
      );
    }

    // ── Map Edges ─────────────────────────────────────────────────────────────
    for (const edge of graph.edges) {
      await client.query(
        `INSERT INTO map_edges (run_id, from_node, to_node, is_blocked)
         VALUES ($1,$2,$3,false)`,
        [runId, edge.from, edge.to]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      runId,
      heroStart,
      veilStart,
      exitNode:  graph.exitNode,
      seed,
      boss:      boss.name,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /runs error:', err);
    res.status(500).json({ error: 'Run konnte nicht erstellt werden' });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /runs/active
// ─────────────────────────────────────────────────────────────────────────────
router.get('/active', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT r.*, h.hp, h.max_hp, h.threat, h.visibility, h.corruption,
              h.gold, h.escape_count, h.learned_skills
       FROM runs r
       JOIN hero_state h ON h.run_id = r.id
       WHERE r.user_id = $1 AND r.status = 'active'
       ORDER BY r.created_at DESC LIMIT 1`,
      [req.userId]
    );
    res.json(result.rows[0] ?? null);
  } catch (err) {
    console.error('GET /runs/active error:', err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /runs/:id  —  Vollständiger Run-State
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const [run, hero, veil, units, nodes, edges, log] = await Promise.all([
      pool.query(`SELECT * FROM runs       WHERE id=$1 AND user_id=$2`, [id, req.userId]),
      pool.query(`SELECT * FROM hero_state WHERE run_id=$1`,            [id]),
      pool.query(`SELECT * FROM veil_state WHERE run_id=$1`,            [id]),
      pool.query(`SELECT * FROM army_units WHERE run_id=$1`,            [id]),
      pool.query(`SELECT * FROM map_nodes  WHERE run_id=$1`,            [id]),
      pool.query(`SELECT * FROM map_edges  WHERE run_id=$1`,            [id]),
      pool.query(`SELECT * FROM event_log  WHERE run_id=$1 ORDER BY step ASC`, [id]),
    ]);

    if (!run.rows[0]) return res.status(404).json({ error: 'Run nicht gefunden' });

    res.json({
      run:   run.rows[0],
      hero:  hero.rows[0],
      veil:  veil.rows[0],
      units: units.rows,
      nodes: nodes.rows,
      edges: edges.rows,
      log:   log.rows,
    });
  } catch (err) {
    console.error('GET /runs/:id error:', err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /runs/:id/plan  —  Route validieren und speichern
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/plan', async (req: AuthRequest, res: Response) => {
  const { id }    = req.params;
  const { route } = req.body as { route: string[] };

  if (!Array.isArray(route) || route.length === 0 || route.length > 4)
    return res.status(400).json({ error: 'Route muss 1–4 Knoten enthalten' });

  const runRes = await pool.query(
    `SELECT * FROM runs WHERE id=$1 AND user_id=$2 AND status='active'`,
    [id, req.userId]
  );
  if (!runRes.rows[0])
    return res.status(404).json({ error: 'Aktiver Run nicht gefunden' });

  const currentNode: string = runRes.rows[0].current_hero_node;

  // Konnektivität prüfen
  const nodeChain = [currentNode, ...route];
  for (let i = 0; i < nodeChain.length - 1; i++) {
    const edgeCheck = await pool.query(
      `SELECT id FROM map_edges
       WHERE run_id=$1 AND is_blocked=false
         AND ((from_node=$2 AND to_node=$3) OR (from_node=$3 AND to_node=$2))`,
      [id, nodeChain[i], nodeChain[i + 1]]
    );
    if (!edgeCheck.rows[0])
      return res.status(400).json({
        error: `Kein gültiger Weg von ${nodeChain[i]} nach ${nodeChain[i + 1]}`,
      });
  }

  await pool.query(
    `UPDATE runs SET planned_route=$1 WHERE id=$2`,
    [JSON.stringify(route), id]
  );
  res.json({ ok: true, route });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /runs/:id/execute  —  Beide Routen Schritt für Schritt auflösen
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/execute', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const runRes = await pool.query(
    `SELECT * FROM runs WHERE id=$1 AND user_id=$2 AND status='active'`,
    [id, req.userId]
  );
  if (!runRes.rows[0])
    return res.status(404).json({ error: 'Run nicht gefunden' });
  if (!runRes.rows[0].planned_route)
    return res.status(400).json({ error: 'Keine Route geplant' });

  const heroRoute: string[]  = JSON.parse(runRes.rows[0].planned_route);
  const runRow               = runRes.rows[0];

  const [heroRes, veilRes, unitsRes, nodesRes, edgesRes] = await Promise.all([
    pool.query(`SELECT * FROM hero_state WHERE run_id=$1`, [id]),
    pool.query(`SELECT * FROM veil_state WHERE run_id=$1`, [id]),
    pool.query(`SELECT * FROM army_units WHERE run_id=$1`, [id]),
    pool.query(`SELECT * FROM map_nodes  WHERE run_id=$1`, [id]),
    pool.query(`SELECT * FROM map_edges  WHERE run_id=$1`, [id]),
  ]);

  const heroRow = heroRes.rows[0];
  const veilRow = veilRes.rows[0];

  // ── Arbeitskopien ──────────────────────────────────────────────────────────
  const heroState = {
    hp:          heroRow.hp          as number,
    maxHp:       heroRow.max_hp      as number,
    mana:        heroRow.mana        as number,
    maxMana:     heroRow.max_mana    as number,
    armor:       heroRow.armor       as number,
    gold:        heroRow.gold        as number,
    threat:      heroRow.threat      as number,
    visibility:  heroRow.visibility  as number,
    corruption:  heroRow.corruption  as number,
    escapeCount: heroRow.escape_count as number,
  };

  const heroUnits:  Record<string, number> = {};
  const veilUnits:  Record<string, number> = {};
  for (const u of unitsRes.rows) {
    if (u.side === 'hero') heroUnits[u.unit_type] = Number(u.count);
    else                   veilUnits[u.unit_type] = Number(u.count);
  }

  // Graph rekonstruieren
  const nodes: Record<string, any> = {};
  for (const n of nodesRes.rows) nodes[n.node_key] = n;

  const edges: { from: string; to: string }[] = edgesRes.rows.map(e => ({
    from: e.from_node,
    to:   e.to_node,
  }));

  const blockedEdges = new Set<string>(
    edgesRes.rows
      .filter(e => e.is_blocked)
      .map(e => [e.from_node, e.to_node].sort().join('-'))
  );

  const seed      = Number(runRow.seed);
  const stepBase  = Number(runRow.step_count ?? 0);
  const rng       = createRng(seed + stepBase);

  // Veil-besuchte Knoten
  const veilVisited = new Set<string>(
    nodesRes.rows
      .filter((n: any) => n.is_visited && n.side === 'veil')
      .map((n: any) => n.node_key as string)
  );

  // ── Schleier-Route berechnen ───────────────────────────────────────────────
  const veilGraphLike = { nodes, edges };
  const veilArmyTyped = {
    soeldner: veilUnits.soeldner ?? 0,
    waechter: veilUnits.waechter ?? 0,
    klaue:    veilUnits.klaue    ?? 0,
    ...veilUnits,
  };
  const veilRoute = computeVeilRoute(
    veilGraphLike as any,
    veilRow.current_node,
    runRow.current_hero_node,
    veilArmyTyped,
    veilVisited,
    seed,
    stepBase
  );

  // ── Schritt-Verarbeitung ───────────────────────────────────────────────────
  const stepResults: any[] = [];
  let currentHeroNode: string = runRow.current_hero_node;
  let currentVeilNode: string = veilRow.current_node;
  let runStatus               = 'active';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (let i = 0; i < heroRoute.length; i++) {
      if (heroState.hp <= 0) { runStatus = 'dead'; break; }

      const heroNode = heroRoute[i];
      const veilNode = veilRoute[i] ?? currentVeilNode;
      currentHeroNode = heroNode;
      currentVeilNode = veilNode;

      // Hero-Knoten besuchen + Nachbarn enthüllen
      await client.query(
        `UPDATE map_nodes
         SET is_visited=true, is_revealed=true
         WHERE run_id=$1 AND node_key=$2`,
        [id, heroNode]
      );
      await client.query(
        `UPDATE map_nodes SET is_revealed=true
         WHERE run_id=$1 AND node_key IN (
           SELECT CASE WHEN from_node=$2 THEN to_node ELSE from_node END
           FROM map_edges
           WHERE run_id=$1 AND (from_node=$2 OR to_node=$2)
         )`,
        [id, heroNode]
      );

      const nodeData = nodes[heroNode];

      // ── EXIT ────────────────────────────────────────────────────────────────
      if (nodeData?.node_type === 'exit') {
        stepResults.push({ step: i + 1, node: heroNode, type: 'exit' });
        runStatus = 'completed';
        break;
      }

      // ── BEGEGNUNG ──────────────────────────────────────────────────────────
      if (heroNode === veilNode) {
        const heroStr = calcArmyStrength(heroUnits) + heroState.hp / 5;
        const veilStr = calcArmyStrength(veilUnits);

        stepResults.push({
          step:     i + 1,
          node:     heroNode,
          type:     'encounter',
          heroStr:  Math.floor(heroStr),
          veilStr:  Math.floor(veilStr),
          veilBoss: veilRow.boss_name,
        });

        // Veil-Boss SH2: Verderbnis +2
        if (veilRow.boss_active && veilRow.boss_id === 'SH2') {
          heroState.corruption = Math.min(10, heroState.corruption + 2);
        }
      } else {
        // ── RAUMEVENT ─────────────────────────────────────────────────────────
        const event = getEventForRoom(
          nodeData?.node_type   ?? 'neutral',
          nodeData?.risk_color  ?? 'green',
          runRow.region,
          seed,
          i + stepBase
        );

        stepResults.push({
          step:      i + 1,
          node:      heroNode,
          type:      'event',
          eventId:   event.id,
          eventName: event.name,
          eventIcon: event.icon,
          eventText: event.text,
          choices:   event.choices.map(c => ({
            label: c.label,
            text:  c.text,
          })),
        });

        // ── Armee-Wachstum nach Raum (SRS 8.1) ────────────────────────────────
        const risk = nodeData?.risk_color ?? 'green';
        if (risk === 'green') {
          heroUnits.miliz   = (heroUnits.miliz  ?? 0) + rng.int(1, 2);
          heroState.maxHp  += 5;
          heroState.hp      = Math.min(heroState.maxHp, heroState.hp + 5);
        } else if (risk === 'yellow') {
          heroUnits.miliz   = (heroUnits.miliz  ?? 0) + rng.int(1, 2);
          if (rng.chance(30)) heroUnits.veteran = (heroUnits.veteran ?? 0) + 1;
          heroState.maxHp  += 10;
          heroState.hp      = Math.min(heroState.maxHp, heroState.hp + 5);
        } else if (risk === 'red') {
          heroUnits.miliz   = (heroUnits.miliz  ?? 0) + rng.int(2, 4);
          if (rng.chance(20)) heroUnits.elite  = (heroUnits.elite   ?? 0) + 1;
          heroState.maxHp  += 15;
        }

        // Schleier-Armee wächst parallel
        veilUnits.soeldner  = (veilUnits.soeldner  ?? 0) + rng.int(1, 2);
        if (rng.chance(25)) veilUnits.waechter = (veilUnits.waechter ?? 0) + 1;
      }

      // ── Schleier-Eskalation (SRS 9.1) ─────────────────────────────────────
      const newStage = updateVeilStage(
        heroState.threat,
        heroState.visibility,
        heroState.corruption,
        i + stepBase
      );

      // Schleier-Aktion (SRS 9.2)
      const veilAction = applyVeilAction(
        newStage,
        veilArmyTyped,
        heroState.visibility,
        { nodes, edges } as any,
        currentHeroNode,
        seed,
        i + stepBase
      );

      if (veilAction?.type === 'hunters_active') {
        await client.query(
          `UPDATE veil_state SET hunters_active=true WHERE run_id=$1`, [id]
        );
      }
      if (veilAction?.type === 'block_edge' && veilAction.targetEdge) {
        const { from, to } = veilAction.targetEdge;
        blockedEdges.add([from, to].sort().join('-'));
        await client.query(
          `UPDATE map_edges SET is_blocked=true
           WHERE run_id=$1
             AND ((from_node=$2 AND to_node=$3) OR (from_node=$3 AND to_node=$2))`,
          [id, from, to]
        );
      }
      if (veilAction?.type === 'army_growth' && veilAction.armyBonus) {
        for (const [t, c] of Object.entries(veilAction.armyBonus)) {
          veilUnits[t] = (veilUnits[t] ?? 0) + (c as number);
        }
      }

      await client.query(
        `UPDATE veil_state SET stage=$1 WHERE run_id=$2`,
        [newStage, id]
      );
    }

    // ── Finale DB-Updates ─────────────────────────────────────────────────────
    await client.query(
      `UPDATE hero_state
       SET hp=$1, max_hp=$2, mana=$3, armor=$4, gold=$5,
           threat=$6, visibility=$7, corruption=$8,
           army_strength=$9
       WHERE run_id=$10`,
      [
        heroState.hp, heroState.maxHp, heroState.mana, heroState.armor,
        heroState.gold, heroState.threat, heroState.visibility, heroState.corruption,
        calcArmyStrength(heroUnits),
        id,
      ]
    );

    await client.query(
      `UPDATE veil_state SET current_node=$1 WHERE run_id=$2`,
      [currentVeilNode, id]
    );

    // Armeen
    for (const [type, count] of Object.entries(heroUnits)) {
      await client.query(
        `INSERT INTO army_units (run_id, side, unit_type, count)
         VALUES ($1,'hero',$2,$3)
         ON CONFLICT (run_id, side, unit_type) DO UPDATE SET count=EXCLUDED.count`,
        [id, type, count]
      );
    }
    for (const [type, count] of Object.entries(veilUnits)) {
      await client.query(
        `INSERT INTO army_units (run_id, side, unit_type, count)
         VALUES ($1,'veil',$2,$3)
         ON CONFLICT (run_id, side, unit_type) DO UPDATE SET count=EXCLUDED.count`,
        [id, type, count]
      );
    }

    await client.query(
      `UPDATE runs
       SET current_hero_node=$1, current_veil_node=$2,
           planned_route=NULL,
           step_count=COALESCE(step_count,0)+$3,
           status=$4
       WHERE id=$5`,
      [currentHeroNode, currentVeilNode, heroRoute.length, runStatus, id]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /runs/:id/execute error:', err);
    res.status(500).json({ error: 'Fehler beim Ausführen der Route' });
    return;
  } finally {
    client.release();
  }

  res.json({ steps: stepResults, runStatus, currentHeroNode, currentVeilNode });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /runs/:id/event/choose  —  Event-Entscheidung anwenden
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/event/choose', async (req: AuthRequest, res: Response) => {
  const { id }                           = req.params;
  const { eventId, choiceIndex }         = req.body as {
    eventId: string; choiceIndex: number;
  };

  const event = EVENTS.find(e => e.id === eventId);
  if (!event) return res.status(400).json({ error: 'Event nicht gefunden' });

  const choice = event.choices[choiceIndex];
  if (!choice) return res.status(400).json({ error: 'Ungültige Wahl' });

  const [heroRes, unitsRes] = await Promise.all([
    pool.query(`SELECT * FROM hero_state WHERE run_id=$1`,           [id]),
    pool.query(`SELECT * FROM army_units  WHERE run_id=$1 AND side='hero'`, [id]),
  ]);

  const heroRow   = heroRes.rows[0];
  const heroState = {
    hp: heroRow.hp, maxHp: heroRow.max_hp,
    mana: heroRow.mana, maxMana: heroRow.max_mana,
    gold: heroRow.gold, threat: heroRow.threat,
    visibility: heroRow.visibility, corruption: heroRow.corruption,
  };
  const army: Record<string, number> = {};
  for (const u of unitsRes.rows) army[u.unit_type] = Number(u.count);

  applyEffects(heroState, army, choice.effects);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE hero_state
       SET hp=$1, max_hp=$2, mana=$3, gold=$4,
           threat=$5, visibility=$6, corruption=$7
       WHERE run_id=$8`,
      [
        heroState.hp, heroState.maxHp, heroState.mana,
        heroState.gold, heroState.threat, heroState.visibility,
        heroState.corruption, id,
      ]
    );

    for (const [type, count] of Object.entries(army)) {
      await client.query(
        `INSERT INTO army_units (run_id, side, unit_type, count)
         VALUES ($1,'hero',$2,$3)
         ON CONFLICT (run_id, side, unit_type) DO UPDATE SET count=EXCLUDED.count`,
        [id, type, count]
      );
    }

    // Event-Log-Eintrag
    await client.query(
      `INSERT INTO event_log (run_id, step, node_key, event_id, choice, effects)
       VALUES (
         $1,
         (SELECT COALESCE(step_count, 0) FROM runs WHERE id=$1),
         (SELECT current_hero_node FROM runs WHERE id=$1),
         $2, $3, $4
       )`,
      [id, eventId, choice.label, JSON.stringify(choice.effects)]
    );

    // Run beenden wenn HP = 0
    if (heroState.hp <= 0) {
      await client.query(
        `UPDATE runs SET status='dead' WHERE id=$1`, [id]
      );
    }

    await client.query('COMMIT');
    res.json({
      ok:         true,
      resultText: choice.text,
      effects:    choice.effects,
      heroState,
      army,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /event/choose error:', err);
    res.status(500).json({ error: 'Fehler beim Anwenden der Event-Wahl' });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /runs/:id/combat/action  —  Kampfrunde ausführen
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/combat/action', async (req: AuthRequest, res: Response) => {
  const { id }                    = req.params;
  const { action, combatState }   = req.body as {
    action: 'attack' | 'defend' | 'escape';
    combatState: any;
  };

  const [heroRes, veilRes, unitsRes, runRes] = await Promise.all([
    pool.query(`SELECT * FROM hero_state WHERE run_id=$1`, [id]),
    pool.query(`SELECT * FROM veil_state WHERE run_id=$1`, [id]),
    pool.query(`SELECT * FROM army_units  WHERE run_id=$1`, [id]),
    pool.query(`SELECT seed, step_count  FROM runs WHERE id=$1`, [id]),
  ]);

  const heroRow  = heroRes.rows[0];
  const veilRow  = veilRes.rows[0];
  const heroUnits: Record<string, number> = {};
  const veilUnits: Record<string, number> = {};
  for (const u of unitsRes.rows) {
    if (u.side === 'hero') heroUnits[u.unit_type] = Number(u.count);
    else                   veilUnits[u.unit_type] = Number(u.count);
  }

  const seed  = Number(runRes.rows[0].seed);
  const step  = Number(runRes.rows[0].step_count ?? 0);
  const round = Number(combatState?.round ?? 0);

  const newCombatState = executeCombatRound(
    combatState,
    action,
    calcArmyStrength(heroUnits),
    calcArmyStrength(veilUnits),
    heroRow.armor,
    veilRow.stage,
    seed + step + round
  );

  if (!newCombatState.finished) {
    return res.json(newCombatState);
  }

  // ── Kampf abgeschlossen ────────────────────────────────────────────────────
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (newCombatState.winner === 'hero') {
      const loot = calcVictoryLoot(newCombatState.veilBaseStr, Math.random);
      await client.query(
        `UPDATE hero_state
         SET gold=gold+$1, threat=LEAST(10, threat+1)
         WHERE run_id=$2`,
        [loot.gold, id]
      );
      // Schleier-Armee auf 30% reduzieren
      await client.query(
        `UPDATE army_units
         SET count=GREATEST(0, FLOOR(count*0.3)::int)
         WHERE run_id=$1 AND side='veil'`,
        [id]
      );
      newCombatState.log.push({
        type: 'hero',
        text: `💰 +${loot.gold} Gold. Schleier-Armee dezimiert.`,
      });

      // Schleier komplett besiegt?
      const remaining = await client.query(
        `SELECT SUM(count) AS total FROM army_units WHERE run_id=$1 AND side='veil'`,
        [id]
      );
      const totalVeilUnits = Number(remaining.rows[0]?.total ?? 0);
      if (totalVeilUnits <= 0 && !veilRow.boss_active) {
        await client.query(
          `UPDATE runs SET status='schleier_besiegt' WHERE id=$1`, [id]
        );
      }
    } else if (newCombatState.winner === 'veil') {
      await client.query(`UPDATE runs       SET status='dead' WHERE id=$1`, [id]);
      await client.query(`UPDATE hero_state SET hp=0          WHERE run_id=$1`, [id]);
    } else if (newCombatState.winner === 'fled') {
      const heroEscapes = Number(heroRow.escape_count ?? 0);
      if (heroEscapes >= 3) {
        newCombatState.winner = 'veil';
        newCombatState.log.push({
          type: 'system',
          text: '❌ Keine Fluchten mehr! Flucht verweigert.',
        });
      } else {
        await client.query(
          `UPDATE hero_state
           SET escape_count=escape_count+1,
               visibility=LEAST(10, visibility+2)
           WHERE run_id=$1`,
          [id]
        );
        newCombatState.log.push({
          type: 'system',
          text: `🏃 Flucht ${heroEscapes + 1}/3 verbraucht. Sichtbarkeit +2.`,
        });
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /combat/action error:', err);
    res.status(500).json({ error: 'Fehler bei der Kampfaktion' });
    return;
  } finally {
    client.release();
  }

  res.json(newCombatState);
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /runs/:id/escape  —  Direkte Flucht (außerhalb Kampf)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/escape', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const heroRes = await pool.query(
    `SELECT escape_count FROM hero_state WHERE run_id=$1`, [id]
  );
  const escapeCount = Number(heroRes.rows[0]?.escape_count ?? 0);

  if (escapeCount >= 3)
    return res.status(400).json({ error: 'Keine Fluchten mehr übrig' });

  await pool.query(
    `UPDATE hero_state
     SET escape_count=escape_count+1, visibility=LEAST(10, visibility+2)
     WHERE run_id=$1`,
    [id]
  );

  res.json({ ok: true, escapesLeft: 2 - escapeCount });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /runs/:id/recap  —  Gebietsabschluss-Daten
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/recap', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const [run, hero, veil, units, nodes, edges, log] = await Promise.all([
    pool.query(`SELECT * FROM runs       WHERE id=$1 AND user_id=$2`, [id, req.userId]),
    pool.query(`SELECT * FROM hero_state WHERE run_id=$1`,            [id]),
    pool.query(`SELECT * FROM veil_state WHERE run_id=$1`,            [id]),
    pool.query(`SELECT * FROM army_units WHERE run_id=$1`,            [id]),
    pool.query(`SELECT * FROM map_nodes  WHERE run_id=$1`,            [id]),
    pool.query(`SELECT * FROM map_edges  WHERE run_id=$1`,            [id]),
    pool.query(`SELECT * FROM event_log  WHERE run_id=$1 ORDER BY step`, [id]),
  ]);

  if (!run.rows[0]) return res.status(404).json({ error: 'Run nicht gefunden' });

  res.json({
    run:       run.rows[0],
    hero:      hero.rows[0],
    veil:      veil.rows[0],
    units:     units.rows,
    heroPath:  nodes.rows.filter((n: any) => n.is_visited),
    allNodes:  nodes.rows,
    edges:     edges.rows,
    eventLog:  log.rows,
  });
});

export default router;