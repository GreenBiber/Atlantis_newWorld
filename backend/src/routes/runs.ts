import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { pool } from '../db/pool';
import { generateGraph } from '../game/graph';

const router = Router();
router.use(authMiddleware);

// POST /runs — neuen Run erstellen
router.post('/', async (req: AuthRequest, res: Response) => {
  const { region, heroClass } = req.body;
  if (!region || !heroClass)
    return res.status(400).json({ error: 'Region und Klasse erforderlich' });

  const seed = Date.now() & 0xffffffff;
  const graph = generateGraph(seed);
  const isKaempfer = heroClass === 'kaempfer';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Run anlegen
    const runResult = await client.query(
      'INSERT INTO runs (user_id, region, hero_class, seed) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.userId, region, heroClass, seed]
    );
    const run = runResult.rows[0];

    // Hero State
    await client.query(
      `INSERT INTO hero_state 
        (run_id, hp, max_hp, armor, mana, max_mana, current_node, learned_skills)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        run.id,
        isKaempfer ? 120 : 80,
        isKaempfer ? 120 : 80,
        isKaempfer ? 8 : 3,
        isKaempfer ? 0 : 80,
        80,
        graph.heroStart,
        isKaempfer ? ['F1', 'F2'] : ['M1', 'M3'],
      ]
    );

    // Veil State
    const bossPool = ['SH1', 'SH3', 'SH5']; // Kämpfer für Grenzlande
    const magePool = ['SH2', 'SH4'];
    const bossId = region === 'grenzlande'
      ? bossPool[Math.floor(Math.random() * bossPool.length)]
      : magePool[Math.floor(Math.random() * magePool.length)];

    await client.query(
      `INSERT INTO veil_state (run_id, current_node, boss_id)
       VALUES ($1, $2, $3)`,
      [run.id, graph.veilStart, bossId]
    );

    // Armee — Hero Seite
    await client.query(
      `INSERT INTO army_units (run_id, side, unit_type, count) VALUES
       ($1, 'hero', 'miliz', 3),
       ($1, 'hero', 'veteran', 0),
       ($1, 'hero', 'elite', 0),
       ($1, 'hero', 'leader', $2),
       ($1, 'hero', 'mage', $3)`,
      [run.id, isKaempfer ? 1 : 0, isKaempfer ? 0 : 1]
    );

    // Armee — Veil Seite
    await client.query(
      `INSERT INTO army_units (run_id, side, unit_type, count) VALUES
       ($1, 'veil', 'soeldner', 3),
       ($1, 'veil', 'waechter', 0),
       ($1, 'veil', 'klaue', 0)`,
      [run.id]
    );

    // Map Nodes speichern
    for (const node of Object.values(graph.nodes)) {
      await client.query(
        `INSERT INTO map_nodes 
          (run_id, node_key, type, risk_color, x, y, revealed, side)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          run.id, node.key, node.type, node.risk,
          node.x, node.y,
          node.isHeroStart || false,
          node.isHeroStart ? 'hero' : node.isVeilStart ? 'veil' : 'neutral',
        ]
      );
    }

    // Map Edges speichern
    for (const edge of graph.edges) {
      await client.query(
        'INSERT INTO map_edges (run_id, from_node, to_node) VALUES ($1, $2, $3)',
        [run.id, edge.from, edge.to]
      );
    }

    await client.query('COMMIT');

    return res.status(201).json({
      run,
      graph,
      heroStart: graph.heroStart,
      veilStart: graph.veilStart,
      exitNode: graph.exitNode,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.status(500).json({ error: 'Fehler beim Erstellen des Runs' });
  } finally {
    client.release();
  }
});

// GET /runs/active — aktiver Run des Users
router.get('/active', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT r.*, h.hp, h.max_hp, h.current_node, h.threat, h.visibility, 
              h.corruption, h.gold, h.escape_count, h.learned_skills
       FROM runs r
       JOIN hero_state h ON h.run_id = r.id
       WHERE r.user_id = $1 AND r.status = 'active'
       ORDER BY r.created_at DESC LIMIT 1`,
      [req.userId]
    );
    return res.json(result.rows[0] || null);
  } catch (err) {
    return res.status(500).json({ error: 'Serverfehler' });
  }
});

// GET /runs/:id — vollständiger Run-State
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const runId = parseInt(req.params.id);
  try {
    const [run, hero, veil, army, nodes, edges] = await Promise.all([
      pool.query('SELECT * FROM runs WHERE id = $1 AND user_id = $2', [runId, req.userId]),
      pool.query('SELECT * FROM hero_state WHERE run_id = $1', [runId]),
      pool.query('SELECT * FROM veil_state WHERE run_id = $1', [runId]),
      pool.query('SELECT * FROM army_units WHERE run_id = $1', [runId]),
      pool.query('SELECT * FROM map_nodes WHERE run_id = $1', [runId]),
      pool.query('SELECT * FROM map_edges WHERE run_id = $1', [runId]),
    ]);

    if (!run.rows[0]) return res.status(404).json({ error: 'Run nicht gefunden' });

    return res.json({
      run: run.rows[0],
      hero: hero.rows[0],
      veil: veil.rows[0],
      army: army.rows,
      nodes: nodes.rows,
      edges: edges.rows,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Serverfehler' });
  }
});

export default router;