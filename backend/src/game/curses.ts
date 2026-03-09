// ═══════════════════════════════════════════════════════════════════
// SCHLEIER & DUNKEL — Fluch-System (SRS v3.1)
// 10 Flüche + 6 Kombinations-Effekte
// ═══════════════════════════════════════════════════════════════════

export type CurseTrigger =
  | 'on_combat_start'
  | 'on_room_enter'
  | 'on_attack'
  | 'on_heal'
  | 'on_escape'
  | 'on_loot'
  | 'on_skill_use'
  | 'passive';

export interface CurseEffect {
  hpPerRound?: number;          // Schaden pro Runde (negativ)
  maxHpMult?: number;           // Reduktion Max-HP (z.B. 0.8 = -20%)
  damageMult?: number;          // Schaden-Multiplikator (z.B. 0.8 = -20%)
  armorMult?: number;           // Rüstungs-Multiplikator
  armyStrengthMult?: number;
  escapeChanceMult?: number;    // Flucht-Chance modifizieren
  visibilityPerRoom?: number;   // +X Sichtbarkeit pro Raum
  corruptionPerRoom?: number;
  skillCostIncrease?: number;   // Skill kostet mehr
  healingMult?: number;         // Heilung reduziert
  goldMult?: number;            // Gold-Einnahmen reduziert
  movementCost?: number;        // Extra Kosten pro Bewegungsschritt
  lootChanceMult?: number;
  // Spezielle Trigger
  onCombatStart?: string;       // Effekt-ID
  onRoomEnter?: string;
  onHeal?: string;
}

export interface Curse {
  id: string;
  name: string;
  icon: string;
  description: string;
  lore: string;
  trigger: CurseTrigger;
  effect: CurseEffect;
  duration: number | 'permanent' | 'run';  // Räume oder 'permanent' / 'run'
  severity: 1 | 2 | 3;         // 1=leicht, 2=mittel, 3=schwer
  cureOptions: string[];        // Was kann heilen ('merchant', 'mentor', 'cleanser', 'rest')
  corruptionGain: number;       // Wie viel Verderbnis beim Anwenden
  source: string[];             // Woher kommt der Fluch ('event', 'veil_action', 'item', 'combat')
}

