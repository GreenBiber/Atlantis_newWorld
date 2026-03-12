// ═══════════════════════════════════════════════════════════════════
// SCHLEIER & DUNKEL — Fluch-System (SRS v3.1)
// 10 Flüche + 6 Kombinations-Effekte
// ═══════════════════════════════════════════════════════════════════

export type CurseSide = 'hero' | 'veil';
export type CurseScope = 'run' | 'region'; // region = endet nach aktuellem Gebiet

export interface CurseEffect {
  damageReduction?: number;      // % weniger Schaden verursachen
  damageIncrease?: number;       // % mehr Schaden erleiden
  healingReduction?: number;     // % weniger Heilung erhalten
  visibilityPerRoom?: number;    // Sichtbarkeit +X pro Raum
  corruptionPerRoom?: number;    // Verderbnis +X pro Raum
  threatPerRoom?: number;        // Bedrohung +X pro Raum
  maxHpReduction?: number;       // Max-HP reduzieren
  escapeChancePenalty?: number;  // Flucht-Chance -X%
  skillCheckPenalty?: number;    // Skillcheck -X%
  armyStrengthMult?: number;     // Armeestärke Multiplikator
  goldLossPerRoom?: number;      // Gold-Verlust pro Raum
  special?: string;              // Spezial-Effekt-ID
}

export interface Curse {
  id: string;
  name: string;
  description: string;
  effect: CurseEffect;
  scope: CurseScope;
  removalCost?: number;           // Gold zum Entfernen beim Händler
  removalMethod: string[];        // 'merchant' | 'cleanser_item' | 'mentor_room'
  lore: string;
}

export interface CurseCombo {
  id: string;
  name: string;
  requiredCurseIds: string[];     // Beide müssen aktiv sein
  description: string;
  bonusEffect: CurseEffect;
  lore: string;
}

// ═══════════════════════════════════════════════════════════════════
// 10 FLÜCHE
// ═══════════════════════════════════════════════════════════════════
export const CURSES: Curse[] = [
  {
    id: 'CU01',
    name: 'Moorfieber',
    description: 'Heilung -25%, Max-HP -10',
    scope: 'region',
    removalCost: 30,
    removalMethod: ['merchant', 'cleanser_item'],
    lore: 'Das Moor lässt sich nicht einfach verlassen. Es bleibt in den Knochen.',
    effect: { healingReduction: 25, maxHpReduction: 10 },
  },
  {
    id: 'CU02',
    name: 'Schleierfluch',
    description: 'Bedrohung +1 pro Raum, Sichtbarkeit +1 pro Kampf',
    scope: 'run',
    removalCost: 50,
    removalMethod: ['merchant', 'mentor_room'],
    lore: 'Der Schleier hat seine Markierung hinterlassen. Jetzt wissen alle, wo du bist.',
    effect: { threatPerRoom: 1, visibilityPerRoom: 1 },
  },
  {
    id: 'CU03',
    name: 'Verderbte Klinge',
    description: 'Armeeschaden -15%, Verderbnis +1 pro 3 Räume',
    scope: 'run',
    removalCost: 40,
    removalMethod: ['merchant', 'cleanser_item'],
    lore: 'Die Waffe hat zu viel Böses berührt. Das Böse berührt jetzt zurück.',
    effect: { armyStrengthMult: 0.85, corruptionPerRoom: 0.33 },
  },
  {
    id: 'CU04',
    name: 'Bleigewicht',
    description: 'Flucht-Chance -20%, Bewegung kostet +1 Sichtbarkeit',
    scope: 'region',
    removalCost: 35,
    removalMethod: ['merchant', 'cleanser_item'],
    lore: 'Als würde jemand an deinen Fersen hängen. Jemand tut es.',
    effect: { escapeChancePenalty: 20, visibilityPerRoom: 1 },
  },
  {
    id: 'CU05',
    name: 'Goldgier',
    description: 'Gold-Verlust 5G pro Raum, Skillchecks -15%',
    scope: 'run',
    removalCost: 25,
    removalMethod: ['cleanser_item'],
    lore: 'Das Geld fließt durch die Finger wie Wasser. Jemand sammelt es ein.',
    effect: { goldLossPerRoom: 5, skillCheckPenalty: 15 },
  },
  {
    id: 'CU06',
    name: 'Gebrochener Wille',
    description: 'Armeestärke -20% in Kämpfen, Anführer -1 Moral',
    scope: 'run',
    removalCost: 60,
    removalMethod: ['merchant', 'mentor_room'],
    lore: 'Der Geist der Armee ist gebrochen. Nicht durch Niederlage — durch Flüstern.',
    effect: { armyStrengthMult: 0.80, special: 'WILLBREAK_LEADER' },
  },
  {
    id: 'CU07',
    name: 'Schattenspur',
    description: 'Schleier kennt immer deinen aktuellen Knoten',
    scope: 'run',
    removalCost: 70,
    removalMethod: ['mentor_room'],
    lore: 'Du hinterlässt eine Spur die kein Auge sieht — aber der Schleier spürt sie.',
    effect: { special: 'SHADOW_TRAIL' },
  },
  {
    id: 'CU08',
    name: 'Blutendes Herz',
    description: '-5 HP pro Raum ohne Heilung',
    scope: 'region',
    removalCost: 40,
    removalMethod: ['cleanser_item', 'merchant'],
    lore: 'Eine alte Wunde die nicht heilen will. Sie erinnert dich an jeden Schritt.',
    effect: { special: 'BLEEDING_TICK' },
  },
  {
    id: 'CU09',
    name: 'Verwirrte Runen',
    description: 'Alle gesockelten Runen-Effekte halbiert',
    scope: 'run',
    removalCost: 55,
    removalMethod: ['merchant', 'mentor_room'],
    lore: 'Die Runen sprechen noch — aber in der falschen Sprache.',
    effect: { special: 'RUNE_CONFUSION' },
  },
  {
    id: 'CU10',
    name: 'Doppelgänger',
    description: 'Schleier-KI erhält 1 Schritt Vorschau auf deine Route',
    scope: 'region',
    removalCost: 80,
    removalMethod: ['mentor_room'],
    lore: 'Jemand bewegt sich genau wie du. Nur einen Schritt vor dir.',
    effect: { special: 'DOPPELGAENGER_PREVIEW' },
  },
];

