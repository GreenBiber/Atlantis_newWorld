// ═══════════════════════════════════════════════════════════════════
// SCHLEIER & DUNKEL — Runen-System (SRS v3.1)
// 12 Basis-Runen, 10 Zwei-Runenwörter, 6 Drei-Runenwörter
// Vollständig gespiegelt für Schleier-Seite
// ═══════════════════════════════════════════════════════════════════

export type RuneSide = 'hero' | 'veil';

export interface Rune {
  id: string;
  symbol: string;       // Nordisches Runen-Symbol
  name: string;
  description: string;
  effect: RuneEffect;
  side: RuneSide;
}

export interface RuneEffect {
  damage?: number;
  armor?: number;
  maxHp?: number;
  mana?: number;
  armyStrengthMult?: number;
  escapeChanceBonus?: number;
  skillCheckBonus?: number;
  visibility?: number;
  threat?: number;
  corruption?: number;
  onKill?: string;
  special?: string;     // Spezial-Effekt-ID
}

export interface RuneWord {
  id: string;
  name: string;
  runeIds: string[];    // Exakt diese Runen in beliebiger Reihenfolge
  description: string;
  bonusEffect: RuneEffect;
  side: RuneSide;
}

// ═══════════════════════════════════════════════════════════════════
// HELD-RUNEN (12 Basis)
// ═══════════════════════════════════════════════════════════════════
export const HERO_RUNES: Rune[] = [
  { id: 'R01', symbol: 'ᚠ', name: 'Fehu', description: '+8 Gold nach Kampfsieg', side: 'hero',
    effect: { onKill: 'FEHU_GOLD' } },
  { id: 'R02', symbol: 'ᚢ', name: 'Uruz', description: '+5 Max-HP dauerhaft', side: 'hero',
    effect: { maxHp: 5 } },
  { id: 'R03', symbol: 'ᚦ', name: 'Thurisaz', description: '+4 Schaden', side: 'hero',
    effect: { damage: 4 } },
  { id: 'R04', symbol: 'ᚨ', name: 'Ansuz', description: '+8 Mana', side: 'hero',
    effect: { mana: 8 } },
  { id: 'R05', symbol: 'ᚱ', name: 'Raidho', description: 'Sichtbarkeit -1 bei Bewegung', side: 'hero',
    effect: { visibility: -1 } },
  { id: 'R06', symbol: 'ᚲ', name: 'Kenaz', description: '+6 Schaden, Skillcheck +10%', side: 'hero',
    effect: { damage: 6, skillCheckBonus: 10 } },
  { id: 'R07', symbol: 'ᚷ', name: 'Gebo', description: '+5 Rüstung', side: 'hero',
    effect: { armor: 5 } },
  { id: 'R08', symbol: 'ᚹ', name: 'Wunjo', description: 'Armeestärke +5%', side: 'hero',
    effect: { armyStrengthMult: 1.05 } },
  { id: 'R09', symbol: 'ᚺ', name: 'Hagalaz', description: 'Bedrohung -1 nach Kampfsieg', side: 'hero',
    effect: { onKill: 'HAGALAZ_CALM' } },
  { id: 'R10', symbol: 'ᚾ', name: 'Naudhiz', description: 'Flucht-Chance +10%', side: 'hero',
    effect: { escapeChanceBonus: 10 } },
  { id: 'R11', symbol: 'ᛁ', name: 'Isaz', description: 'Gegner: -15% Schaden (1 Runde nach Treffer)', side: 'hero',
    effect: { special: 'ISAZ_SLOW' } },
  { id: 'R12', symbol: 'ᛃ', name: 'Jera', description: 'Nach 3 Räumen ohne Kampf: +20 HP', side: 'hero',
    effect: { special: 'JERA_REGEN' } },
];

