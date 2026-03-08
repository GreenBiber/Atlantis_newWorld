import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { generateGraph } from '../game/graph';
import { createRng } from '../utils/prng';
import { calcArmyStrength, executeCombatRound, calcVictoryLoot } from '../game/combat';
import { getEventForRoom, applyEffects, EVENTS } from '../game/events';
import { computeVeilRoute, updateVeilStage, applyVeilAction, shouldVeilFlee } from '../game/veil';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// ── POST /runs ── Neuer Run
router.post('/', async (req: AuthRequest, res: Response) => {
  const { region, heroClass } = req.body;
  if (!region || !heroClass) return res.status(400).json({ error: 'region und heroClass erforderlich' });

  const seed = Date.now() & 0xffffffff;
  const rng = createRng(seed);
  const graph = generateGraph(seed);

  const isKaempfer = heroClass === 'kaempfer';
  const heroStart = graph.heroStart;
  const veilStart = graph.veilStart;

  const VEIL_BOSSES = [
    { id: 'SH1', name: 'Morvaen der Zerrissene', type: 'fighter' },
    { id: 'SH2', name: 'Die Flüsternde', type: 'mage' },
    { id: 'SH3', name: 'Blutrichter Kayn', type: 'fighter' },
    { id: 'SH4', name: 'Nebelspinnerin', type: 'mage' },
    { id: 'SH5', name: 'Der Letzte Wächter', type: 'fighter' },
  ];
  const bossPool = VEIL_BOSSES.filter(b =>
    region === 'grenzlande' ? b.type === 'fighter' : b.type === 'mage'
  );
  const boss = bossPool[rng.int(0, bossPool.length - 1)];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const runRes = await client.query(
      `INSERT INTO runs (user_id, region, seed, status)
       VALUES ($1, $2, $3, 'active') RETURNING id`,
      [req.userId, region, seed]
    );
    const runId = runRes.rows[0].id;

    // Hero state
    await client.query(
      `INSERT INTO hero_state
       (run_id, hero_class, hp, max_hp, armor, mana, max_mana,
        threat, visibility, corruption, gold, escape_count, learned_skills, army_strength)
       VALUES ($1,$2,$3,$4,$5,$6,$7,0,0,0,20,0,$8,0)`,
      [
        runId, heroClass,
        isKaempfer ? 120 : 80,
        isKaempfer ? 120 : 80,
        isKaempfer ? 8 : 3,
        isKaempfer ? 0 : 80,
        80,
        JSON.stringify(isKaempfer ? ['F1', 'F2'] : ['M1', 'M3']),
      ]
    );

    // Veil state
    await client.query(
      `INSERT INTO veil_state
       (run_id, stage, hunters_active, budget, current_node, boss_id, boss_name, boss_hp, boss_max_hp, boss_active)
       VALUES ($1,1,false,0,$2,$3,$4,60,60,true)`,
      [runId, veilStart, boss.id, boss.name]
    );

    // Hero army
    await client.query(
      `INSERT INTO army_units (run_id, side, unit_type, count) VALUES
       ($1,'hero','miliz',3),
       ($1,'hero','veteran',0),
       ($1,'hero','elite',0),
       ($1,'hero','leader',$2),
       ($1,'hero','mage',$3)`,
      [runId, isKaempfer ? 1 : 0, isKaempfer ? 0 : 1]
    );

    // Veil army
    await client.query(
      `INSERT INTO army_units (run_id, side, unit_type, count) VALUES
       ($1,'veil','soeldner',3),
       ($1,'veil','waechter',0),
       ($1,'veil','klaue',0)`,
      [runId]
    );

    // Map nodes
    for (const [key, node] of Object.entries(graph.nodes)) {
      await client.query(
        `INSERT INTO map_nodes (run_id, node_key, node_type, risk_color, x, y, side, is_revealed, is_visited, is_blocked)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false,false)`,
        [
          runId, key, node.type, node.risk,
          node.x, node.y,
          node.isHeroStart ? 'hero' : node.isVeilStart ? 'veil' : 'neutral',
          key === heroStart ||
          (graph.nodes[heroStart]?.neighbors || []).includes(key),
        ]
      );
    }

    // Map edges
    for (const edge of graph.edges) {
      await client.query(
        `INSERT INTO map_edges (run_id, from_node, to_node, is_blocked)
         VALUES ($1,$2,$3,false)`,
        [runId, edge.from, edge.to]
      );
    }

    // Run: set current nodes
    await client.query(
      `UPDATE runs SET current_hero_node=$1, current_veil_node=$2 WHERE id=$3`,
      [heroStart, veilStart, runId]
    );

    await client.query('COMMIT');
    res.json({ runId, heroStart, veilStart, seed, boss: boss.name });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ error: 'Run konnte nicht erstellt werden' });
  } finally {
    client.release();
  }
});

