import { mulberry32 } from '../utils/prng';

export interface MapNode {
  key: string;
  type: 'start' | 'exit' | 'neutral' | 'event' | 'special' | 'mentor' | 'command';
  risk: 'green' | 'yellow' | 'red';
  x: number;
  y: number;
  neighbors: string[];
  isHeroStart?: boolean;
  isVeilStart?: boolean;
  tags: string[];
}

export interface MapEdge {
  from: string;
  to: string;
  blocked: boolean;
}

export interface GameGraph {
  nodes: Record<string, MapNode>;
  edges: MapEdge[];
  heroStart: string;
  veilStart: string;
  exitNode: string;
}

export function generateGraph(seed: number): GameGraph {
  const rng = mulberry32(seed);
  const seededInt = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
  const seededPick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
  const seededChance = (pct: number) => rng() * 100 < pct;

  function pickRisk(): 'green' | 'yellow' | 'red' {
    const r = rng();
    if (r < 0.45) return 'green';
    if (r < 0.80) return 'yellow';
    return 'red';
  }

  const nodes: Record<string, MapNode> = {};
  const edges: MapEdge[] = [];
  const layers = [1, 3, 4, 4, 3, 1];
  let nid = 0;
  const layerNodes: string[][] = [];

  // Knoten erstellen
  for (let li = 0; li < layers.length; li++) {
    layerNodes.push([]);
    for (let ni = 0; ni < layers[li]; ni++) {
      const key = `N${String(nid).padStart(2, '0')}`;
      const xFrac = layers[li] === 1 ? 0.5 : ni / (layers[li] - 1);
      const yFrac = li / (layers.length - 1);
      const jx = (rng() - 0.5) * 0.12;
      const jy = (rng() - 0.5) * 0.06;

      let type: MapNode['type'] = 'event';
      if (rng() < 0.65) type = 'neutral';
      if (rng() < 0.08) type = 'special';

      nodes[key] = {
        key, type,
        risk: pickRisk(),
        x: Math.min(0.92, Math.max(0.08, xFrac + jx)),
        y: Math.min(0.92, Math.max(0.08, yFrac + jy)),
        neighbors: [],
        tags: [],
      };
      layerNodes[li].push(key);
      nid++;
    }
  }

  // Layer verbinden
  for (let li = 0; li < layers.length - 1; li++) {
    const curr = layerNodes[li];
    const next = layerNodes[li + 1];

    curr.forEach(c => {
      const count = seededInt(1, 2);
      const targets = [...next].sort(() => rng() - 0.5).slice(0, count);
      targets.forEach(t => {
        if (!nodes[c].neighbors.includes(t)) {
          nodes[c].neighbors.push(t);
          nodes[t].neighbors.push(c);
          edges.push({ from: c, to: t, blocked: false });
        }
      });
    });

    // Sicherstellen dass alle next-layer Knoten verbunden sind
    next.forEach(n => {
      if (!nodes[n].neighbors.some(nb => layerNodes[li].includes(nb))) {
        const c = seededPick(curr);
        if (!nodes[n].neighbors.includes(c)) {
          nodes[n].neighbors.push(c);
          nodes[c].neighbors.push(n);
          edges.push({ from: c, to: n, blocked: false });
        }
      }
    });
  }

  // Shortcuts innerhalb Layer
  for (let li = 1; li < layers.length - 1; li++) {
    const layer = layerNodes[li];
    if (layer.length >= 2) {
      for (let i = 0; i < layer.length - 1; i++) {
        if (seededChance(35)) {
          const a = layer[i], b = layer[i + 1];
          if (!nodes[a].neighbors.includes(b)) {
            nodes[a].neighbors.push(b);
            nodes[b].neighbors.push(a);
            edges.push({ from: a, to: b, blocked: false });
          }
        }
      }
    }
  }

  // Start/Exit/Spezialräume
  const heroStart = layerNodes[0][0];
  const veilStart = layerNodes[layers.length - 1][0];
  const exitNode = layerNodes[Math.floor(layers.length / 2)][0];

  nodes[heroStart].type = 'start';
  nodes[heroStart].risk = 'green';
  nodes[heroStart].isHeroStart = true;

  nodes[veilStart].type = 'start';
  nodes[veilStart].risk = 'green';
  nodes[veilStart].isVeilStart = true;

  nodes[exitNode].type = 'exit';
  nodes[exitNode].risk = 'green';

  // Spezialräume zuweisen
  const allKeys = Object.keys(nodes).filter(
    k => k !== heroStart && k !== veilStart && k !== exitNode
  );

  const mentorKey = seededPick(allKeys.slice(2, 8));
  if (mentorKey) { nodes[mentorKey].type = 'mentor'; nodes[mentorKey].risk = 'yellow'; }

  const cmdKey = seededPick(allKeys.slice(5, 12));
  if (cmdKey) { nodes[cmdKey].type = 'command'; nodes[cmdKey].risk = 'red'; }

  return { nodes, edges, heroStart, veilStart, exitNode };
}