// ═══════════════════════════════════════════════════════════════════
// 6 KOMBINATIONS-EFFEKTE
// ═══════════════════════════════════════════════════════════════════
export const CURSE_COMBOS: CurseCombo[] = [
  {
    id: 'CC01',
    name: 'Verfluchter Krieger',
    requiredCurseIds: ['CU03', 'CU06'],
    description: 'Armeestärke -30% gesamt, aber Held: +10 Schaden (Verzweiflung)',
    bonusEffect: { armyStrengthMult: 0.70, special: 'CURSED_WARRIOR_DESPAIR' },
    lore: 'Wenn die Armee fällt, kämpft der Held allein — mit allem was er hat.',
  },
  {
    id: 'CC02',
    name: 'Unsichtbares Grab',
    requiredCurseIds: ['CU07', 'CU04'],
    description: 'Schleier weiß deinen Knoten UND Flucht -30% — gefangen',
    bonusEffect: { escapeChancePenalty: 30, special: 'UNSICHTBARES_GRAB' },
    lore: 'Du kannst nicht fliehen. Du kannst nicht verstecken. Du kannst nur kämpfen.',
  },
  {
    id: 'CC03',
    name: 'Verderbte Seele',
    requiredCurseIds: ['CU02', 'CU03'],
    description: 'Verderbnis steigt doppelt schnell, Schleier-Stufe +1 sofort',
    bonusEffect: { corruptionPerRoom: 1, special: 'VERDERBTE_SEELE_ESCALATE' },
    lore: 'Der Schleier ist nicht nur um dich — er ist in dir.',
  },
  {
    id: 'CC04',
    name: 'Goldener Käfig',
    requiredCurseIds: ['CU05', 'CU08'],
    description: 'Gold-Verlust +5G pro Raum, HP-Verlust +5 pro Raum — stirb arm',
    bonusEffect: { goldLossPerRoom: 5, special: 'GOLDEN_CAGE_TICK' },
    lore: 'Reichtum und Leben fließen gleichzeitig ab. Du weißt nicht welcher schneller geht.',
  },
  {
    id: 'CC05',
    name: 'Runenzerstörer',
    requiredCurseIds: ['CU09', 'CU02'],
    description: 'Runen-Effekte deaktiviert UND Schleier stiehlt Runen häufiger (+20%)',
    bonusEffect: { special: 'RUNE_DESTROYER_FULL' },
    lore: 'Die Runen schweigen. Der Schleier hört sie trotzdem.',
  },
  {
    id: 'CC06',
    name: 'Totaler Verrat',
    requiredCurseIds: ['CU07', 'CU10'],
    description: 'Schleier kennt Route UND sieht 1 Schritt voraus — perfekte Jagd',
    bonusEffect: { special: 'TOTALER_VERRAT_HUNT' },
    lore: 'Es gibt keinen Plan mehr. Nur noch den Weg nach vorn.',
  },
];

