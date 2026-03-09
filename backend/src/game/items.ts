// ═══════════════════════════════════════════════════════════════════
// SCHLEIER & DUNKEL — Item-Datenbank (SRS v3.1)
// ═══════════════════════════════════════════════════════════════════

export type ItemRarity = 'common' | 'uncommon' | 'rare';
export type ItemSlot = 'weapon' | 'armor' | 'artifact' | 'bag';
export type ItemCategory = 'weapon' | 'armor' | 'artifact' | 'consumable';

export interface ItemEffect {
  hp?: number;
  maxHp?: number;
  armor?: number;
  damage?: number;
  armorPenetration?: number;
  magicResist?: number;
  threat?: number;
  visibility?: number;
  corruption?: number;
  armyStrengthMult?: number;     // z.B. 1.1 = +10%
  escapeChanceBonus?: number;    // prozentual
  skillCheckBonus?: number;
  mana?: number;
  maxMana?: number;
  manaRegen?: number;
  healingMult?: number;
  // Spezial-Trigger
  onKill?: string;               // Effekt-ID
  onDamaged?: string;
  onEscape?: string;
  onCurseApplied?: string;
}

export interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  slot: ItemSlot;
  rarity: ItemRarity;
  runeSlots: number;             // 0-3
  description: string;
  lore: string;
  effects: ItemEffect;
  regionBias?: string[];         // Häufiger in bestimmten Regionen
  classBonus?: { kaempfer?: ItemEffect; magier?: ItemEffect };
}

// ═══════════════════════════════════════════════════════════════════
// WAFFEN (8)
// ═══════════════════════════════════════════════════════════════════
export const WEAPONS: Item[] = [
  {
    id: 'W01',
    name: 'Rostiges Grenzlandschwert',
    category: 'weapon',
    slot: 'weapon',
    rarity: 'common',
    runeSlots: 1,
    description: '+5 Schaden, +1 Rüstungsdurchbruch',
    lore: 'Tausend Grenzgefechte haben diese Klinge stumpf, aber erprobt gemacht.',
    effects: { damage: 5, armorPenetration: 1 },
    regionBias: ['grenzlande'],
  },
  {
    id: 'W02',
    name: 'Sumpfklinge',
    category: 'weapon',
    slot: 'weapon',
    rarity: 'common',
    runeSlots: 1,
    description: '+4 Schaden, Gegner: -10% Heilung',
    lore: 'Das Metall wurde in Moorwasser gehärtet. Wunden, die sie schlägt, verheilen schlecht.',
    effects: { damage: 4 },
    onKill: 'SUMPFGIFT',
    regionBias: ['nebelmoor'],
  },
  {
    id: 'W03',
    name: 'Veteranenklinge',
    category: 'weapon',
    slot: 'weapon',
    rarity: 'uncommon',
    runeSlots: 2,
    description: '+10 Schaden, +3 Rüstungsdurchbruch, Veteranen +5% Stärke',
    lore: 'Weitergegeben von Sergeant zu Sergeant. Jeder Kratzer erzählt eine Geschichte.',
    effects: { damage: 10, armorPenetration: 3, armyStrengthMult: 1.05 },
  },
  {
    id: 'W04',
    name: 'Schattenreißer',
    category: 'weapon',
    slot: 'weapon',
    rarity: 'uncommon',
    runeSlots: 2,
    description: '+8 Schaden, Sichtbarkeit -1 nach Kampfsieg',
    lore: 'Geschmiedet von Meuchelmördern. Sie sagen, die Klinge trinkt Licht.',
    effects: { damage: 8 },
    onKill: 'SCHATTEN_STILLE',
  },
  {
    id: 'W05',
    name: 'Flammenlanze des Grenzkommandanten',
    category: 'weapon',
    slot: 'weapon',
    rarity: 'rare',
    runeSlots: 3,
    description: '+18 Schaden, +5 Rüstungsdurchbruch, Armeeschaden +10%',
    lore: 'Nur drei wurden je geschmiedet. Zwei sind verloren. Diese hier hatte Blut an sich, als man sie fand.',
    effects: { damage: 18, armorPenetration: 5, armyStrengthMult: 1.10 },
    regionBias: ['grenzlande'],
  },
  {
    id: 'W06',
    name: 'Fluchstab des Nebelmoors',
    category: 'weapon',
    slot: 'weapon',
    rarity: 'uncommon',
    runeSlots: 2,
    description: '+6 Schaden, +15 Mana, Flüche kosten -1 Verderbnis',
    lore: 'Die Hexen des Moors webten ihre Stimmen in das Holz.',
    effects: { damage: 6, mana: 15 },
    classBonus: { magier: { damage: 4, maxMana: 10 } },
    regionBias: ['nebelmoor'],
  },
  {
    id: 'W07',
    name: 'Zweihandschwert "Gerichtstag"',
    category: 'weapon',
    slot: 'weapon',
    rarity: 'rare',
    runeSlots: 2,
    description: '+20 Schaden, -2 Rüstung (Kämpfer: kein Malus)',
    lore: 'Zu schwer für Feiglinge. Für alle anderen: unübertroffen.',
    effects: { damage: 20, armor: -2 },
    classBonus: { kaempfer: { armor: 2 } },
  },
  {
    id: 'W08',
    name: 'Splitterklinge des Schleiers',
    category: 'weapon',
    slot: 'weapon',
    rarity: 'rare',
    runeSlots: 3,
    description: '+15 Schaden, Verderbnis +1 bei Ausrüstung, +25% Schaden gegen Schleier-Einheiten',
    lore: 'Aus dem Körper eines gefallenen Bösewicht-Helden geborgen. Sie flüstert noch.',
    effects: { damage: 15, corruption: 1, armyStrengthMult: 1.25 },
    onKill: 'SCHLEIER_ECHO',
  },
];