// ═══════════════════════════════════════════════════════════════════
// 10 FLÜCHE
// ═══════════════════════════════════════════════════════════════════
export const CURSES: Curse[] = [
  {
    id: 'CRS_MOORFIEBER',
    name: 'Moorfieber',
    icon: '🤒',
    description: 'Heilung -25%, Max-HP -10 für Fluch-Dauer',
    lore: 'Das Moor gibt nichts zurück, was es einmal berührt hat.',
    trigger: 'passive',
    effect: { healingMult: 0.75, maxHpMult: 0.9 },
    duration: 4,
    severity: 2,
    cureOptions: ['merchant', 'cleanser'],
    corruptionGain: 0,
    source: ['event', 'combat'],
  },
  {
    id: 'CRS_SCHLEIERMARK',
    name: 'Schleier-Mark',
    icon: '👁',
    description: '+1 Sichtbarkeit pro Raum, Schleier-KI priorisiert dich',
    lore: 'Er hat dich gesehen. Jetzt weiß er, wo du bist.',
    trigger: 'on_room_enter',
    effect: { visibilityPerRoom: 1 },
    duration: 3,
    severity: 2,
    cureOptions: ['mentor', 'cleanser'],
    corruptionGain: 0,
    source: ['veil_action', 'event'],
  },
  {
    id: 'CRS_VERDERBNIS_WUCHERUNG',
    name: 'Verderbnis-Wucherung',
    icon: '☠',
    description: '+1 Verderbnis pro Raum, Schaden -10%',
    lore: 'Die Dunkelheit wächst von innen.',
    trigger: 'on_room_enter',
    effect: { corruptionPerRoom: 1, damageMult: 0.9 },
    duration: 5,
    severity: 3,
    cureOptions: ['cleanser', 'merchant'],
    corruptionGain: 2,
    source: ['event', 'item', 'combat'],
  },
  {
    id: 'CRS_BLUTSCHULD',
    name: 'Blutschuld',
    icon: '🩸',
    description: '-5 HP pro Runde im Kampf, Gold-Einnahmen -30%',
    lore: 'Die Schuld fordert ihren Preis. In Blut oder Gold.',
    trigger: 'on_combat_start',
    effect: { hpPerRound: -5, goldMult: 0.7 },
    duration: 3,
    severity: 2,
    cureOptions: ['merchant', 'rest'],
    corruptionGain: 1,
    source: ['event', 'veil_action'],
  },
  {
    id: 'CRS_ZITTERNDE_HAND',
    name: 'Zitternde Hand',
    icon: '🫳',
    description: 'Schaden -20%, Krit-Chance -5%',
    lore: 'Der Fluch greift nach deiner Hand, bevor du es selbst tust.',
    trigger: 'passive',
    effect: { damageMult: 0.8 },
    duration: 3,
    severity: 1,
    cureOptions: ['mentor', 'rest', 'cleanser'],
    corruptionGain: 0,
    source: ['event', 'combat'],
  },
  {
    id: 'CRS_LÄHMENDER_SCHLEIER',
    name: 'Lähmender Schleier',
    icon: '🕸',
    description: 'Flucht-Chance -30%, erste Kampfrunde: Armee -10% Stärke',
    lore: 'Unsichtbare Fäden. Du merkst sie erst, wenn du fliehen willst.',
    trigger: 'on_combat_start',
    effect: { escapeChanceMult: 0.7, armyStrengthMult: 0.9 },
    duration: 4,
    severity: 2,
    cureOptions: ['cleanser', 'mentor'],
    corruptionGain: 1,
    source: ['veil_action', 'event'],
  },
  {
    id: 'CRS_GEISTERRUF',
    name: 'Geisterruf',
    icon: '👻',
    description: 'Sichtbarkeit +2 beim Betreten jedes roten Raums',
    lore: 'Die Geister singen deinen Namen. Laut.',
    trigger: 'on_room_enter',
    effect: { visibilityPerRoom: 0 }, // Nur rote Räume: Logik im Room-Enter-Handler
    duration: 'run',
    severity: 2,
    cureOptions: ['cleanser'],
    corruptionGain: 1,
    source: ['event', 'item'],
  },
  {
    id: 'CRS_BETTLERS_LAST',
    name: 'Bettlers Last',
    icon: '💸',
    description: 'Loot-Chance -40%, Händler-Preise +50%',
    lore: 'Wer unter diesem Fluch leidet, findet immer das Schlechteste.',
    trigger: 'on_loot',
    effect: { lootChanceMult: 0.6, goldMult: 0.5 },
    duration: 3,
    severity: 1,
    cureOptions: ['merchant', 'rest'],
    corruptionGain: 0,
    source: ['event', 'item'],
  },
  {
    id: 'CRS_FLEISCHHUNGER',
    name: 'Fleischhunger',
    icon: '🦷',
    description: 'Pro Raum ohne Kampf: -3 HP. Pro Kampfsieg: +5 HP.',
    lore: 'Er hat Hunger bekommen. Er hört nicht mehr auf damit.',
    trigger: 'on_room_enter',
    effect: { hpPerRound: -3 }, // onVictory: HP_5
    duration: 'run',
    severity: 3,
    cureOptions: ['cleanser'],
    corruptionGain: 2,
    source: ['event', 'veil_action'],
  },
  {
    id: 'CRS_EISIGE_SEELE',
    name: 'Eisige Seele',
    icon: '🧊',
    description: 'Armee-Rekrutierung -50%, keine Anführer in dieser Gebiet-Phase',
    lore: 'Kein Krieger folgt einem, dessen Herz aufgehört hat zu schlagen.',
    trigger: 'passive',
    effect: { armyStrengthMult: 0.85 }, // recruitmentMult: 0.5, noLeaders: true
    duration: 'run', // Endet nach Gebiet-Abschluss (region-scoped)
    severity: 3,
    cureOptions: ['cleanser', 'mentor'],
    corruptionGain: 1,
    source: ['veil_action', 'event'],
  },
];