// ═══════════════════════════════════════════════════════════════════
// SCHLEIER-RUNEN (Spiegel, 12 Basis)
// ═══════════════════════════════════════════════════════════════════
export const VEIL_RUNES: Rune[] = [
  { id: 'VR01', symbol: 'ᛇ', name: 'Eiwaz-Schatten', description: '+8 Gold nach Kampfsieg', side: 'veil',
    effect: { onKill: 'VEILU_GOLD' } },
  { id: 'VR02', symbol: 'ᛈ', name: 'Pertho-Dunkel', description: '+5 Max-HP dauerhaft', side: 'veil',
    effect: { maxHp: 5 } },
  { id: 'VR03', symbol: 'ᛉ', name: 'Algiz-Klinge', description: '+4 Schaden', side: 'veil',
    effect: { damage: 4 } },
  { id: 'VR04', symbol: 'ᛊ', name: 'Sowilo-Flüstern', description: '+8 Mana-Äquivalent', side: 'veil',
    effect: { mana: 8 } },
  { id: 'VR05', symbol: 'ᛏ', name: 'Tiwaz-Schleier', description: 'Sichtbarkeit Held +1', side: 'veil',
    effect: { visibility: 1 } },
  { id: 'VR06', symbol: 'ᛒ', name: 'Berkano-Gift', description: '+6 Schaden, Fluch-Chance +10%', side: 'veil',
    effect: { damage: 6, special: 'BERKANO_CURSE' } },
  { id: 'VR07', symbol: 'ᛖ', name: 'Ehwaz-Panzer', description: '+5 Rüstung', side: 'veil',
    effect: { armor: 5 } },
  { id: 'VR08', symbol: 'ᛗ', name: 'Mannaz-Heer', description: 'Schleier-Armeestärke +5%', side: 'veil',
    effect: { armyStrengthMult: 1.05 } },
  { id: 'VR09', symbol: 'ᛚ', name: 'Laguz-Flut', description: 'Held-Bedrohung +1 nach Schleier-Sieg', side: 'veil',
    effect: { onKill: 'LAGUZ_THREAT' } },
  { id: 'VR10', symbol: 'ᛜ', name: 'Ingwaz-Kette', description: 'Held-Flucht-Chance -10%', side: 'veil',
    effect: { escapeChanceBonus: -10 } },
  { id: 'VR11', symbol: 'ᛞ', name: 'Dagaz-Bann', description: 'Held: +15% Schaden erhalten (1 Runde)', side: 'veil',
    effect: { special: 'DAGAZ_WEAKEN' } },
  { id: 'VR12', symbol: 'ᛟ', name: 'Othalan-Verderbnis', description: 'Nach 3 Räumen: Held-Verderbnis +1', side: 'veil',
    effect: { special: 'OTHALAN_CORRUPT' } },
];