// ═══════════════════════════════════════════════════════════════════
// RÜSTUNGEN (6)
// ═══════════════════════════════════════════════════════════════════
export const ARMORS: Item[] = [
  {
    id: 'A01',
    name: 'Lederrüstung des Grenzläufers',
    category: 'armor',
    slot: 'armor',
    rarity: 'common',
    runeSlots: 1,
    description: '+5 Rüstung, +10 Max-HP',
    lore: 'Einfach. Bewährt. Ersetzbar.',
    effects: { armor: 5, maxHp: 10 },
    regionBias: ['grenzlande'],
  },
  {
    id: 'A02',
    name: 'Sumpfgehärtete Kettenrüstung',
    category: 'armor',
    slot: 'armor',
    rarity: 'common',
    runeSlots: 1,
    description: '+7 Rüstung, Moorfieber-Resistenz +50%',
    lore: 'Wer lange im Moor lebt, lernt: das Moor härtet alles, was es nicht tötet.',
    effects: { armor: 7, maxHp: 5 },
    regionBias: ['nebelmoor'],
  },
  {
    id: 'A03',
    name: 'Plattenrüstung "Eisenwille"',
    category: 'armor',
    slot: 'armor',
    rarity: 'uncommon',
    runeSlots: 2,
    description: '+12 Rüstung, +20 Max-HP, Flucht kostet +1 Sichtbarkeit',
    lore: 'Wer diese Rüstung trägt, flieht nicht gern. Die Rüstung weiß das auch.',
    effects: { armor: 12, maxHp: 20 },
    classBonus: { kaempfer: { armor: 3 } },
  },
  {
    id: 'A04',
    name: 'Nebelgewand',
    category: 'armor',
    slot: 'armor',
    rarity: 'uncommon',
    runeSlots: 2,
    description: '+4 Rüstung, +15 Max-HP, Sichtbarkeit -1 permanent, +10 Magieresistenz',
    lore: 'Gewebt aus echtem Moor-Nebel. Widersetzt sich Klasifizierung.',
    effects: { armor: 4, maxHp: 15, visibility: -1, magicResist: 10 },
    classBonus: { magier: { maxMana: 15 } },
    regionBias: ['nebelmoor'],
  },
  {
    id: 'A05',
    name: 'Blutpanzer des letzten Kommandanten',
    category: 'armor',
    slot: 'armor',
    rarity: 'rare',
    runeSlots: 3,
    description: '+18 Rüstung, +30 Max-HP, Anführer-HP +20%',
    lore: 'Der letzte Kommandant der Grenzfestung trug ihn, als der Schleier kam. Er überlebte. Die Festung nicht.',
    effects: { armor: 18, maxHp: 30 },
    classBonus: { kaempfer: { armor: 5, maxHp: 10 } },
  },
  {
    id: 'A06',
    name: 'Verderbte Schamanenrobe',
    category: 'armor',
    slot: 'armor',
    rarity: 'rare',
    runeSlots: 3,
    description: '+8 Rüstung, +25 Max-HP, +20 Max-Mana, Verderbnis +1 bei Ausrüstung',
    lore: 'Der Schamane, der sie trug, wollte mehr Macht als die Welt geben konnte. Er bekam sie.',
    effects: { armor: 8, maxHp: 25, maxMana: 20, corruption: 1 },
    classBonus: { magier: { maxMana: 15, manaRegen: 2 } },
    regionBias: ['nebelmoor'],
  },
];