// ── GET /runs/active ──
router.get('/active', async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT id, region, status, created_at FROM runs
     WHERE user_id=$1 AND status='active' ORDER BY created_at DESC LIMIT 1`,
    [req.userId]
  );
  res.json(result.rows[0] || null);
});

// ── GET /runs/:id ──
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const run = await pool.query(
    `SELECT * FROM runs WHERE id=$1 AND user_id=$2`, [id, req.userId]
  );
  if (!run.rows[0]) return res.status(404).json({ error: 'Run nicht gefunden' });

  const [hero, veil, units, nodes, edges, log] = await Promise.all([
    pool.query(`SELECT * FROM hero_state WHERE run_id=$1`, [id]),
    pool.query(`SELECT * FROM veil_state WHERE run_id=$1`, [id]),
    pool.query(`SELECT * FROM army_units WHERE run_id=$1`, [id]),
    pool.query(`SELECT * FROM map_nodes WHERE run_id=$1`, [id]),
    pool.query(`SELECT * FROM map_edges WHERE run_id=$1`, [id]),
    pool.query(`SELECT * FROM event_log WHERE run_id=$1 ORDER BY step ASC`, [id]),
  ]);

  res.json({
    run: run.rows[0],
    hero: hero.rows[0],
    veil: veil.rows[0],
    units: units.rows,
    nodes: nodes.rows,
    edges: edges.rows,
    log: log.rows,
  });
});

// ── POST /runs/:id/plan ── Route speichern
router.post('/:id/plan', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { route } = req.body as { route: string[] };

  if (!Array.isArray(route) || route.length === 0 || route.length > 4) {
    return res.status(400).json({ error: 'Route: 1–4 Knoten erforderlich' });
  }

  const run = await pool.query(
    `SELECT * FROM runs WHERE id=$1 AND user_id=$2 AND status='active'`, [id, req.userId]
  );
  if (!run.rows[0]) return res.status(404).json({ error: 'Aktiver Run nicht gefunden' });

  const currentNode = run.rows[0].current_hero_node;

  // Konnektivität prüfen
  const nodeKeys = [currentNode, ...route];
  for (let i = 0; i < nodeKeys.length - 1; i++) {
    const edgeCheck = await pool.query(
      `SELECT id FROM map_edges
       WHERE run_id=$1 AND is_blocked=false
       AND ((from_node=$2 AND to_node=$3) OR (from_node=$3 AND to_node=$2))`,
      [id, nodeKeys[i], nodeKeys[i + 1]]
    );
    if (!edgeCheck.rows[0]) {
      return res.status(400).json({ error: `Kein gültiger Weg von ${nodeKeys[i]} nach ${nodeKeys[i + 1]}` });
    }
  }

  await pool.query(`UPDATE runs SET planned_route=$1 WHERE id=$2`, [JSON.stringify(route), id]);
  res.json({ ok: true, route });
});

// ── POST /runs/:id/execute ── Beide Routen ausführen
router.post('/:id/execute', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const run = await pool.query(
    `SELECT * FROM runs WHERE id=$1 AND user_id=$2 AND status='active'`, [id, req.userId]
  );
  if (!run.rows[0]) return res.status(404).json({ error: 'Run nicht gefunden' });
  if (!run.rows[0].planned_route) return res.status(400).json({ error: 'Keine Route geplant' });

  const heroRoute: string[] = JSON.parse(run.rows[0].planned_route);
  const [heroRow, veilRow, unitsRes, nodesRes, edgesRes] = await Promise.all([
    pool.query(`SELECT * FROM hero_state WHERE run_id=$1`, [id]),
    pool.query(`SELECT * FROM veil_state WHERE run_id=$1`, [id]),
    pool.query(`SELECT * FROM army_units WHERE run_id=$1`, [id]),
    pool.query(`SELECT * FROM map_nodes WHERE run_id=$1`, [id]),
    pool.query(`SELECT * FROM map_edges WHERE run_id=$1`, [id]),
  ]);

  const hero = heroRow.rows[0];
  const veil = veilRow.rows[0];

  // Army maps
  const heroUnits: Record<string, number> = {};
  const veilUnits: Record<string, number> = {};
  for (const u of unitsRes.rows) {
    if (u.side === 'hero') heroUnits[u.unit_type] = u.count;
    else veilUnits[u.unit_type] = u.count;
  }

  // Graph rekonstruieren
  const nodes: Record<string, any> = {};
  for (const n of nodesRes.rows) nodes[n.node_key] = n;
  const edges: { from: string; to: string }[] = edgesRes.rows.map(e => ({
    from: e.from_node, to: e.to_node,
  }));
  const blockedEdges = new Set(
    edgesRes.rows.filter(e => e.is_blocked).map(e => [e.from_node, e.to_node].sort().join('-'))
  );

  const rng = createRng(Number(run.rows[0].seed) + (run.rows[0].step_count || 0));

  // Schleier-Route berechnen
  const veilGraph = { nodes, edges };
  const veilVisited = new Set<string>(
    nodesRes.rows.filter(n => n.is_visited && nodes[n.node_key]?.side === 'veil').map(n => n.node_key)
  );
  const veilRoute = computeVeilRoute(
    veil.current_node, veilGraph, veilVisited, calcArmyStrength(veilUnits), rng
  );

  const stepResults = [];
  let currentHeroNode = run.rows[0].current_hero_node;
  let currentVeilNode = veil.current_node;

  const heroState = {
    hp: hero.hp, maxHp: hero.max_hp,
    mana: hero.mana, maxMana: hero.max_mana,
    armor: hero.armor,
    gold: hero.gold,
    threat: hero.threat,
    visibility: hero.visibility,
    corruption: hero.corruption,
    escapeCount: hero.escape_count,
  };
  const veilState = {
    stage: veil.stage,
    huntersActive: veil.hunters_active,
    budget: veil.budget,
    bossActive: veil.boss_active,
    bossHp: veil.boss_hp,
  };

  let runFinished = false;
  let runStatus = 'active';

  for (let i = 0; i < heroRoute.length; i++) {
    const heroNode = heroRoute[i];
    const veilNode = veilRoute[i] || currentVeilNode;

    currentHeroNode = heroNode;
    currentVeilNode = veilNode;

    // Nodes als besucht markieren
    await pool.query(
      `UPDATE map_nodes SET is_visited=true, is_revealed=true WHERE run_id=$1 AND node_key=$2`,
      [id, heroNode]
    );
    // Nachbarn enthüllen
    await pool.query(
      `UPDATE map_nodes SET is_revealed=true WHERE run_id=$1 AND node_key IN (
         SELECT CASE WHEN from_node=$2 THEN to_node ELSE from_node END
         FROM map_edges WHERE run_id=$1 AND (from_node=$2 OR to_node=$2)
       )`,
      [id, heroNode]
    );

    // Exit erreicht?
    const nodeData = nodes[heroNode];
    if (nodeData?.node_type === 'exit') {
      stepResults.push({ step: i + 1, node: heroNode, type: 'exit' });
      runFinished = true;
      runStatus = 'completed';
      break;
    }

    // Begegnung?
    if (heroNode === veilNode) {
      const heroStr = calcArmyStrength(heroUnits) + heroState.hp / 5;
      const veilStr = calcArmyStrength(veilUnits);

      stepResults.push({
        step: i + 1, node: heroNode, type: 'encounter',
        heroStr: Math.floor(heroStr), veilStr: Math.floor(veilStr),
        veilBoss: veil.boss_name,
      });
    } else {
      // Event
      const event = getEventForRoom(
        nodeData?.node_type || 'neutral',
        nodeData?.risk_color || 'green',
        run.rows[0].region,
        Number(run.rows[0].seed),
        i + (run.rows[0].step_count || 0)
      );

      // Auto-apply erste Choice als Preview (User entscheidet später via /event/choose)
      stepResults.push({
        step: i + 1, node: heroNode, type: 'event',
        eventId: event.id, eventName: event.name,
        eventIcon: event.icon, eventText: event.text,
        choices: event.choices.map(c => ({ label: c.label, text: c.text })),
      });

      // Army wächst nach Raum
      const risk = nodeData?.risk_color || 'green';
      if (risk === 'green') {
        heroUnits.miliz = (heroUnits.miliz || 0) + rng.int(1, 2);
        heroState.maxHp += 5;
        heroState.hp = Math.min(heroState.maxHp, heroState.hp + 5);
      } else if (risk === 'yellow') {
        heroUnits.miliz = (heroUnits.miliz || 0) + rng.int(1, 2);
        if (rng.chance(30)) heroUnits.veteran = (heroUnits.veteran || 0) + 1;
        heroState.maxHp += 10;
      } else if (risk === 'red') {
        heroUnits.miliz = (heroUnits.miliz || 0) + rng.int(2, 4);
        if (rng.chance(20)) heroUnits.elite = (heroUnits.elite || 0) + 1;
        heroState.maxHp += 15;
      }

      // Schleier-Armee wächst
      veilUnits.soeldner = (veilUnits.soeldner || 0) + rng.int(1, 2);
      if (rng.chance(25)) veilUnits.waechter = (veilUnits.waechter || 0) + 1;
    }

    // Schleier-Eskalation
    const newStage = updateVeilStage(heroState.threat, heroState.visibility, heroState.corruption);
    veilState.stage = newStage;
    applyVeilAction(veilState, veilUnits, blockedEdges, edges, currentHeroNode, rng);
  }

  // DB updaten
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE hero_state SET
         hp=$1, max_hp=$2, mana=$3, armor=$4, gold=$5,
         threat=$6, visibility=$7, corruption=$8, army_strength=$9
       WHERE run_id=$10`,
      [
        heroState.hp, heroState.maxHp, heroState.mana, heroState.armor,
        heroState.gold, heroState.threat, heroState.visibility, heroState.corruption,
        calcArmyStrength(heroUnits), id,
      ]
    );

    await client.query(
      `UPDATE veil_state SET stage=$1, hunters_active=$2, current_node=$3 WHERE run_id=$4`,
      [veilState.stage, veilState.huntersActive, currentVeilNode, id]
    );

    for (const [type, count] of Object.entries(heroUnits)) {
      await client.query(
        `INSERT INTO army_units (run_id, side, unit_type, count)
         VALUES ($1,'hero',$2,$3)
         ON CONFLICT (run_id, side, unit_type) DO UPDATE SET count=$3`,
        [id, type, count]
      );
    }
    for (const [type, count] of Object.entries(veilUnits)) {
      await client.query(
        `INSERT INTO army_units (run_id, side, unit_type, count)
         VALUES ($1,'veil',$2,$3)
         ON CONFLICT (run_id, side, unit_type) DO UPDATE SET count=$3`,
        [id, type, count]
      );
    }

    await client.query(
      `UPDATE runs SET
         current_hero_node=$1, current_veil_node=$2,
         planned_route=NULL,
         step_count=COALESCE(step_count,0)+$3,
         status=$4
       WHERE id=$5`,
      [currentHeroNode, currentVeilNode, heroRoute.length, runStatus, id]
    );

    // Blockierte Kanten speichern
    for (const edgeKey of blockedEdges) {
      const [from, to] = edgeKey.split('-');
      await client.query(
        `UPDATE map_edges SET is_blocked=true
         WHERE run_id=$1 AND ((from_node=$2 AND to_node=$3) OR (from_node=$3 AND to_node=$2))`,
        [id, from, to]
      );
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  res.json({ steps: stepResults, runStatus, currentHeroNode, currentVeilNode });
});

