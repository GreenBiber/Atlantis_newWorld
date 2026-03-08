import { createRng } from '../utils/prng';

export interface CombatUnit {
  type: string;
  count: number;
  strength: number;
}

export interface CombatState {
  round: number;
  heroStr: number;
  veilStr: number;
  heroBaseStr: number;
  veilBaseStr: number;
  log: CombatLogEntry[];
  finished: boolean;
  winner?: 'hero' | 'veil' | 'fled';
}

export interface CombatLogEntry {
  type: 'hero' | 'veil' | 'system';
  text: string;
}

// ── Armee-Stärke berechnen (SRS Kapitel 7.2) ──
export function calcArmyStrength(units: Record<string, number>): number {
  const strengths: Record<string, number> = {
    miliz: 2, veteran: 5, elite: 10, leader: 20, mage: 8,
    soeldner: 2, waechter: 5, klaue: 10,
  };
  return Object.entries(units).reduce((sum, [type, count]) => {
    return sum + (strengths[type] || 0) * count;
  }, 0);
}

// ── Basis-Schaden (SRS Kapitel 7.2) ──
function calcDamage(
  attackStr: number,
  armor: number,
  armyBonus: number,
  rng: () => number
): number {
  const base = Math.max(1, attackStr - armor / 2);
  const withArmy = base * (1 + armyBonus / 20);
  const crit = rng() < 0.05 ? 1.5 : 1.0;
  return Math.floor(withArmy * crit);
}

// ── Flucht-Chance (SRS Kapitel 7.2) ──
export function calcEscapeChance(veilStage: number): number {
  return Math.max(10, 60 - veilStage * 10);
}

// ── Kampfrunde ausführen ──
export function executeCombatRound(
  state: CombatState,
  action: 'attack' | 'defend' | 'escape',
  heroArmyCount: number,
  veilArmyCount: number,
  heroArmor: number,
  veilStage: number,
  seed: number
): CombatState {
  const rng = createRng(seed + state.round);
  const newState = { ...state, round: state.round + 1, log: [...state.log] };

  if (action === 'escape') {
    const chance = calcEscapeChance(veilStage);
    if (rng.next() * 100 < chance) {
      newState.finished = true;
      newState.winner = 'fled';
      newState.log.push({
        type: 'system',
        text: `🏃 Flucht erfolgreich! (${chance}% Chance)`,
      });
    } else {
      newState.log.push({
        type: 'system',
        text: `❌ Flucht fehlgeschlagen! Der Schleier schneidet den Weg ab.`,
      });
      // Schleier greift trotzdem an
      const veilAtk = calcDamage(
        newState.veilStr * 0.25, heroArmor, veilArmyCount, rng.next
      );
      newState.heroStr = Math.max(0, newState.heroStr - veilAtk);
      newState.log.push({
        type: 'veil',
        text: `👁 Schleier nutzt die Chance! Schaden: ${veilAtk}`,
      });
    }
    return newState;
  }

  if (action === 'attack') {
    // Held greift an
    const heroAtk = calcDamage(
      newState.heroStr * 0.35, 0, heroArmyCount, rng.next
    );
    newState.veilStr = Math.max(0, newState.veilStr - heroAtk);
    newState.log.push({
      type: 'hero',
      text: `⚔ Angriff! Schaden: ${heroAtk} → Schleier-Stärke: ${Math.floor(newState.veilStr)}`,
    });

    // Schleier antwortet
    if (newState.veilStr > 0) {
      const veilAtk = calcDamage(
        state.veilStr * 0.2, heroArmor, veilArmyCount, rng.next
      );
      newState.heroStr = Math.max(0, newState.heroStr - veilAtk);
      newState.log.push({
        type: 'veil',
        text: `👁 Gegenangriff! Schaden: ${veilAtk} → Deine Stärke: ${Math.floor(newState.heroStr)}`,
      });
    }
  }

  if (action === 'defend') {
    // Reduzierter Schaden
    const veilAtk = calcDamage(
      state.veilStr * 0.12, heroArmor, veilArmyCount, rng.next
    );
    newState.heroStr = Math.max(0, newState.heroStr - veilAtk);
    newState.log.push({
      type: 'hero',
      text: `🛡 Verteidigung! Reduzierter Schaden: ${veilAtk}`,
    });

    // Kleiner Konter
    const counter = calcDamage(
      newState.heroStr * 0.1, 0, heroArmyCount, rng.next
    );
    newState.veilStr = Math.max(0, newState.veilStr - counter);
    newState.log.push({
      type: 'hero',
      text: `↩ Konter: ${counter} → Schleier-Stärke: ${Math.floor(newState.veilStr)}`,
    });
  }

  // Sieg/Niederlage prüfen
  if (newState.veilStr <= 0) {
    newState.finished = true;
    newState.winner = 'hero';
    newState.log.push({
      type: 'system',
      text: `🏆 SIEG! Der Schleier ist besiegt.`,
    });
  } else if (newState.heroStr <= 0) {
    newState.finished = true;
    newState.winner = 'veil';
    newState.log.push({
      type: 'system',
      text: `💀 NIEDERLAGE! Deine Armee ist aufgerieben.`,
    });
  }

  // Schleier flieht bei <40% (SRS 7.3)
  const veilRatio = newState.veilStr / newState.veilBaseStr;
  if (!newState.finished && veilRatio < 0.4 && rng.next() < 0.6) {
    newState.finished = true;
    newState.winner = 'hero';
    newState.log.push({
      type: 'veil',
      text: `👁 Der Schleier flieht! Seine Armee ist zu schwach.`,
    });
  }

  return newState;
}

// ── Armeeverlust nach Kampf (SRS 7.2) ──
export function calcArmyLoss(damageTaken: number): number {
  return Math.floor(damageTaken / 5);
}

// ── Loot nach Sieg ──
export function calcVictoryLoot(
  veilBaseStr: number,
  rng: () => number
): { gold: number; armyBonus: number } {
  const gold = Math.floor(20 + rng() * 40);
  const armyBonus = Math.floor(1 + rng() * 3);
  return { gold, armyBonus };
}