// ═══════════════════════════════════════════════════════════════════
// ARTEFAKTE (12) — passive Dauereffekte
// ═══════════════════════════════════════════════════════════════════
export const ARTIFACTS: Item[] = [
  {
    id: 'ART01',
    name: 'Krone der Zersplitterten',
    category: 'artifact',
    slot: 'artifact',
    rarity: 'rare',
    runeSlots: 0,
    description: 'Armeeschaden +10% dauerhaft',
    lore: 'Keine Krone eines Königs — die Krone einer Armee. Jeder Splitter ein gefallener Soldat.',
    effects: { armyStrengthMult: 1.10 },
  },
  {
    id: 'ART02',
    name: 'Siegel der Stille',
    category: 'artifact',
    slot: 'artifact',
    rarity: 'uncommon',
    runeSlots: 0,
    description: 'Sichtbarkeit steigt nicht durch Magie-Aktionen (1 Run)',
    lore: 'Geprägt von einem Orden, der nicht existiert. Oder der es nicht mehr tut.',
    effects: {},
    onCurseApplied: 'SILENCE_SHIELD',
  },
  {
    id: 'ART03',
    name: 'Splitter des Schleiers',
    category: 'artifact',
    slot: 'artifact',
    rarity: 'rare',
    runeSlots: 0,
    description: 'Zeigt Schleier-Position 1x pro Gebiet',
    lore: 'Ein Fragment aus dem Kern des Schleiers selbst. Es sucht noch seinen Weg zurück.',
    effects: {},
  },
  {
    id: 'ART04',
    name: 'Blutpakt-Stein',
    category: 'artifact',
    slot: 'artifact',
    rarity: 'rare',
    runeSlots: 0,
    description: 'Anführer-HP +30%, Verderbnis +2 bei Ausrüstung',
    lore: 'Drei Anführer haben geschworen. Zwei haben bereut. Einer nie.',
    effects: { corruption: 2 },
  },
  {
    id: 'ART05',
    name: 'Orakel-Linse',
    category: 'artifact',
    slot: 'artifact',
    rarity: 'uncommon',
    runeSlots: 0,
    description: 'Alle Raumfarben im aktuellen Gebiet sichtbar',
    lore: 'Wer hindurchschaut, sieht alles — außer sich selbst.',
    effects: {},
  },
  {
    id: 'ART06',
    name: 'Kriegstrommel der Alten',
    category: 'artifact',
    slot: 'artifact',
    rarity: 'uncommon',
    runeSlots: 0,
    description: 'Miliz-Einheiten zählen doppelt bei Stärkekalkulation',
    lore: 'Ihr Klang lässt selbst Neulinge wie Veteranen kämpfen.',
    effects: { armyStrengthMult: 1.0 }, // Speziallogik im Combat-System
  },
  {
    id: 'ART07',
    name: 'Nebelstein des Moors',
    category: 'artifact',
    slot: 'artifact',
    rarity: 'rare',
    runeSlots: 0,
    description: 'Sichtbarkeit sinkt nach jedem Raum ohne Kampf um 1',
    lore: 'Der Stein atmet. Langsam. Stetig.',
    effects: {},
    regionBias: ['nebelmoor'],
  },
  {
    id: 'ART08',
    name: 'Ring der Wachsamkeit',
    category: 'artifact',
    slot: 'artifact',
    rarity: 'common',
    runeSlots: 0,
    description: '+10% Skillcheck-Erfolgswahrscheinlichkeit',
    lore: 'Kein Edelstein. Nur graues Eisen und die Gewohnheit, aufzupassen.',
    effects: { skillCheckBonus: 10 },
  },
  {
    id: 'ART09',
    name: 'Bannstein des Wanderers',
    category: 'artifact',
    slot: 'artifact',
    rarity: 'uncommon',
    runeSlots: 0,
    description: 'Flucht-Chance +15% (alle 3 Fluchten)',
    lore: 'Jemand hat ihn sieben Mal benutzt und sieben Mal überlebt. Den achten kennt niemand.',
    effects: { escapeChanceBonus: 15 },
  },
  {
    id: 'ART10',
    name: 'Herzstein des Anführers',
    category: 'artifact',
    slot: 'artifact',
    rarity: 'rare',
    runeSlots: 0,
    description: 'Anführer-Helden: Abgangs-Bedingung einmal ignorieren',
    lore: 'Wer ihn trägt, hält seine Verbündeten — zumindest eine Weile.',
    effects: {},
  },
  {
    id: 'ART11',
    name: 'Verwitterter Kompass',
    category: 'artifact',
    slot: 'artifact',
    rarity: 'common',
    runeSlots: 0,
    description: 'Exit-Knoten immer sichtbar (auch durch Fog of War)',
    lore: 'Er zeigt nicht Norden. Er zeigt Ausgang.',
    effects: {},
  },
  {
    id: 'ART12',
    name: 'Sturmschild-Splitter',
    category: 'artifact',
    slot: 'artifact',
    rarity: 'uncommon',
    runeSlots: 0,
    description: 'Einmal pro Kampf: ersten Treffer vollständig blocken',
    lore: 'Alles was vom großen Sturmschild übrig blieb. Es reicht noch für einen Block.',
    effects: {},
  },
];

