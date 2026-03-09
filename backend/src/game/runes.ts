// ═══════════════════════════════════════════════════════════════════
// SCHLEIER & DUNKEL — Runen-System (SRS v3.1)
// Inspiriert von Diablo 2: Selten, kombinierbar, symmetrisch
// ═══════════════════════════════════════════════════════════════════

export interface RuneEffect {
  damage?: number;
  armor?: number;
  maxHp?: number;
  hp?: number;
  mana?: number;
  maxMana?: number;
  manaRegen?: number;
  armorPenetration?: number;
  magicResist?: number;
  armyStrengthMult?: number;
  escapeChanceBonus?: number;
  skillCheckBonus?: number;
  threat?: number;
  visibility?: number;
  corruption?: number;
  critChance?: number;
  healingMult?: number;
  // Passive Trigger-Effekte (ID referenziert Logik im Combat-System)
  onHit?: string;
  onDeath?: string;
  onEscape?: string;
}

export interface BaseRune {
  id: string;
  name: string;           // Deutsch
  symbol: string;         // Nordisches Runensymbol
  description: string;    // Einzel-Effekt wenn in Item gesockelt
  lore: string;
  effect: RuneEffect;
  dropWeight: number;     // Relativ — seltener = niedriger
  veilMirror: string;     // ID der Schleier-Spiegel-Rune
}