// ═══════════════════════════════════════════════════════════════════
// HELD-RUNENWÖRTER (10 Zwei-Runen)
// ═══════════════════════════════════════════════════════════════════
export const HERO_RUNE_WORDS_2: RuneWord[] = [
  { id: 'RW01', name: 'Steinwall', runeIds: ['R02', 'R07'], side: 'hero',
    description: '+15 Max-HP, +8 Rüstung, Frontschaden -10%',
    bonusEffect: { maxHp: 15, armor: 8, special: 'STEINWALL_BLOCK' } },
  { id: 'RW02', name: 'Sturmklinge', runeIds: ['R03', 'R06'], side: 'hero',
    description: '+12 Schaden, Krit-Chance +10%',
    bonusEffect: { damage: 12, special: 'STURMKLINGE_CRIT' } },
  { id: 'RW03', name: 'Nebelschritt', runeIds: ['R05', 'R10'], side: 'hero',
    description: 'Sichtbarkeit -2, Flucht-Chance +20%',
    bonusEffect: { visibility: -2, escapeChanceBonus: 20 } },
  { id: 'RW04', name: 'Arkane Flut', runeIds: ['R04', 'R06'], side: 'hero',
    description: '+20 Mana, +8 Schaden für Magier',
    bonusEffect: { mana: 20, damage: 8 } },
  { id: 'RW05', name: 'Kriegerseele', runeIds: ['R08', 'R09'], side: 'hero',
    description: 'Armeestärke +12%, Bedrohung sinkt nach Sieg',
    bonusEffect: { armyStrengthMult: 1.12, onKill: 'KRIEGERSEELE_CALM' } },
  { id: 'RW06', name: 'Eisenwille', runeIds: ['R07', 'R11'], side: 'hero',
    description: '+8 Rüstung, Gegner: -20% Schaden dauerhaft',
    bonusEffect: { armor: 8, special: 'EISENWILLE_DEBUFF' } },
  { id: 'RW07', name: 'Goldpfad', runeIds: ['R01', 'R12'], side: 'hero',
    description: '+12 Gold nach Sieg, Regeneration zwischen Kämpfen',
    bonusEffect: { onKill: 'GOLDPFAD_BONUS', special: 'GOLDPFAD_REGEN' } },
  { id: 'RW08', name: 'Blitzauge', runeIds: ['R06', 'R12'], side: 'hero',
    description: 'Skillcheck +20%, alle 4 Räume +15 HP',
    bonusEffect: { skillCheckBonus: 20, special: 'BLITZAUGE_REGEN' } },
  { id: 'RW09', name: 'Schattenläufer', runeIds: ['R05', 'R01'], side: 'hero',
    description: 'Sichtbarkeit -1, +6 Gold nach Sieg, leise Bewegung',
    bonusEffect: { visibility: -1, onKill: 'SCHATTEN_GOLD' } },
  { id: 'RW10', name: 'Veteranenpakt', runeIds: ['R08', 'R02'], side: 'hero',
    description: 'Armeestärke +8%, +10 Max-HP, Veteranen +10% stärker',
    bonusEffect: { armyStrengthMult: 1.08, maxHp: 10, special: 'VETERAN_BUFF' } },
];

// ═══════════════════════════════════════════════════════════════════
// HELD-RUNENWÖRTER (6 Drei-Runen)
// ═══════════════════════════════════════════════════════════════════
export const HERO_RUNE_WORDS_3: RuneWord[] = [
  { id: 'RW3_01', name: 'HELLEBASFEUER', runeIds: ['R03', 'R06', 'R08'], side: 'hero',
    description: '+20 Schaden, Armeestärke +15%, Flächen-Effekt bei Angriffen',
    bonusEffect: { damage: 20, armyStrengthMult: 1.15, special: 'HELLEBAS_AOE' } },
  { id: 'RW3_02', name: 'KARAZANSCHATTEN', runeIds: ['R05', 'R10', 'R09'], side: 'hero',
    description: 'Sichtbarkeit -3, Flucht immer erfolgreich, Bedrohung sinkt passiv',
    bonusEffect: { visibility: -3, escapeChanceBonus: 100, special: 'KARAZAN_PASSIVE' } },
  { id: 'RW3_03', name: 'ZEITKRISTALL', runeIds: ['R04', 'R11', 'R12'], side: 'hero',
    description: '+30 Mana, Gegner verlangsamt, Regeneration aktiv',
    bonusEffect: { mana: 30, special: 'ZEITKRISTALL_FULL' } },
  { id: 'RW3_04', name: 'EISENTOD', runeIds: ['R07', 'R03', 'R02'], side: 'hero',
    description: '+15 Rüstung, +18 Schaden, +20 Max-HP — defensiver Berserker',
    bonusEffect: { armor: 15, damage: 18, maxHp: 20 } },
  { id: 'RW3_05', name: 'SEELENPAKT', runeIds: ['R01', 'R08', 'R09'], side: 'hero',
    description: '+20 Gold nach Sieg, Armeestärke +20%, Bedrohung sinkt dauerhaft',
    bonusEffect: { onKill: 'SEELENPAKT_GOLD', armyStrengthMult: 1.20, special: 'SEELENPAKT_PASSIVE' } },
  { id: 'RW3_06', name: 'STURMBRECHER', runeIds: ['R06', 'R07', 'R10'], side: 'hero',
    description: '+12 Schaden, +10 Rüstung, Flucht +15% — ausgewogener Krieger',
    bonusEffect: { damage: 12, armor: 10, escapeChanceBonus: 15 } },
];