// ═══════════════════════════════════════════════════════════════════
// CONSUMABLES (10)
// ═══════════════════════════════════════════════════════════════════
export const CONSUMABLES: Item[] = [
  {
    id: 'C01',
    name: 'Heiltrank',
    category: 'consumable',
    slot: 'bag',
    rarity: 'common',
    runeSlots: 0,
    description: '+30 HP sofort',
    lore: 'Schmeckt nach Moos und altem Eisen. Wirkt trotzdem.',
    effects: { hp: 30 },
  },
  {
    id: 'C02',
    name: 'Großer Heiltrank',
    category: 'consumable',
    slot: 'bag',
    rarity: 'uncommon',
    runeSlots: 0,
    description: '+60 HP sofort, +10 Max-HP dauerhaft',
    lore: 'Dreifach destilliert. Dreifach bitter.',
    effects: { hp: 60, maxHp: 10 },
  },
  {
    id: 'C03',
    name: 'Manatrank',
    category: 'consumable',
    slot: 'bag',
    rarity: 'common',
    runeSlots: 0,
    description: '+40 Mana sofort',
    lore: 'Die Destillation eines Gewitters.',
    effects: { mana: 40 },
  },
  {
    id: 'C04',
    name: 'Reinigungstrank',
    category: 'consumable',
    slot: 'bag',
    rarity: 'uncommon',
    runeSlots: 0,
    description: 'Heilt einen aktiven Fluch, Verderbnis -1',
    lore: 'Wer ihn braute, wusste genau, was er tat. Und was er damit aufgab.',
    effects: { corruption: -1 },
  },
  {
    id: 'C05',
    name: 'Nebelkapsel',
    category: 'consumable',
    slot: 'bag',
    rarity: 'common',
    runeSlots: 0,
    description: 'Sichtbarkeit -2 sofort (einmalig)',
    lore: 'Im Notfall zerdrücken.',
    effects: { visibility: -2 },
  },
  {
    id: 'C06',
    name: 'Kriegshorn-Splitter',
    category: 'consumable',
    slot: 'bag',
    rarity: 'uncommon',
    runeSlots: 0,
    description: 'Nächster Kampf: Armee +20% Stärke',
    lore: 'Das Horn zersplitterte in der letzten großen Schlacht. Der Klang hallte drei Tage.',
    effects: { armyStrengthMult: 1.20 }, // nur nächster Kampf
  },
  {
    id: 'C07',
    name: 'Schriftrolle der Kartierung',
    category: 'consumable',
    slot: 'bag',
    rarity: 'common',
    runeSlots: 0,
    description: 'Enthüllt alle Nachbarn des aktuellen Knotens',
    lore: 'Jemand hat das sehr sorgfältig aufgezeichnet. Zu sorgfältig.',
    effects: {},
  },
  {
    id: 'C08',
    name: 'Bluttrank des Pakts',
    category: 'consumable',
    slot: 'bag',
    rarity: 'rare',
    runeSlots: 0,
    description: '+50 HP, Armeestärke +15% für diesen Raum, Verderbnis +2',
    lore: 'Wer trinkt, gewinnt. Wer zu oft trinkt, verliert sich.',
    effects: { hp: 50, armyStrengthMult: 1.15, corruption: 2 },
  },
  {
    id: 'C09',
    name: 'Talisman des stillen Weges',
    category: 'consumable',
    slot: 'bag',
    rarity: 'uncommon',
    runeSlots: 0,
    description: 'Nächste Route: keine Sichtbarkeits-Erhöhung durch Bewegung',
    lore: 'Aus dem Knochen eines Pilgers. Er wollte unentdeckt reisen. Es hat funktioniert.',
    effects: {},
  },
  {
    id: 'C10',
    name: 'Phiole der Verderbnis-Bindung',
    category: 'consumable',
    slot: 'bag',
    rarity: 'rare',
    runeSlots: 0,
    description: 'Konvertiert 3 Verderbnis zu +10% Armeestärke für 1 Gebiet',
    lore: 'Der Alchemist, der sie erfand, starb reich und wahnsinnig. In dieser Reihenfolge.',
    effects: { corruption: -3 },
  },
];