export interface RuneWord {
  id: string;
  name: string;
  runes: string[];        // Reihenfolge der Rune-IDs (muss eingehalten werden)
  description: string;
  lore: string;
  effect: RuneEffect;
  // Wenn auf Schleier-Seite: dieselbe Kombi aus Spiegel-Runen
  isSymmetric: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// 12 BASIS-RUNEN (Held-Seite)
// ═══════════════════════════════════════════════════════════════════
export const BASE_RUNES: BaseRune[] = [
  {
    id: 'R_EL',
    name: 'El-Rune',
    symbol: 'ᚠ',
    description: '+2 Schaden, +1 Rüstungsdurchbruch',
    lore: 'Die erste Rune der Schöpfung. Roh. Einfach. Unzerstörbar.',
    effect: { damage: 2, armorPenetration: 1 },
    dropWeight: 80,
    veilMirror: 'VR_EL',
  },
  {
    id: 'R_ETH',
    name: 'Eth-Rune',
    symbol: 'ᚢ',
    description: '-3 gegnerische Rüstung (im Kampf), +1 Schaden',
    lore: 'Sie zernagt das Eisen wie Rost. Geduldig und unaufhaltsam.',
    effect: { damage: 1, armorPenetration: 3 },
    dropWeight: 70,
    veilMirror: 'VR_ETH',
  },
  {
    id: 'R_ITH',
    name: 'Ith-Rune',
    symbol: 'ᚦ',
    description: '+3 Max-HP, Heilung +5%',
    lore: 'Leben, eingeritzt in Stein. Die Rune übersteht jede Wunde.',
    effect: { maxHp: 3, healingMult: 1.05 },
    dropWeight: 70,
    veilMirror: 'VR_ITH',
  },
  {
    id: 'R_TIR',
    name: 'Tir-Rune',
    symbol: 'ᚨ',
    description: '+2 Mana nach jedem Kampfsieg, +5 Max-Mana',
    lore: 'Geopfert vom Kriegsgott. Die Rune lädt sich mit jedem Fall auf.',
    effect: { mana: 2, maxMana: 5 },
    dropWeight: 65,
    veilMirror: 'VR_TIR',
  },
  {
    id: 'R_NEF',
    name: 'Nef-Rune',
    symbol: 'ᚱ',
    description: 'Gegner: -20% Flucht-Chance, +1 Schaden',
    lore: 'Fesselt den Geist. Wer unter ihr kämpft, entkommt nicht leicht.',
    effect: { damage: 1 }, // escapeChanceDebuff auf Gegner = Logik im Combat
    dropWeight: 55,
    veilMirror: 'VR_NEF',
  },
  {
    id: 'R_SOL',
    name: 'Sol-Rune',
    symbol: 'ᚲ',
    description: '-1 Schaden erhalten (min. 1), +2 Rüstung',
    lore: 'Licht als Schild. Nicht warm, nicht sanft — nur hart.',
    effect: { armor: 2 },
    dropWeight: 50,
    veilMirror: 'VR_SOL',
  },
  {
    id: 'R_DOLT',
    name: 'Dolt-Rune',
    symbol: 'ᚷ',
    description: 'Krit-Chance +5%, Schaden nach Krit +10%',
    lore: 'Donnerkeil. Trifft selten. Trifft hart.',
    effect: { critChance: 5, damage: 0 }, // onHit: DOLT_CRIT
    dropWeight: 45,
    veilMirror: 'VR_DOLT',
  },
  {
    id: 'R_HEL',
    name: 'Hel-Rune',
    symbol: 'ᚹ',
    description: '+10 HP sofort beim Sockeln, Verderbnis-Resistenz +1',
    lore: 'Unterwelt und Wiedergeburt. Die Rune kennt den Tod und lehrt Widerstand.',
    effect: { hp: 10 },
    dropWeight: 40,
    veilMirror: 'VR_HEL',
  },
  {
    id: 'R_IO',
    name: 'Io-Rune',
    symbol: 'ᚺ',
    description: '+5% Armeestärke, +1 Miliz beim Sockeln',
    lore: 'Sie lebt in der Masse. Je mehr Krieger, desto lauter ihr Klang.',
    effect: { armyStrengthMult: 1.05 },
    dropWeight: 35,
    veilMirror: 'VR_IO',
  },
  {
    id: 'R_LUM',
    name: 'Lum-Rune',
    symbol: 'ᚾ',
    description: '+10 Max-Mana, Mana-Regen +1/Runde',
    lore: 'Licht-Rune der Magier. Jeder Adept träumt von ihr.',
    effect: { maxMana: 10, manaRegen: 1 },
    dropWeight: 35,
    veilMirror: 'VR_LUM',
  },
  {
    id: 'R_KO',
    name: 'Ko-Rune',
    symbol: 'ᛁ',
    description: 'Sichtbarkeit -1 permanent, Skillcheck +10%',
    lore: 'Unsichtbarkeit als Kunst. Als Disziplin. Als Überlebensstrategie.',
    effect: { visibility: -1, skillCheckBonus: 10 },
    dropWeight: 25,
    veilMirror: 'VR_KO',
  },
  {
    id: 'R_FAL',
    name: 'Fal-Rune',
    symbol: 'ᛃ',
    description: 'Armee-Verlust im Kampf -20%, +3 Rüstung',
    lore: 'Fels-Rune. Wer sie trägt, bricht langsamer.',
    effect: { armor: 3 }, // armyLossReduction: 0.2 = Logik im Combat
    dropWeight: 20,
    veilMirror: 'VR_FAL',
  },
];

// ═══════════════════════════════════════════════════════════════════
// 12 SPIEGEL-RUNEN (Schleier-Seite)
// Identische Effekte, andere Namen/Symbole
// ═══════════════════════════════════════════════════════════════════
export const VEIL_RUNES: BaseRune[] = [
  { id: 'VR_EL', name: 'Schatten-El', symbol: 'ᛇ', description: '+2 Schaden, +1 Rüstungsdurchbruch', lore: 'Der Schatten der ersten Rune.', effect: { damage: 2, armorPenetration: 1 }, dropWeight: 80, veilMirror: 'R_EL' },
  { id: 'VR_ETH', name: 'Schatten-Eth', symbol: 'ᛈ', description: '-3 gegnerische Rüstung, +1 Schaden', lore: 'Zerfrisst Licht wie Säure.', effect: { damage: 1, armorPenetration: 3 }, dropWeight: 70, veilMirror: 'R_ETH' },
  { id: 'VR_ITH', name: 'Schatten-Ith', symbol: 'ᛉ', description: '+3 Max-HP, Heilung +5%', lore: 'Leben aus Dunkelheit geformt.', effect: { maxHp: 3, healingMult: 1.05 }, dropWeight: 70, veilMirror: 'R_ITH' },
  { id: 'VR_TIR', name: 'Schatten-Tir', symbol: 'ᛊ', description: '+2 Mana nach Kampfsieg, +5 Max-Mana', lore: 'Die Rune des gefallenen Kriegers.', effect: { mana: 2, maxMana: 5 }, dropWeight: 65, veilMirror: 'R_TIR' },
  { id: 'VR_NEF', name: 'Schatten-Nef', symbol: 'ᛏ', description: 'Gegner: -20% Flucht-Chance, +1 Schaden', lore: 'Ketten aus Schatten.', effect: { damage: 1 }, dropWeight: 55, veilMirror: 'R_NEF' },
  { id: 'VR_SOL', name: 'Schatten-Sol', symbol: 'ᛒ', description: '-1 Schaden erhalten, +2 Rüstung', lore: 'Dunkelheit als Panzer.', effect: { armor: 2 }, dropWeight: 50, veilMirror: 'R_SOL' },
  { id: 'VR_DOLT', name: 'Schatten-Dolt', symbol: 'ᛖ', description: 'Krit-Chance +5%, Schaden nach Krit +10%', lore: 'Dunkler Blitz.', effect: { critChance: 5 }, dropWeight: 45, veilMirror: 'R_DOLT' },
  { id: 'VR_HEL', name: 'Schatten-Hel', symbol: 'ᛗ', description: '+10 HP beim Sockeln, Verderbnis-Res +1', lore: 'Der Schleier kennt den Tod von innen.', effect: { hp: 10 }, dropWeight: 40, veilMirror: 'R_HEL' },
  { id: 'VR_IO', name: 'Schatten-Io', symbol: 'ᛚ', description: '+5% Armeestärke, +1 Söldner', lore: 'Die Rune der Masse.', effect: { armyStrengthMult: 1.05 }, dropWeight: 35, veilMirror: 'R_IO' },
  { id: 'VR_LUM', name: 'Schatten-Lum', symbol: 'ᛜ', description: '+10 Max-Mana, Mana-Regen +1', lore: 'Dunkles Licht.', effect: { maxMana: 10, manaRegen: 1 }, dropWeight: 35, veilMirror: 'R_LUM' },
  { id: 'VR_KO', name: 'Schatten-Ko', symbol: 'ᛞ', description: 'Sichtb. -1 permanent, Skillcheck +10%', lore: 'Schatten brauchen kein Licht.', effect: { visibility: -1, skillCheckBonus: 10 }, dropWeight: 25, veilMirror: 'R_KO' },
  { id: 'VR_FAL', name: 'Schatten-Fal', symbol: 'ᛟ', description: 'Armee-Verlust -20%, +3 Rüstung', lore: 'Unzerbrechliches Dunkel.', effect: { armor: 3 }, dropWeight: 20, veilMirror: 'R_FAL' },
];

// ═══════════════════════════════════════════════════════════════════
// 10 ZWEI-RUNEN-WÖRTER
// ═══════════════════════════════════════════════════════════════════
export const TWO_RUNE_WORDS: RuneWord[] = [
  {
    id: 'RW_STAHLWILLE',
    name: 'STAHLWILLE',
    runes: ['R_SOL', 'R_FAL'],
    description: '+5 Rüstung, Armee-Verlust -30%, Max-HP +10',
    lore: 'Der Wille des Stahls. Bricht nicht. Beugt sich nicht.',
    effect: { armor: 5, maxHp: 10 }, // armyLossReduction: 0.3
    isSymmetric: true,
  },
  {
    id: 'RW_SCHLACHTFELD',
    name: 'SCHLACHTFELD',
    runes: ['R_EL', 'R_IO'],
    description: '+3 Schaden, Armeestärke +12%',
    lore: 'Klinge und Krieger, vereint im Blut.',
    effect: { damage: 3, armyStrengthMult: 1.12 },
    isSymmetric: true,
  },
  {
    id: 'RW_NEBELGANG',
    name: 'NEBELGANG',
    runes: ['R_KO', 'R_NEF'],
    description: 'Sichtbarkeit -2, Gegner Flucht -30%, Skillcheck +15%',
    lore: 'Im Nebel kannst du nicht fliehen. Ich schon.',
    effect: { visibility: -2, skillCheckBonus: 15 }, // enemyEscapeDebuff: 0.3
    isSymmetric: true,
  },
  {
    id: 'RW_STURMBLITZ',
    name: 'STURMBLITZ',
    runes: ['R_DOLT', 'R_TIR'],
    description: 'Krit-Chance +8%, nach Krit: +5 Mana',
    lore: 'Der Donner tankt sich an seinen eigenen Blitzen auf.',
    effect: { critChance: 8 }, // onCrit: MANA_5
    isSymmetric: true,
  },
  {
    id: 'RW_LEBENSRUNE',
    name: 'LEBENSRUNE',
    runes: ['R_ITH', 'R_HEL'],
    description: 'Max-HP +15, Heilung +15%',
    lore: 'Zwei Runen die den Tod kennen, gemeinsam gegen ihn.',
    effect: { maxHp: 15, healingMult: 1.15 },
    isSymmetric: true,
  },
  {
    id: 'RW_ARKANBRUCH',
    name: 'ARKANBRUCH',
    runes: ['R_LUM', 'R_ETH'],
    description: '+15 Max-Mana, +4 Schaden, Rüstungsdurchbruch +2',
    lore: 'Mana als Waffe. Die reinste Form von Aggression.',
    effect: { maxMana: 15, damage: 4, armorPenetration: 2 },
    isSymmetric: true,
  },
  {
    id: 'RW_EISENWACHT',
    name: 'EISENWACHT',
    runes: ['R_SOL', 'R_ITH'],
    description: '+4 Rüstung, +8 Max-HP, Magieresistenz +10',
    lore: 'Eisen und Leben. Eine Mauer, die atmet.',
    effect: { armor: 4, maxHp: 8, magicResist: 10 },
    isSymmetric: true,
  },
  {
    id: 'RW_JÄGERMARK',
    name: 'JÄGERMARK',
    runes: ['R_KO', 'R_EL'],
    description: 'Sichtbarkeit -1, +3 Schaden, Flucht-Chance +10%',
    lore: 'Jäger müssen unsichtbar und tödlich zugleich sein.',
    effect: { visibility: -1, damage: 3, escapeChanceBonus: 10 },
    isSymmetric: true,
  },
  {
    id: 'RW_BLUTEID',
    name: 'BLUTEID',
    runes: ['R_NEF', 'R_DOLT'],
    description: 'Gegner Flucht -40%, Krit-Chance +6%, Krit-Schaden +20%',
    lore: 'Geschworen im Blut. Eingelöst im Kampf.',
    effect: { critChance: 6 }, // enemyEscapeDebuff: 0.4, onCrit: BLOOD_OATH_DMG
    isSymmetric: true,
  },
  {
    id: 'RW_STURMSCHUTZ',
    name: 'STURMSCHUTZ',
    runes: ['R_FAL', 'R_HEL'],
    description: 'Armee-Verlust -25%, +5 HP pro besiegtem Gegner',
    lore: 'Im Sturm stehen und trotzdem heilen.',
    effect: { armor: 3 }, // armyLossReduction: 0.25, onKill: HP_5
    isSymmetric: true,
  },
];

// ═══════════════════════════════════════════════════════════════════
// 6 DREI-RUNEN-WÖRTER
// ═══════════════════════════════════════════════════════════════════
export const THREE_RUNE_WORDS: RuneWord[] = [
  {
    id: 'RW_HELLEBASFEUER',
    name: 'HELLEBASFEUER',
    runes: ['R_EL', 'R_DOLT', 'R_LUM'],
    description: '+8 Schaden, Krit-Chance +10%, +20 Max-Mana — bei Krit: Flächenschaden (3 Einheiten)',
    lore: 'Das Feuer des Himmels, konzentriert in eine Klinge. Es brennt immer noch.',
    effect: { damage: 8, critChance: 10, maxMana: 20 }, // onCrit: HELLE_AOE
    isSymmetric: true,
  },
  {
    id: 'RW_KARAZANSCHATTEN',
    name: 'KARAZANSCHATTEN',
    runes: ['R_KO', 'R_NEF', 'R_SOL'],
    description: 'Sichtbarkeit -2, Gegner Flucht -50%, +5 Rüstung — erste Kampfrunde: Held unsichtbar',
    lore: 'Karavan, der Verborgene, trug diese Runen. Man hat ihn nie gesehen. Man hat nur seinen Schatten gefunden.',
    effect: { visibility: -2, armor: 5 }, // enemyEscapeDebuff: 0.5, combat: firstRoundInvisible
    isSymmetric: true,
  },
  {
    id: 'RW_ZEITKRISTALL',
    name: 'ZEITKRISTALL',
    runes: ['R_TIR', 'R_IO', 'R_FAL'],
    description: 'Armeestärke +15%, Armee-Verlust -40%, +10 Mana nach Kampfsieg',
    lore: 'Zeit ist die stärkste Armee. Wer sie versteht, braucht keine andere.',
    effect: { armyStrengthMult: 1.15, mana: 10 }, // armyLossReduction: 0.4
    isSymmetric: true,
  },
  {
    id: 'RW_EISENBLUT',
    name: 'EISENBLUT',
    runes: ['R_FAL', 'R_ITH', 'R_HEL'],
    description: '+8 Rüstung, +20 Max-HP, Heilung +20% — bei Niederlage unter 20% HP: einmalig +30 HP',
    lore: 'Eisenblut fließt langsamer. Gefriert nicht. Weicht nicht.',
    effect: { armor: 8, maxHp: 20, healingMult: 1.2 }, // onNearDeath: EISENBLUT_HEAL
    isSymmetric: true,
  },
  {
    id: 'RW_VERDERBNISWÄCHTER',
    name: 'VERDERBNISWÄCHTER',
    runes: ['R_HEL', 'R_ETH', 'R_KO'],
    description: 'Verderbnis-Resistenz +3, Skillcheck +20%, -1 Sichtbarkeit — Flüche: -1 Dauer',
    lore: 'Drei Runen, die dem Verfall widerstehen. Solange alle drei halten.',
    effect: { skillCheckBonus: 20, visibility: -1 }, // corruptionResist: 3, curseReduction: 1
    isSymmetric: true,
  },
  {
    id: 'RW_SCHLACHTRUF',
    name: 'SCHLACHTRUF',
    runes: ['R_EL', 'R_IO', 'R_DOLT'],
    description: '+5 Schaden, Armeestärke +18%, Krit-Chance +8% — bei Kampfbeginn: Armee +5%',
    lore: 'Wenn alle drei Runen zusammen klingen, hören Feinde auf zu atmen.',
    effect: { damage: 5, armyStrengthMult: 1.18, critChance: 8 }, // onCombatStart: ARMY_BOOST_5
    isSymmetric: true,
  },
];

// ═══════════════════════════════════════════════════════════════════
// KOMBINIERTE MAPS
// ═══════════════════════════════════════════════════════════════════
export const ALL_RUNE_WORDS: Map<string, RuneWord> = new Map([
  ...TWO_RUNE_WORDS.map(rw => [rw.id, rw] as [string, RuneWord]),
  ...THREE_RUNE_WORDS.map(rw => [rw.id, rw] as [string, RuneWord]),
]);

export const ALL_BASE_RUNES: Map<string, BaseRune> = new Map([
  ...BASE_RUNES.map(r => [r.id, r] as [string, BaseRune]),
  ...VEIL_RUNES.map(r => [r.id, r] as [string, BaseRune]),
]);

// ═══════════════════════════════════════════════════════════════════
// RUNEN-DROP-LOGIK
// ═══════════════════════════════════════════════════════════════════
/**
 * Runen droppen nur in roten Räumen, ~5% Chance.
 * Seltener als Items — jede Rune ist ein Ereignis.
 */
export function rollRuneDrop(
  rng: () => number,
  side: 'hero' | 'veil' = 'hero'
): BaseRune | null {
  if (rng() > 0.05) return null; // 5% Basis-Drop-Chance

  const pool = side === 'hero' ? BASE_RUNES : VEIL_RUNES;
  const totalWeight = pool.reduce((s, r) => s + r.dropWeight, 0);
  let roll = rng() * totalWeight;

  for (const rune of pool) {
    roll -= rune.dropWeight;
    if (roll <= 0) return rune;
  }
  return pool[pool.length - 1];
}

// ═══════════════════════════════════════════════════════════════════
// RUNENWORT-ERKENNUNG
// ═══════════════════════════════════════════════════════════════════
/**
 * Prüft ob die gegebene Liste gesockelter Runen ein Runenwort bildet.
 * Reihenfolge ist relevant.
 */
export function detectRuneWord(
  socketedRuneIds: string[],
  side: 'hero' | 'veil' = 'hero'
): RuneWord | null {
  // Wenn Schleier-Seite: Spiegel-IDs verwenden
  const runeIds = side === 'veil'
    ? socketedRuneIds.map(id => {
        const heroRune = BASE_RUNES.find(r => r.veilMirror === id);
        return heroRune ? id : id; // Schleier-Runen matchen direkt auf Spiegel-Variante
      })
    : socketedRuneIds;

  for (const [, rw] of ALL_RUNE_WORDS) {
    if (rw.runes.length !== runeIds.length) continue;

    // Für Schleier-Seite: prüfe ob alle Runen die Spiegel-Varianten sind
    if (side === 'veil') {
      const veilRuneIds = rw.runes.map(heroId => {
        const heroRune = ALL_BASE_RUNES.get(heroId);
        return heroRune?.veilMirror || heroId;
      });
      if (veilRuneIds.every((id, i) => id === runeIds[i])) return rw;
    } else {
      if (rw.runes.every((id, i) => id === runeIds[i])) return rw;
    }
  }
  return null;
}

/**
 * Kombiniert Basis-Runen-Effekte zu einem Gesamt-Effekt.
 * Wenn Runenwort aktiv: Runenwort-Effekt überschreibt (nicht addiert).
 */
export function computeSocketedEffect(
  socketedRuneIds: string[],
  side: 'hero' | 'veil' = 'hero'
): { effect: RuneEffect; runeWord: RuneWord | null } {
  const runeWord = detectRuneWord(socketedRuneIds, side);

  if (runeWord) {
    return { effect: runeWord.effect, runeWord };
  }

  // Addiere Einzel-Rune-Effekte
  const combined: RuneEffect = {};
  for (const id of socketedRuneIds) {
    const rune = ALL_BASE_RUNES.get(id);
    if (!rune) continue;
    for (const [key, val] of Object.entries(rune.effect)) {
      const k = key as keyof RuneEffect;
      if (typeof val === 'number') {
        if (k === 'armyStrengthMult' || k === 'healingMult') {
          // Multiplikatoren werden multipliziert
          (combined[k] as number) = ((combined[k] as number) || 1.0) * val;
        } else {
          (combined[k] as number) = ((combined[k] as number) || 0) + val;
        }
      } else if (typeof val === 'string') {
        combined[k] = val as never;
      }
    }
  }
  return { effect: combined, runeWord: null };
}

// ═══════════════════════════════════════════════════════════════════
// RUNEN-DIEBSTAHL & ZERSTÖRUNG (Schleier-Seite)
// ═══════════════════════════════════════════════════════════════════
export interface RuneStealResult {
  success: boolean;
  stolenRuneId?: string;
  message: string;
}

/**
 * Schleier kann im Kampf versuchen, eine Rune zu stehlen oder zu zerstören.
 * Nur bei Schleier-Stufe IV+
 */
export function veilRuneAction(
  heroSocketedRunes: string[],
  veilStage: number,
  rng: () => number
): RuneStealResult {
  if (veilStage < 4 || heroSocketedRunes.length === 0) {
    return { success: false, message: 'Keine Runen-Aktion möglich.' };
  }

  const chance = (veilStage - 3) * 0.15; // Stufe IV: 15%, Stufe V: 30%
  if (rng() > chance) {
    return { success: false, message: 'Schleier versucht Runen-Diebstahl — fehlgeschlagen.' };
  }

  const targetIdx = Math.floor(rng() * heroSocketedRunes.length);
  const stolenRuneId = heroSocketedRunes[targetIdx];

  // Stufe V: Zerstörung statt Diebstahl (50/50)
  if (veilStage >= 5 && rng() < 0.5) {
    return {
      success: true,
      stolenRuneId,
      message: `Schleier ZERSTÖRT Rune ${stolenRuneId}! Sie ist verloren.`,
    };
  }

  return {
    success: true,
    stolenRuneId,
    message: `Schleier stiehlt Rune ${stolenRuneId} und verwendet sie selbst.`,
  };
}