// ═══════════════════════════════════════════════════════════════════
// SCHLEIER-RUNENWÖRTER (gespiegelt)
// ═══════════════════════════════════════════════════════════════════
export const VEIL_RUNE_WORDS_2: RuneWord[] = [
  { id: 'VRW01', name: 'Dunkelwall', runeIds: ['VR02', 'VR07'], side: 'veil',
    description: '+15 Max-HP, +8 Rüstung, Held-Frontschaden +10%',
    bonusEffect: { maxHp: 15, armor: 8, special: 'DUNKELWALL_DEBUFF' } },
  { id: 'VRW02', name: 'Schattenklinge', runeIds: ['VR03', 'VR06'], side: 'veil',
    description: '+12 Schaden, Fluch bei Treffer',
    bonusEffect: { damage: 12, special: 'SCHATTENKLINGE_CURSE' } },
  { id: 'VRW03', name: 'Nebelgitter', runeIds: ['VR05', 'VR10'], side: 'veil',
    description: 'Held-Sichtbarkeit +2, Held-Flucht -20%',
    bonusEffect: { special: 'NEBELGITTER_TRAP' } },
  { id: 'VRW04', name: 'Finstere Flut', runeIds: ['VR04', 'VR06'], side: 'veil',
    description: 'Schleier-Mana +20, Schaden +8',
    bonusEffect: { mana: 20, damage: 8 } },
  { id: 'VRW05', name: 'Schleierseele', runeIds: ['VR08', 'VR09'], side: 'veil',
    description: 'Schleier-Armeestärke +12%, Held-Bedrohung +1 nach Sieg',
    bonusEffect: { armyStrengthMult: 1.12, onKill: 'SCHLEIERSEELE_THREAT' } },
  { id: 'VRW06', name: 'Finsterwille', runeIds: ['VR07', 'VR11'], side: 'veil',
    description: '+8 Rüstung, Held: +20% Schaden erhalten',
    bonusEffect: { armor: 8, special: 'FINSTERWILLE_DEBUFF' } },
  { id: 'VRW07', name: 'Schattenpfad', runeIds: ['VR01', 'VR12'], side: 'veil',
    description: 'Schleier agiert verborgen, Held-Verderbnis +1',
    bonusEffect: { special: 'SCHATTENPFAD_HIDDEN' } },
  { id: 'VRW08', name: 'Finsterspäher', runeIds: ['VR06', 'VR12'], side: 'veil',
    description: 'Held-Skillcheck -20%, Held-Verderbnis steigt',
    bonusEffect: { special: 'FINSTERSPAEHER_DEBUFF' } },
  { id: 'VRW09', name: 'Dunkelläufer', runeIds: ['VR05', 'VR01'], side: 'veil',
    description: 'Held-Sichtbarkeit +1, Schleier bewegt sich unerkannt',
    bonusEffect: { special: 'DUNKELLAEUFER_STEALTH' } },
  { id: 'VRW10', name: 'Finsterpakt', runeIds: ['VR08', 'VR02'], side: 'veil',
    description: 'Schleier-Armeestärke +8%, Schleier-HP +10',
    bonusEffect: { armyStrengthMult: 1.08, maxHp: 10 } },
];