// ═══════════════════════════════════════════════════════════════════
// ALLE ITEMS — kombinierte Map für schnellen Zugriff
// ═══════════════════════════════════════════════════════════════════
export const ALL_ITEMS: Map<string, Item> = new Map([
  ...WEAPONS.map(i => [i.id, i] as [string, Item]),
  ...ARMORS.map(i => [i.id, i] as [string, Item]),
  ...ARTIFACTS.map(i => [i.id, i] as [string, Item]),
  ...CONSUMABLES.map(i => [i.id, i] as [string, Item]),
]);

// ═══════════════════════════════════════════════════════════════════
// LOOT-TABELLEN
// ═══════════════════════════════════════════════════════════════════
export interface LootTableEntry {
  itemId: string;
  weight: number;
  regions?: string[];
}

export type RoomRisk = 'green' | 'yellow' | 'red';

export function getLootTable(risk: RoomRisk, region: string): LootTableEntry[] {
  const base: LootTableEntry[] = [];

  if (risk === 'green') {
    // Common items only
    base.push(
      { itemId: 'C01', weight: 30 },
      { itemId: 'C05', weight: 20 },
      { itemId: 'C07', weight: 20 },
      { itemId: 'W01', weight: 10, regions: ['grenzlande'] },
      { itemId: 'W02', weight: 10, regions: ['nebelmoor'] },
      { itemId: 'A01', weight: 10, regions: ['grenzlande'] },
      { itemId: 'A02', weight: 10, regions: ['nebelmoor'] },
      { itemId: 'ART08', weight: 8 },
      { itemId: 'ART11', weight: 8 },
    );
  } else if (risk === 'yellow') {
    // Common + Uncommon
    base.push(
      { itemId: 'C02', weight: 15 },
      { itemId: 'C03', weight: 15 },
      { itemId: 'C06', weight: 10 },
      { itemId: 'W03', weight: 12 },
      { itemId: 'W04', weight: 12 },
      { itemId: 'W06', weight: 10, regions: ['nebelmoor'] },
      { itemId: 'A03', weight: 12 },
      { itemId: 'A04', weight: 10, regions: ['nebelmoor'] },
      { itemId: 'ART02', weight: 8 },
      { itemId: 'ART05', weight: 8 },
      { itemId: 'ART09', weight: 8 },
      { itemId: 'ART12', weight: 8 },
      { itemId: 'C04', weight: 10 },
      { itemId: 'C09', weight: 8 },
    );
  } else {
    // All rarities, Artifacts guaranteed possible
    base.push(
      { itemId: 'W05', weight: 15, regions: ['grenzlande'] },
      { itemId: 'W07', weight: 15 },
      { itemId: 'W08', weight: 12 },
      { itemId: 'A05', weight: 15 },
      { itemId: 'A06', weight: 12, regions: ['nebelmoor'] },
      { itemId: 'ART01', weight: 12 },
      { itemId: 'ART03', weight: 10 },
      { itemId: 'ART04', weight: 10 },
      { itemId: 'ART07', weight: 10, regions: ['nebelmoor'] },
      { itemId: 'ART10', weight: 10 },
      { itemId: 'C08', weight: 10 },
      { itemId: 'C10', weight: 10 },
    );
  }

  // Filter by region and apply weight bonus for region-bias items
  return base.map(entry => {
    const item = ALL_ITEMS.get(entry.itemId);
    if (!item) return entry;
    // Skip items explicitly for other regions
    if (entry.regions && entry.regions.length > 0 && !entry.regions.includes(region)) {
      return { ...entry, weight: 0 };
    }
    // Bonus weight for region-biased items in their home region
    if (item.regionBias?.includes(region)) {
      return { ...entry, weight: entry.weight * 1.5 };
    }
    return entry;
  }).filter(e => e.weight > 0);
}

export function rollLoot(risk: RoomRisk, region: string, rng: () => number): Item | null {
  // Drop chance by risk
  const dropChance = risk === 'green' ? 0.40 : risk === 'yellow' ? 0.65 : 0.90;
  if (rng() > dropChance) return null;

  const table = getLootTable(risk, region);
  if (!table.length) return null;

  const totalWeight = table.reduce((s, e) => s + e.weight, 0);
  let roll = rng() * totalWeight;

  for (const entry of table) {
    roll -= entry.weight;
    if (roll <= 0) {
      return ALL_ITEMS.get(entry.itemId) || null;
    }
  }
  return null;
}