// ═══════════════════════════════════════════════════════════════════
// FLUCH ANWENDEN
// ═══════════════════════════════════════════════════════════════════
export function applyCurse(
  activeCurseIds: string[],
  newCurseId: string
): { updatedCurses: string[]; comboActivated: CurseCombo | null } {
  if (activeCurseIds.includes(newCurseId)) {
    return { updatedCurses: activeCurseIds, comboActivated: null };
  }
  const updated = [...activeCurseIds, newCurseId];

  // Kombinations-Effekte prüfen
  const combo = CURSE_COMBOS.find(c =>
    c.requiredCurseIds.every(id => updated.includes(id))
  ) || null;

  return { updatedCurses: updated, comboActivated: combo };
}

export function removeCurse(activeCurseIds: string[], curseId: string): string[] {
  return activeCurseIds.filter(id => id !== curseId);
}

export function clearRegionScopedCurses(activeCurseIds: string[]): string[] {
  return activeCurseIds.filter(id => {
    const curse = CURSES.find(c => c.id === id);
    return curse?.scope === 'run'; // Nur Run-Flüche bleiben
  });
}

export function tickCurses(
  activeCurseIds: string[],
  heroState: { hp: number; maxHp: number; visibility: number; threat: number; corruption: number; gold: number }
): typeof heroState {
  const state = { ...heroState };
  for (const id of activeCurseIds) {
    const curse = CURSES.find(c => c.id === id);
    if (!curse) continue;
    if (curse.effect.visibilityPerRoom) state.visibility = Math.min(10, state.visibility + curse.effect.visibilityPerRoom);
    if (curse.effect.corruptionPerRoom) state.corruption = Math.min(10, state.corruption + curse.effect.corruptionPerRoom);
    if (curse.effect.threatPerRoom) state.threat = Math.min(10, state.threat + curse.effect.threatPerRoom);
    if (curse.effect.goldLossPerRoom) state.gold = Math.max(0, state.gold - curse.effect.goldLossPerRoom);
  }
  return state;
}

export function computeCurseEffect(activeCurseIds: string[]): CurseEffect {
  const combined: CurseEffect = {};
  for (const id of activeCurseIds) {
    const curse = CURSES.find(c => c.id === id);
    if (!curse) continue;
    if (curse.effect.damageReduction) combined.damageReduction = (combined.damageReduction || 0) + curse.effect.damageReduction;
    if (curse.effect.healingReduction) combined.healingReduction = (combined.healingReduction || 0) + curse.effect.healingReduction;
    if (curse.effect.escapeChancePenalty) combined.escapeChancePenalty = (combined.escapeChancePenalty || 0) + curse.effect.escapeChancePenalty;
    if (curse.effect.skillCheckPenalty) combined.skillCheckPenalty = (combined.skillCheckPenalty || 0) + curse.effect.skillCheckPenalty;
    if (curse.effect.armyStrengthMult) combined.armyStrengthMult = (combined.armyStrengthMult || 1.0) * curse.effect.armyStrengthMult;
    if (curse.effect.maxHpReduction) combined.maxHpReduction = (combined.maxHpReduction || 0) + curse.effect.maxHpReduction;
  }
  // Kombinations-Effekte
  const activeCombo = CURSE_COMBOS.find(c =>
    c.requiredCurseIds.every(id => activeCurseIds.includes(id))
  );
  if (activeCombo) {
    if (activeCombo.bonusEffect.escapeChancePenalty) combined.escapeChancePenalty = (combined.escapeChancePenalty || 0) + activeCombo.bonusEffect.escapeChancePenalty;
    if (activeCombo.bonusEffect.armyStrengthMult) combined.armyStrengthMult = (combined.armyStrengthMult || 1.0) * activeCombo.bonusEffect.armyStrengthMult;
    if (activeCombo.bonusEffect.special) combined.special = activeCombo.bonusEffect.special;
  }
  return combined;
}