// ═══════════════════════════════════════════════════════════════════
// 6 KOMBINATIONS-EFFEKTE (zwei aktive Flüche = Synergie)
// ═══════════════════════════════════════════════════════════════════
export interface CurseSynergy {
  id: string;
  name: string;
  icon: string;
  curses: [string, string];    // Zwei Fluch-IDs die sich kombinieren
  description: string;
  lore: string;
  additionalEffect: CurseEffect;
  severity: 1 | 2 | 3;
}

export const CURSE_SYNERGIES: CurseSynergy[] = [
  {
    id: 'SYN_VERDORBENER_SOLDAT',
    name: 'Verdorbener Soldat',
    icon: '💀',
    curses: ['CRS_VERDERBNIS_WUCHERUNG', 'CRS_ZITTERNDE_HAND'],
    description: 'Armeestärke -20% zusätzlich, jede Runde im Kampf: Verderbnis +1',
    lore: 'Wenn die Dunkelheit die Hand hält und der Geist folgt — was bleibt übrig?',
    additionalEffect: { armyStrengthMult: 0.8, corruptionPerRoom: 1 },
    severity: 3,
  },
  {
    id: 'SYN_GEJAGTER_GEIST',
    name: 'Gejagter Geist',
    icon: '🌑',
    curses: ['CRS_SCHLEIERMARK', 'CRS_GEISTERRUF'],
    description: 'Schleier-KI bewegt sich immer auf dich zu, +2 Sichtbarkeit pro Raum',
    lore: 'Die Mark und die Geister zusammen — du bist ein Leuchtturm im Dunkel.',
    additionalEffect: { visibilityPerRoom: 2 },
    severity: 3,
  },
  {
    id: 'SYN_BLUTIGER_HUNGER',
    name: 'Blutiger Hunger',
    icon: '🩸',
    curses: ['CRS_BLUTSCHULD', 'CRS_FLEISCHHUNGER'],
    description: '-8 HP pro Runde im Kampf, aber Kampfsieg gibt +15 HP und +10 Gold',
    lore: 'Zahle mit Blut. Ernte mit Blut. Ein grausamer Kreislauf.',
    additionalEffect: { hpPerRound: -3 }, // onVictory: HP_15_GOLD_10
    severity: 2,
  },
  {
    id: 'SYN_VERLORENER_BETTLER',
    name: 'Verlorener Bettler',
    icon: '💸',
    curses: ['CRS_BETTLERS_LAST', 'CRS_BLUTSCHULD'],
    description: 'Gold-Einnahmen -60%, kein Loot aus grünen Räumen',
    lore: 'Arm. Krank. Verflucht. Die vollständige Triade.',
    additionalEffect: { goldMult: 0.4, lootChanceMult: 0 },
    severity: 1,
  },
  {
    id: 'SYN_GEFESSELTE_ARMEE',
    name: 'Gefesselte Armee',
    icon: '⛓',
    curses: ['CRS_LÄHMENDER_SCHLEIER', 'CRS_EISIGE_SEELE'],
    description: 'Keine Flucht möglich, Armee-Rekrutierung vollständig gesperrt',
    lore: 'Du kämpfst allein. Du kannst nicht entkommen. Gut.',
    additionalEffect: { escapeChanceMult: 0, armyStrengthMult: 0.7 },
    severity: 3,
  },
  {
    id: 'SYN_FIEBERNDER_SCHATTEN',
    name: 'Fiebernder Schatten',
    icon: '🌡',
    curses: ['CRS_MOORFIEBER', 'CRS_SCHLEIERMARK'],
    description: 'Kein Heilung in gelben und roten Räumen, Sichtbarkeit +1 pro Heilversuch',
    lore: 'Das Fieber macht dich sichtbar. Deine Schwäche ist dein Verräter.',
    additionalEffect: { healingMult: 0 }, // healBlocked: ['yellow', 'red']
    severity: 3,
  },
];