export const VEIL_RUNE_WORDS_3: RuneWord[] = [
  { id: 'VRW3_01', name: 'DUNKELBASFEUER', runeIds: ['VR03', 'VR06', 'VR08'], side: 'veil',
    description: '+20 Schaden, Schleier-Armeestärke +15%, Held nimmt Flächenschaden',
    bonusEffect: { damage: 20, armyStrengthMult: 1.15, special: 'DUNKEL_AOE' } },
  { id: 'VRW3_02', name: 'NEBELSCHATTEN', runeIds: ['VR05', 'VR10', 'VR09'], side: 'veil',
    description: 'Held-Sichtbarkeit +3, Held-Flucht nie erfolgreich (1x), Held-Bedrohung +1',
    bonusEffect: { special: 'NEBELSCHATTEN_FULL' } },
  { id: 'VRW3_03', name: 'ZEITBANN', runeIds: ['VR04', 'VR11', 'VR12'], side: 'veil',
    description: 'Held verlangsamt, Verderbnis steigt passiv, Schleier regeneriert',
    bonusEffect: { special: 'ZEITBANN_FULL' } },
  { id: 'VRW3_04', name: 'SCHERBENKLINGE', runeIds: ['VR07', 'VR03', 'VR02'], side: 'veil',
    description: '+15 Rüstung, +18 Schaden, +20 Max-HP Schleier',
    bonusEffect: { armor: 15, damage: 18, maxHp: 20 } },
  { id: 'VRW3_05', name: 'SCHLEIERSEELENPAKT', runeIds: ['VR01', 'VR08', 'VR09'], side: 'veil',
    description: 'Schleier-Armeestärke +20%, Held-Bedrohung dauerhaft +1',
    bonusEffect: { armyStrengthMult: 1.20, special: 'SCHLEIERSEELENPAKT_PASSIVE' } },
  { id: 'VRW3_06', name: 'DUNKELBRECHER', runeIds: ['VR06', 'VR07', 'VR10'], side: 'veil',
    description: '+12 Schaden, +10 Rüstung, Held-Flucht -15%',
    bonusEffect: { damage: 12, armor: 10, special: 'DUNKELBRECHER_ANTI_ESCAPE' } },
];

// ═══════════════════════════════════════════════════════════════════
// ALLE RUNEN & RUNENWÖRTER — Maps für schnellen Zugriff
// ═══════════════════════════════════════════════════════════════════
export const ALL_RUNES: Map<string, Rune> = new Map([
  ...HERO_RUNES.map(r => [r.id, r] as [string, Rune]),
  ...VEIL_RUNES.map(r => [r.id, r] as [string, Rune]),
]);

export const ALL_RUNE_WORDS: Map<string, RuneWord> = new Map([
  ...HERO_RUNE_WORDS_2.map(rw => [rw.id, rw] as [string, RuneWord]),
  ...HERO_RUNE_WORDS_3.map(rw => [rw.id, rw] as [string, RuneWord]),
  ...VEIL_RUNE_WORDS_2.map(rw => [rw.id, rw] as [string, RuneWord]),
  ...VEIL_RUNE_WORDS_3.map(rw => [rw.id, rw] as [string, RuneWord]),
]);

// ═══════════════════════════════════════════════════════════════════
// RUNE DROP LOGIK
// ═══════════════════════════════════════════════════════════════════
export function rollRuneDrop(rng: () => number, side: RuneSide): Rune | null {
  if (rng() > 0.05) return null; // 5% Chance in roten Räumen
  const pool = side === 'hero' ? HERO_RUNES : VEIL_RUNES;
  return pool[Math.floor(rng() * pool.length)];
}

