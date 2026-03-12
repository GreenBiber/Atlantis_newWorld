// ═══════════════════════════════════════════════════════════════════
// SCHLEIER & DUNKEL — Inventory & Progression API (SRS v3.1)
// ═══════════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { rollLoot, ALL_ITEMS, Item } from '../game/items';
import { rollRuneDrop, detectRuneWord, computeSocketedEffect, veilRuneAction } from '../game/runes';
import { applyCurse, removeCurse, tickCurses, computeCurseEffect, CURSES, clearRegionScopedCurses } from '../game/curses';
import { recruitLeader, checkDepartureConditions, computeLeaderPassiveBonuses, LEADERS } from '../game/leaders';
import { mulberry32 } from '../utils/prng';

export function createInventoryRouter(db: Pool, authMiddleware: any): Router {
  const router = Router();
  router.use(authMiddleware);

  // ── GET /runs/:id/inventory ────────────────────────────────────────
  router.get('/:id/inventory', async (req: Request, res: Response) => {
    const { id: runId } = req.params;
    const userId = (req as any).user.id;

    try {
      const runCheck = await db.query('SELECT id FROM runs WHERE id=$1 AND user_id=$2', [runId, userId]);
      if (!runCheck.rows.length) return res.status(404).json({ error: 'Run nicht gefunden.' });

      const [items, runes, curses, leaders] = await Promise.all([
        db.query('SELECT * FROM inventory WHERE run_id=$1 ORDER BY created_at', [runId]),
        db.query('SELECT * FROM rune_inventory WHERE run_id=$1 AND side=$2', [runId, 'hero']),
        db.query('SELECT * FROM active_curses WHERE run_id=$1 AND side=$2', [runId, 'hero']),
        db.query('SELECT * FROM active_leaders WHERE run_id=$1 AND side=$2 AND is_alive=TRUE', [runId, 'hero']),
      ]);

      res.json({
        items: items.rows,
        runes: runes.rows,
        activeCurses: curses.rows,
        activeLeaders: leaders.rows,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Inventar-Abfrage fehlgeschlagen.' });
    }
  });

  // ── POST /runs/:id/inventory/equip ────────────────────────────────
  router.post('/:id/inventory/equip', async (req: Request, res: Response) => {
    const { id: runId } = req.params;
    const { inventoryId, slot } = req.body;
    const userId = (req as any).user.id;

    try {
      const runCheck = await db.query('SELECT id FROM runs WHERE id=$1 AND user_id=$2 AND status=$3', [runId, userId, 'active']);
      if (!runCheck.rows.length) return res.status(404).json({ error: 'Aktiver Run nicht gefunden.' });

      const client = await db.connect();
      try {
        await client.query('BEGIN');

        const itemCheck = await client.query(
          'SELECT * FROM inventory WHERE id=$1 AND run_id=$2',
          [inventoryId, runId]
        );
        if (!itemCheck.rows.length) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Item nicht gefunden.' });
        }

        const item = itemCheck.rows[0];

        if (slot === 'weapon' || slot === 'armor') {
          await client.query(
            'UPDATE inventory SET equipped=FALSE WHERE run_id=$1 AND slot=$2 AND equipped=TRUE',
            [runId, slot]
          );
        } else if (slot === 'artifact') {
          const artifactCount = await client.query(
            'SELECT COUNT(*) FROM inventory WHERE run_id=$1 AND slot=$2 AND equipped=TRUE',
            [runId, 'artifact']
          );
          if (parseInt(artifactCount.rows[0].count) >= 3) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Maximal 3 Artefakte gleichzeitig ausrüstbar.' });
          }
        }

        await client.query('UPDATE inventory SET equipped=TRUE, slot=$1 WHERE id=$2', [slot, inventoryId]);

        await client.query('COMMIT');
        res.json({ success: true, message: `${item.item_id} ausgerüstet (Slot: ${slot}).` });
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ausrüsten fehlgeschlagen.' });
    }
  });

  // ── POST /runs/:id/inventory/unequip ─────────────────────────────
  router.post('/:id/inventory/unequip', async (req: Request, res: Response) => {
    const { id: runId } = req.params;
    const { inventoryId } = req.body;

    try {
      const result = await db.query(
        'UPDATE inventory SET equipped=FALSE WHERE id=$1 AND run_id=$2 RETURNING *',
        [inventoryId, runId]
      );
      if (!result.rows.length) return res.status(404).json({ error: 'Item nicht gefunden.' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Ablegen fehlgeschlagen.' });
    }
  });

  // ── POST /runs/:id/runes/socket ───────────────────────────────────
  router.post('/:id/runes/socket', async (req: Request, res: Response) => {
    const { id: runId } = req.params;
    const { runeInventoryId, inventoryItemId, slotPosition } = req.body;

    try {
      const client = await db.connect();
      try {
        await client.query('BEGIN');

        const itemCheck = await client.query(
          'SELECT * FROM inventory WHERE id=$1 AND run_id=$2',
          [inventoryItemId, runId]
        );
        if (!itemCheck.rows.length) throw new Error('Item nicht gefunden.');
        const inventoryItem = itemCheck.rows[0];

        const runeCheck = await client.query(
          'SELECT * FROM rune_inventory WHERE id=$1 AND run_id=$2 AND side=$3',
          [runeInventoryId, runId, 'hero']
        );
        if (!runeCheck.rows.length) throw new Error('Rune nicht gefunden.');

        const itemDef = ALL_ITEMS.get(inventoryItem.item_id);
        if (!itemDef) throw new Error('Item-Definition nicht gefunden.');

        const currentRunes: string[] = inventoryItem.rune_slots || [];
        if (currentRunes.length >= itemDef.runeSlots) {
          throw new Error(`Item hat nur ${itemDef.runeSlots} Runen-Slots.`);
        }

        const newRunes = [...currentRunes];
        newRunes[slotPosition] = runeCheck.rows[0].rune_id;

        const { runeWord } = computeSocketedEffect(newRunes.filter(Boolean));

        await client.query(
          'UPDATE inventory SET rune_slots=$1, active_rune_word=$2 WHERE id=$3',
          [newRunes, runeWord?.id || null, inventoryItemId]
        );

        await client.query(
          'UPDATE rune_inventory SET socketed_into=$1, slot_position=$2 WHERE id=$3',
          [inventoryItemId, slotPosition, runeInventoryId]
        );

        await client.query('COMMIT');

        res.json({
          success: true,
          activeRuneWord: runeWord ? { id: runeWord.id, name: runeWord.name, description: runeWord.description } : null,
          message: runeWord ? `Runenwort aktiviert: ${runeWord.name}!` : 'Rune gesockelt.',
        });
      } catch (e: any) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: e.message });
      } finally {
        client.release();
      }
    } catch (err) {
      res.status(500).json({ error: 'Sockeln fehlgeschlagen.' });
    }
  });

  // ── POST /runs/:id/runes/unsocket ────────────────────────────────
  router.post('/:id/runes/unsocket', async (req: Request, res: Response) => {
    const { id: runId } = req.params;
    const { runeInventoryId } = req.body;

    try {
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        const runeCheck = await client.query(
          'SELECT * FROM rune_inventory WHERE id=$1 AND run_id=$2',
          [runeInventoryId, runId]
        );
        if (!runeCheck.rows.length || !runeCheck.rows[0].socketed_into) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Rune ist nicht gesockelt.' });
        }

        const { socketed_into, slot_position } = runeCheck.rows[0];

        const itemCheck = await client.query('SELECT rune_slots FROM inventory WHERE id=$1', [socketed_into]);
        const slots: string[] = itemCheck.rows[0]?.rune_slots || [];
        slots[slot_position] = '';
        const newRunes = slots.filter(Boolean);
        const { runeWord } = computeSocketedEffect(newRunes);

        await client.query(
          'UPDATE inventory SET rune_slots=$1, active_rune_word=$2 WHERE id=$3',
          [newRunes, runeWord?.id || null, socketed_into]
        );
        await client.query(
          'UPDATE rune_inventory SET socketed_into=NULL, slot_position=NULL WHERE id=$1',
          [runeInventoryId]
        );

        await client.query('COMMIT');
        res.json({ success: true });
      } catch (e: any) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: e.message });
      } finally {
        client.release();
      }
    } catch (err) {
      res.status(500).json({ error: 'Unsockeln fehlgeschlagen.' });
    }
  });

  // ── POST /runs/:id/curses/remove ────────────────────────────────
  router.post('/:id/curses/remove', async (req: Request, res: Response) => {
    const { id: runId } = req.params;
    const { curseId, method } = req.body;
    const userId = (req as any).user.id;

    try {
      const runCheck = await db.query(
        'SELECT hs.gold FROM runs r JOIN hero_state hs ON hs.run_id=r.id WHERE r.id=$1 AND r.user_id=$2',
        [runId, userId]
      );
      if (!runCheck.rows.length) return res.status(404).json({ error: 'Run nicht gefunden.' });

      const client = await db.connect();
      try {
        await client.query('BEGIN');

        if (method === 'merchant') {
          const cost = 40;
          if (runCheck.rows[0].gold < cost) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: `Zu wenig Gold. Händler verlangt ${cost}G.` });
          }
          await client.query('UPDATE hero_state SET gold=gold-$1 WHERE run_id=$2', [cost, runId]);
        }

        await client.query(
          'DELETE FROM active_curses WHERE run_id=$1 AND curse_id=$2 AND side=$3',
          [runId, curseId, 'hero']
        );

        await client.query('COMMIT');
        res.json({ success: true, message: `Fluch ${curseId} entfernt.` });
      } catch (e: any) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: e.message });
      } finally {
        client.release();
      }
    } catch (err) {
      res.status(500).json({ error: 'Fluch-Entfernung fehlgeschlagen.' });
    }
  });

  // ── POST /runs/:id/leaders/recruit ──────────────────────────────
  router.post('/:id/leaders/recruit', async (req: Request, res: Response) => {
    const { id: runId } = req.params;
    const { leaderId } = req.body;
    const userId = (req as any).user.id;

    try {
      const leader = LEADERS.find(l => l.id === leaderId);
      if (!leader) return res.status(400).json({ error: 'Unbekannter Anführer.' });

      const client = await db.connect();
      try {
        await client.query('BEGIN');

        const activeCount = await client.query(
          'SELECT COUNT(*) FROM active_leaders WHERE run_id=$1 AND side=$2 AND is_alive=TRUE',
          [runId, 'hero']
        );
        if (parseInt(activeCount.rows[0].count) >= 3) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Maximal 3 Anführer gleichzeitig.' });
        }

        if (leader.recruitmentCost > 0) {
          const goldCheck = await client.query('SELECT gold FROM hero_state WHERE run_id=$1', [runId]);
          if (goldCheck.rows[0].gold < leader.recruitmentCost) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: `Zu wenig Gold. Rekrutierung kostet ${leader.recruitmentCost}G.` });
          }
          await client.query('UPDATE hero_state SET gold=gold-$1 WHERE run_id=$2', [leader.recruitmentCost, runId]);
        }

        const stepCheck = await client.query('SELECT step FROM hero_state WHERE run_id=$1', [runId]);
        const step = stepCheck.rows[0]?.step || 0;

        await client.query(`
          INSERT INTO active_leaders (run_id, leader_id, side, current_hp, max_hp, recruited_at_step)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [runId, leaderId, 'hero', leader.hp, leader.maxHp, step]);

        await client.query('COMMIT');
        res.json({
          success: true,
          message: `${leader.name} ist deiner Armee beigetreten.`,
          leader: {
            id: leader.id,
            name: leader.name,
            class: leader.class,
            ability: leader.ability.name,
            departureCondition: leader.departureCondition,
          },
        });
      } catch (e: any) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: e.message });
      } finally {
        client.release();
      }
    } catch (err) {
      res.status(500).json({ error: 'Rekrutierung fehlgeschlagen.' });
    }
  });

  // ── GET /runs/:id/leaders ────────────────────────────────────────
  router.get('/:id/leaders', async (req: Request, res: Response) => {
    const { id: runId } = req.params;
    try {
      const leaders = await db.query(
        'SELECT * FROM active_leaders WHERE run_id=$1 ORDER BY recruited_at_step',
        [runId]
      );
      res.json({ leaders: leaders.rows });
    } catch (err) {
      res.status(500).json({ error: 'Fehler beim Laden der Anführer.' });
    }
  });

  // ── POST /runs/:id/loot/roll ─────────────────────────────────────
  router.post('/:id/loot/roll', async (req: Request, res: Response) => {
    const { id: runId } = req.params;
    const { risk, region, seed } = req.body;
    const userId = (req as any).user.id;

    try {
      const runCheck = await db.query(
        'SELECT r.id, hs.step FROM runs r JOIN hero_state hs ON hs.run_id=r.id WHERE r.id=$1 AND r.user_id=$2',
        [runId, userId]
      );
      if (!runCheck.rows.length) return res.status(404).json({ error: 'Run nicht gefunden.' });

      const rng = mulberry32(seed || Date.now());
      const item = rollLoot(risk, region, rng);
      const rune = risk === 'red' ? rollRuneDrop(rng, 'hero') : null;

      if (!item && !rune) {
        return res.json({ item: null, rune: null, message: 'Kein Loot.' });
      }

      const client = await db.connect();
      try {
        await client.query('BEGIN');
        const step = runCheck.rows[0].step;

        let savedItem = null;
        if (item) {
          const result = await client.query(`
            INSERT INTO inventory (run_id, item_id, slot, equipped, rune_slots, acquired_at_step, acquired_from)
            VALUES ($1, $2, $3, FALSE, $4, $5, $6)
            RETURNING *
          `, [runId, item.id, item.slot, [], step, 'room_loot']);
          savedItem = result.rows[0];
        }

        let savedRune = null;
        if (rune) {
          const result = await client.query(`
            INSERT INTO rune_inventory (run_id, rune_id, side, acquired_at_step)
            VALUES ($1, $2, $3, $4)
            RETURNING *
          `, [runId, rune.id, 'hero', step]);
          savedRune = result.rows[0];
        }

        await client.query('COMMIT');
        res.json({
          item: savedItem ? { ...savedItem, definition: item } : null,
          rune: savedRune ? { ...savedRune, definition: rune } : null,
        });
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Loot-Roll fehlgeschlagen.' });
    }
  });

  return router;
}

// ═══════════════════════════════════════════════════════════════════
// HELPER: Loot nach Raum anwenden (für execute-Route)
// ═══════════════════════════════════════════════════════════════════
export async function applyLootAfterRoom(
  db: Pool,
  runId: string,
  nodeKey: string,
  risk: 'green' | 'yellow' | 'red',
  region: string,
  step: number,
  rng: () => number
): Promise<{ item: Item | null; runeId: string | null }> {
  const item = rollLoot(risk, region, rng);
  const rune = risk === 'red' ? rollRuneDrop(rng, 'hero') : null;

  if (item) {
    await db.query(`
      INSERT INTO inventory (run_id, item_id, slot, equipped, rune_slots, acquired_at_step, acquired_from)
      VALUES ($1, $2, $3, FALSE, '{}', $4, $5)
    `, [runId, item.id, item.slot, step, `room_${nodeKey}`]);
  }

  if (rune) {
    await db.query(`
      INSERT INTO rune_inventory (run_id, rune_id, side, acquired_at_step)
      VALUES ($1, $2, $3, $4)
    `, [runId, rune.id, 'hero', step]);
  }

  return { item, runeId: rune?.id || null };
}

export async function applyVeilRuneSteal(
  db: Pool,
  runId: string,
  veilStage: number,
  rng: () => number
): Promise<string | null> {
  const heroRunes = await db.query(
    'SELECT id, rune_id FROM rune_inventory WHERE run_id=$1 AND side=$2',
    [runId, 'hero']
  );

  if (!heroRunes.rows.length) return null;

  const heroRuneIds = heroRunes.rows.map((r: any) => r.rune_id);
  const result = veilRuneAction(heroRuneIds, veilStage, rng);

  if (!result.success || !result.stolenRuneId) return null;

  const targetRow = heroRunes.rows.find((r: any) => r.rune_id === result.stolenRuneId);
  if (targetRow) {
    if (result.message.includes('ZERSTÖRT')) {
      await db.query('DELETE FROM rune_inventory WHERE id=$1', [targetRow.id]);
    } else {
      await db.query('UPDATE rune_inventory SET side=$1 WHERE id=$2', ['veil', targetRow.id]);
    }
  }

  return result.message;
}