// ═══════════════════════════════════════════════════════════════════
// AKTIVER FLUCH-STATE (im Run)
// ═══════════════════════════════════════════════════════════════════
export interface ActiveCurse {
  curseId: string;
  remainingDuration: number | 'permanent' | 'run';
  appliedAtStep: number;
  source: string;
}

export interface CurseState {
  activeCurses: ActiveCurse[];
  activeSynergies: string[];    // Synergie-IDs die gerade aktiv sind
}

export function getActiveSynergies(activeCurseIds: string[]): CurseSynergy[] {
  return CURSE_SYNERGIES.filter(syn =>
    syn.curses.every(cId => activeCurseIds.includes(cId))
  );
}

export function applyCurse(
  state: CurseState,
  curseId: string,
  currentStep: number,
  source: string
): CurseState {
  const curse = CURSES.find(c => c.id === curseId);
  if (!curse) return state;

  // Nicht doppelt anwenden (außer stackable curses — keine in v3.1)
  if (state.activeCurses.find(ac => ac.curseId === curseId)) return state;

  const newCurse: ActiveCurse = {
    curseId,
    remainingDuration: curse.duration,
    appliedAtStep: currentStep,
    source,
  };

  const newActiveCurses = [...state.activeCurses, newCurse];
  const newActiveSynergies = getActiveSynergies(newActiveCurses.map(ac => ac.curseId))
    .map(syn => syn.id);

  return { activeCurses: newActiveCurses, activeSynergies: newActiveSynergies };
}

export function tickCurses(state: CurseState): CurseState {
  const remaining = state.activeCurses.filter(ac => {
    if (ac.remainingDuration === 'permanent' || ac.remainingDuration === 'run') return true;
    return (ac.remainingDuration as number) > 1;
  }).map(ac => {
    if (typeof ac.remainingDuration === 'number') {
      return { ...ac, remainingDuration: ac.remainingDuration - 1 };
    }
    return ac;
  });

  const newActiveSynergies = getActiveSynergies(remaining.map(ac => ac.curseId))
    .map(syn => syn.id);

  return { activeCurses: remaining, activeSynergies: newActiveSynergies };
}

export function removeCurse(state: CurseState, curseId: string): CurseState {
  const remaining = state.activeCurses.filter(ac => ac.curseId !== curseId);
  const newActiveSynergies = getActiveSynergies(remaining.map(ac => ac.curseId))
    .map(syn => syn.id);
  return { activeCurses: remaining, activeSynergies: newActiveSynergies };
}

export function clearRegionScopedCurses(state: CurseState): CurseState {
  const remaining = state.activeCurses.filter(ac => ac.remainingDuration !== 'run');
  const newActiveSynergies = getActiveSynergies(remaining.map(ac => ac.curseId))
    .map(syn => syn.id);
  return { activeCurses: remaining, activeSynergies: newActiveSynergies };
}

/**
 * Berechnet den kombinierten Fluch-Effekt aller aktiven Flüche + Synergien.
 */
export function computeCurseEffect(state: CurseState): CurseEffect {
  const combined: CurseEffect = {};

  const allEffects: CurseEffect[] = [
    ...state.activeCurses.map(ac => {
      const curse = CURSES.find(c => c.id === ac.curseId);
      return curse?.effect || {};
    }),
    ...state.activeSynergies.map(synId => {
      const syn = CURSE_SYNERGIES.find(s => s.id === synId);
      return syn?.additionalEffect || {};
    }),
  ];

  for (const effect of allEffects) {
    for (const [key, val] of Object.entries(effect)) {
      const k = key as keyof CurseEffect;
      if (typeof val === 'number') {
        const isMultiplier = k.endsWith('Mult');
        if (isMultiplier) {
          (combined[k] as number) = ((combined[k] as number) ?? 1.0) * val;
        } else {
          (combined[k] as number) = ((combined[k] as number) ?? 0) + val;
        }
      }
    }
  }
  return combined;
}