// ═══════════════════════════════════════════════════════════════════
// RUNENWORT-ERKENNUNG
// ═══════════════════════════════════════════════════════════════════
export function detectRuneWord(runeIds: string[], side: RuneSide): RuneWord | null {
  const words2 = side === 'hero' ? HERO_RUNE_WORDS_2 : VEIL_RUNE_WORDS_2;
  const words3 = side === 'hero' ? HERO_RUNE_WORDS_3 : VEIL_RUNE_WORDS_3;
  const allWords = [...words3, ...words2]; // Drei-Runen zuerst prüfen

  for (const word of allWords) {
    if (word.runeIds.length !== runeIds.length) continue;
    const match = word.runeIds.every(id => runeIds.includes(id));
    if (match) return word;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// GESOCKELTE EFFEKTE BERECHNEN
// ═══════════════════════════════════════════════════════════════════
export function computeSocketedEffect(runeIds: string[]): {
  totalEffect: RuneEffect;
  runeWord: RuneWord | null;
} {
  if (!runeIds.length) return { totalEffect: {}, runeWord: null };

  const side: RuneSide = runeIds[0]?.startsWith('VR') ? 'veil' : 'hero';
  const runeWord = detectRuneWord(runeIds, side);

  const totalEffect: RuneEffect = {};

  // Basis-Runen-Effekte addieren
  for (const id of runeIds) {
    const rune = ALL_RUNES.get(id);
    if (!rune) continue;
    if (rune.effect.damage) totalEffect.damage = (totalEffect.damage || 0) + rune.effect.damage;
    if (rune.effect.armor) totalEffect.armor = (totalEffect.armor || 0) + rune.effect.armor;
    if (rune.effect.maxHp) totalEffect.maxHp = (totalEffect.maxHp || 0) + rune.effect.maxHp;
    if (rune.effect.mana) totalEffect.mana = (totalEffect.mana || 0) + rune.effect.mana;
    if (rune.effect.armyStrengthMult) totalEffect.armyStrengthMult = (totalEffect.armyStrengthMult || 1.0) * rune.effect.armyStrengthMult;
    if (rune.effect.escapeChanceBonus) totalEffect.escapeChanceBonus = (totalEffect.escapeChanceBonus || 0) + rune.effect.escapeChanceBonus;
    if (rune.effect.skillCheckBonus) totalEffect.skillCheckBonus = (totalEffect.skillCheckBonus || 0) + rune.effect.skillCheckBonus;
    if (rune.effect.visibility) totalEffect.visibility = (totalEffect.visibility || 0) + rune.effect.visibility;
  }

  // Runenwort-Bonus addieren
  if (runeWord) {
    const b = runeWord.bonusEffect;
    if (b.damage) totalEffect.damage = (totalEffect.damage || 0) + b.damage;
    if (b.armor) totalEffect.armor = (totalEffect.armor || 0) + b.armor;
    if (b.maxHp) totalEffect.maxHp = (totalEffect.maxHp || 0) + b.maxHp;
    if (b.mana) totalEffect.mana = (totalEffect.mana || 0) + b.mana;
    if (b.armyStrengthMult) totalEffect.armyStrengthMult = (totalEffect.armyStrengthMult || 1.0) * b.armyStrengthMult;
    if (b.escapeChanceBonus) totalEffect.escapeChanceBonus = (totalEffect.escapeChanceBonus || 0) + b.escapeChanceBonus;
    if (b.skillCheckBonus) totalEffect.skillCheckBonus = (totalEffect.skillCheckBonus || 0) + b.skillCheckBonus;
    if (b.special) totalEffect.special = b.special;
  }

  return { totalEffect, runeWord };
}

// ═══════════════════════════════════════════════════════════════════
// SCHLEIER-RUNEN-AKTIONEN (Stehlen / Zerstören)
// ═══════════════════════════════════════════════════════════════════
export function veilRuneAction(
  heroRuneIds: string[],
  veilStage: number,
  rng: () => number
): { success: boolean; stolenRuneId: string | null; message: string } {
  if (!heroRuneIds.length) return { success: false, stolenRuneId: null, message: 'Keine Runen vorhanden.' };

  const stealChance = veilStage * 0.05; // 5% pro Stufe, max 25% bei Stufe V
  if (rng() > stealChance) return { success: false, stolenRuneId: null, message: 'Schleier-Rune-Aktion fehlgeschlagen.' };

  const targetRune = heroRuneIds[Math.floor(rng() * heroRuneIds.length)];
  const destroy = rng() < 0.4; // 40% Chance auf Zerstörung statt Stehlen

  return {
    success: true,
    stolenRuneId: targetRune,
    message: destroy
      ? `Rune ${targetRune} ZERSTÖRT durch Schleier!`
      : `Rune ${targetRune} gestohlen durch Schleier!`,
  };
}