// ── POST /runs/:id/event/choose ── Event-Wahl anwenden
router.post('/:id/event/choose', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { eventId, choiceIndex } = req.body;

  const event = EVENTS.find(e => e.id === eventId);
  if (!event) return res.status(400).json({ error: 'Event nicht gefunden' });
  const choice = event.choices[choiceIndex];
  if (!choice) return res.status(400).json({ error: 'Ungültige Wahl' });

  const [heroRow, unitsRes] = await Promise.all([
    pool.query(`SELECT * FROM hero_state WHERE run_id=$1`, [id]),
    pool.query(`SELECT * FROM army_units WHERE run_id=$1 AND side='hero'`, [id]),
  ]);

  const hero = heroRow.rows[0];
  const heroState = {
    hp: hero.hp, maxHp: hero.max_hp,
    mana: hero.mana, maxMana: hero.max_mana,
    gold: hero.gold, threat: hero.threat,
    visibility: hero.visibility, corruption: hero.corruption,
  };
  const army: Record<string, number> = {};
  for (const u of unitsRes.rows) army[u.unit_type] = u.count;

  applyEffects(heroState, army, choice.effects);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE hero_state SET hp=$1,max_hp=$2,mana=$3,gold=$4,threat=$5,visibility=$6,corruption=$7
       WHERE run_id=$8`,
      [heroState.hp, heroState.maxHp, heroState.mana, heroState.gold,
       heroState.threat, heroState.visibility, heroState.corruption, id]
    );

    for (const [type, count] of Object.entries(army)) {
      await client.query(
        `INSERT INTO army_units (run_id, side, unit_type, count) VALUES ($1,'hero',$2,$3)
         ON CONFLICT (run_id, side, unit_type) DO UPDATE SET count=$3`,
        [id, type, count]
      );
    }

    await client.query(
      `INSERT INTO event_log (run_id, step, node_key, event_id, choice_label, effects)
       VALUES ($1, (SELECT COALESCE(step_count,0) FROM runs WHERE id=$1), '', $2, $3, $4)`,
      [id, eventId, choice.label, JSON.stringify(choice.effects)]
    );

    if (heroState.hp <= 0) {
      await client.query(`UPDATE runs SET status='dead' WHERE id=$1`, [id]);
    }

    await client.query('COMMIT');
    res.json({ ok: true, effects: choice.effects, resultText: choice.text, heroState, army });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});

// ── POST /runs/:id/combat/action ──
router.post('/:id/combat/action', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { action, combatState } = req.body as {
    action: 'attack' | 'defend' | 'escape';
    combatState: any;
  };

  const [heroRow, veilRow, unitsRes] = await Promise.all([
    pool.query(`SELECT * FROM hero_state WHERE run_id=$1`, [id]),
    pool.query(`SELECT * FROM veil_state WHERE run_id=$1`, [id]),
    pool.query(`SELECT * FROM army_units WHERE run_id=$1`, [id]),
  ]);

  const hero = heroRow.rows[0];
  const veil = veilRow.rows[0];
  const heroUnits: Record<string, number> = {};
  const veilUnits: Record<string, number> = {};
  for (const u of unitsRes.rows) {
    if (u.side === 'hero') heroUnits[u.unit_type] = u.count;
    else veilUnits[u.unit_type] = u.count;
  }

  const run = await pool.query(`SELECT seed, step_count FROM runs WHERE id=$1`, [id]);
  const seed = Number(run.rows[0].seed);
  const step = run.rows[0].step_count || 0;

  const newCombatState = executeCombatRound(
    combatState,
    action,
    calcArmyStrength(heroUnits),
    calcArmyStrength(veilUnits),
    hero.armor,
    veil.stage,
    seed + step + (combatState.round || 0)
  );

  if (newCombatState.finished) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (newCombatState.winner === 'hero') {
        const loot = calcVictoryLoot(newCombatState.veilBaseStr, Math.random);
        await client.query(
          `UPDATE hero_state SET gold=gold+$1, threat=LEAST(10,threat+1) WHERE run_id=$2`,
          [loot.gold, id]
        );
        // Schleier-Armee reduzieren
        await client.query(
          `UPDATE army_units SET count=FLOOR(count*0.3) WHERE run_id=$1 AND side='veil'`, [id]
        );
        newCombatState.log.push({ type: 'hero', text: `+${loot.gold} Gold` });

        // Schleier tot?
        const veilStr = calcArmyStrength(veilUnits) * 0.3;
        if (veilStr <= 0 && !veil.boss_active) {
          await client.query(`UPDATE runs SET status='schleier_besiegt' WHERE id=$1`, [id]);
        }
      } else if (newCombatState.winner === 'veil') {
        await client.query(`UPDATE runs SET status='dead' WHERE id=$1`, [id]);
        await client.query(
          `UPDATE hero_state SET hp=0 WHERE run_id=$1`, [id]
        );
      } else if (newCombatState.winner === 'fled') {
        await client.query(
          `UPDATE hero_state SET escape_count=escape_count+1, visibility=LEAST(10,visibility+2) WHERE run_id=$1`, [id]
        );
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  res.json(newCombatState);
});

// ── POST /runs/:id/escape ──
router.post('/:id/escape', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const heroRow = await pool.query(
    `SELECT escape_count FROM hero_state WHERE run_id=$1`, [id]
  );
  if (heroRow.rows[0].escape_count >= 3) {
    return res.status(400).json({ error: 'Keine Fluchten mehr übrig' });
  }

  await pool.query(
    `UPDATE hero_state SET escape_count=escape_count+1, visibility=LEAST(10,visibility+2) WHERE run_id=$1`, [id]
  );
  res.json({ ok: true, escapesLeft: 2 - heroRow.rows[0].escape_count });
});

// ── GET /runs/:id/recap ──
router.get('/:id/recap', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const [run, hero, veil, units, nodes, edges, log] = await Promise.all([
    pool.query(`SELECT * FROM runs WHERE id=$1 AND user_id=$2`, [id, req.userId]),
    pool.query(`SELECT * FROM hero_state WHERE run_id=$1`, [id]),
    pool.query(`SELECT * FROM veil_state WHERE run_id=$1`, [id]),
    pool.query(`SELECT * FROM army_units WHERE run_id=$1`, [id]),
    pool.query(`SELECT * FROM map_nodes WHERE run_id=$1`, [id]),
    pool.query(`SELECT * FROM map_edges WHERE run_id=$1`, [id]),
    pool.query(`SELECT * FROM event_log WHERE run_id=$1 ORDER BY step`, [id]),
  ]);

  if (!run.rows[0]) return res.status(404).json({ error: 'Run nicht gefunden' });

  res.json({
    run: run.rows[0],
    hero: hero.rows[0],
    veil: veil.rows[0],
    units: units.rows,
    heroPath: nodes.rows.filter(n => n.is_visited),
    allNodes: nodes.rows,
    edges: edges.rows,
    eventLog: log.rows,
  });
});

export default router;