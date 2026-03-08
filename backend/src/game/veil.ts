import { createRng } from '../utils/prng';
import { GameGraph, MapNode } from './graph';

export interface VeilState {
  stage: number;
  huntersActive: boolean;
  budget: number;
  currentNode: string;
  bossId: string;
  bossHp: number;
  bossActive: boolean;
  escapeCount: number;
}

export interface ArmyUnits {
  soeldner: number;
  waechter: number;
  klaue: number;
  [key: string]: number;
}

// ── Schleier-Risikoabwägung (SRS Kapitel 2.1) ──
function riskScore(
  node: MapNode,
  veilStrength: number,
  rng: () => number
): number {
  const riskValue = node.risk === 'green' ? 1 : node.risk === 'yellow' ? 3 : 6;
  return riskValue * 2 - veilStrength / 10 + (rng() * 2 - 1);
}

function armyStrength(army: ArmyUnits): number {
  return (army.soeldner || 0) * 2 +
         (army.waechter || 0) * 5 +
         (army.klaue || 0) * 10;
}

// ── Schleier-Route berechnen (SRS Kapitel 4) ──
export function computeVeilRoute(
  graph: GameGraph,
  veilNode: string,
  heroNode: string,
  veilArmy: ArmyUnits,
  veilVisited: Set<string>,
  seed: number,
  step: number
): string[] {
  const rng = createRng(seed + step);
  const nodes = graph.nodes;
  const veilStr = armyStrength(veilArmy);
  const route: string[] = [];
  let current = veilNode;

  for (let s = 0; s < 4; s++) {
    const node = nodes[current];
    if (!node || !node.neighbors.length) break;

    // Kandidaten filtern
    let candidates = node.neighbors.filter(n => nodes[n]);

    // Bevorzuge unbesuchte Knoten
    const unvisited = candidates.filter(n => !veilVisited.has(n));
    if (unvisited.length > 0) candidates = unvisited;

    // Bewerte jeden Kandidaten
    const scored = candidates.map(n => {
      const nd = nodes[n];
      const risk = riskScore(nd, veilStr, rng.next);

      // Nähe zum Held erhöht Aggressivität bei höherer Stufe
      const heroNodeObj = nodes[heroNode];
      const dist = heroNodeObj
        ? Math.hypot(nd.x - heroNodeObj.x, nd.y - heroNodeObj.y)
        : 1;
      const heroProximity = 1 / (dist + 0.1);

      // Exit vermeiden
      const exitPenalty = nd.type === 'exit' ? 5 : 0;

      return {
        key: n,
        score: risk - heroProximity * 0.3 + exitPenalty,
      };
    });

    // Niedrigster Score = bevorzugte Wahl
    scored.sort((a, b) => a.score - b.score);
    const chosen = scored[0].key;
    route.push(chosen);
    current = chosen;
  }

  return route;
}

// ── Schleier-Eskalation (SRS Kapitel 9.1) ──
export function updateVeilStage(
  threat: number,
  visibility: number,
  corruption: number,
  step: number
): number {
  const sum = threat + visibility + corruption;
  if (sum <= 4) return 1;
  if (sum <= 7) return 2;
  if (sum <= 10) return 3;
  if (sum <= 13) return 4;
  return 5;
}

// ── Schleier-Aktionen (SRS Kapitel 9.2) ──
export interface VeilActionResult {
  type: string;
  targetEdge?: { from: string; to: string };
  huntersActive?: boolean;
  armyBonus?: Partial<ArmyUnits>;
}

export function applyVeilAction(
  stage: number,
  veilArmy: ArmyUnits,
  heroVisibility: number,
  graph: GameGraph,
  heroNode: string,
  seed: number,
  step: number
): VeilActionResult | null {
  const rng = createRng(seed + step + 9999);
  const budget = stage;
  const roll = rng.next();

  // Stufe I: Keine aggressiven Aktionen
  if (stage <= 1) {
    if (roll < 0.5) {
      return {
        type: 'army_growth',
        armyBonus: { soeldner: rng.int(1, 2) },
      };
    }
    return null;
  }

  // Jäger aktivieren (V3)
  if (budget >= 2 && roll < 0.2 && heroVisibility >= 3) {
    return { type: 'hunters_active', huntersActive: true };
  }

  // Kante blockieren (V4)
  if (budget >= 2 && roll < 0.4) {
    const edges = graph.edges.filter(
      e => e.from !== heroNode && e.to !== heroNode && !e.blocked
    );
    if (edges.length) {
      const target = rng.pick(edges);
      return { type: 'block_edge', targetEdge: { from: target.from, to: target.to } };
    }
  }

  // Armee wachsen lassen
  if (roll < 0.7) {
    const bonus: Partial<ArmyUnits> = { soeldner: rng.int(1, 3) };
    if (stage >= 3) bonus.waechter = 1;
    return { type: 'army_growth', armyBonus: bonus };
  }

  return null;
}

// ── Schleier flieht? (SRS Kapitel 7.3) ──
export function shouldVeilFlee(
  veilStr: number,
  veilBaseStr: number,
  escapeCount: number
): boolean {
  if (escapeCount >= 3) return false;
  const ratio = veilStr / Math.max(veilBaseStr, 1);
  return ratio < 0.4;
}