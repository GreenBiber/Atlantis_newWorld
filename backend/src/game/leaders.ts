// ═══════════════════════════════════════════════════════════════════
// SCHLEIER & DUNKEL — Anführer-Helden System (SRS v3.1)
// 8 rekrutierbare Helden mit Abgangsbedingungen + Synergien
// ═══════════════════════════════════════════════════════════════════

export type LeaderClass = 'kaempfer' | 'magier' | 'schurke' | 'kommandant';

export type DepartureCondition =
  | 'corruption_5'          // Verderbnis >= 5
  | 'army_below_5'          // Armee < 5 Einheiten
  | 'three_losses'          // 3 Niederlagen in Folge
  | 'red_room_death'        // Stirbt in rotem Raum (dauerhaft)
  | 'veil_stage_5'          // Wenn Schleier Stufe V erreicht
  | 'gold_below_0'          // Gold < 0 nach Kauf
  | 'hero_hp_below_20pct'   // Helden-HP < 20%
  | 'never';                // Verlässt nie

export interface LeaderAbility {
  id: string;
  name: string;
  description: string;
  trigger: 'passive' | 'on_combat_start' | 'on_combat_end' | 'on_room_enter' | 'on_escape' | 'active';
  cooldown?: number;        // Räume (für active/triggered)
  effect: Record<string, number | string | boolean>;
}

export interface LeaderSynergy {
  withLeaderId: string;
  name: string;
  description: string;
  bonusEffect: Record<string, number | string | boolean>;
}

export interface Leader {
  id: string;
  name: string;
  class: LeaderClass;
  icon: string;
  description: string;
  lore: string;
  // Basis-Kampfwerte
  hp: number;
  maxHp: number;
  combatStrength: number;      // Basis-Beitrag zur Armeestärke
  // Fähigkeiten
  ability: LeaderAbility;
  passiveBonus: Partial<{
    armyStrengthMult: number;
    escapeChanceBonus: number;
    skillCheckBonus: number;
    goldMult: number;
    healingMult: number;
    damageBonus: number;
    armorBonus: number;
  }>;
  // Abgangsbedingung
  departureCondition: DepartureCondition;
  departureText: string;
  // Rekrutierung
  recruitmentSource: ('mentor_room' | 'special_object' | 'event' | 'red_room_victory')[];
  recruitmentCost?: number;    // Gold (wenn nicht durch Event)
  // Synergien
  synergies: LeaderSynergy[];
  // Regionen-Präferenz
  regionBias?: string[];
}

// ═══════════════════════════════════════════════════════════════════
// 8 REKRUTIERBARE ANFÜHRER-HELDEN
// ═══════════════════════════════════════════════════════════════════
export const LEADERS: Leader[] = [
  {
    id: 'L01',
    name: 'Brennan Stahlbruch',
    class: 'kaempfer',
    icon: '⚔️',
    description: 'Erfahrener Frontsoldat. Hält die Linie, wenn alle anderen wanken.',
    lore: 'Dreißig Jahre Grenzkrieg. Keine Medaillen. Keine Narben auf der Seele. Nur Erfahrung.',
    hp: 80,
    maxHp: 80,
    combatStrength: 25,
    ability: {
      id: 'BRENNAN_WALL',
      name: 'Eiserne Linie',
      description: 'Einmal pro Kampf: Armee verliert in dieser Runde keine Einheiten.',
      trigger: 'active',
      cooldown: 3,
      effect: { roundNoLoss: true },
    },
    passiveBonus: { armyStrengthMult: 1.08, armorBonus: 2 },
    departureCondition: 'corruption_5',
    departureText: 'Brennan schüttelt den Kopf. "Ich folge keinem, der in diese Richtung geht." Er dreht sich um und geht.',
    recruitmentSource: ['mentor_room', 'event'],
    recruitmentCost: 0,
    synergies: [
      {
        withLeaderId: 'L04',
        name: 'Frontkampf-Duo',
        description: 'Beide Kämpfer aktiv: Armee-Verlust -20% zusätzlich',
        bonusEffect: { armyLossReduction: 0.2 },
      },
    ],
    regionBias: ['grenzlande'],
  },
  {
    id: 'L02',
    name: 'Ysolde die Nebel-Weberin',
    class: 'magier',
    icon: '🔮',
    description: 'Magierin aus dem Moor. Kennt jeden Fluch — und wie man ihn wendet.',
    lore: 'Sie sagt, das Moor hat ihr das Zaubern beigebracht. Das Moor sagt nichts dazu.',
    hp: 50,
    maxHp: 50,
    combatStrength: 22,
    ability: {
      id: 'YSOLDE_DISPEL',
      name: 'Fluch-Bannung',
      description: 'Entfernt einen aktiven Fluch. Cooldown: 4 Räume.',
      trigger: 'active',
      cooldown: 4,
      effect: { removeCurse: true },
    },
    passiveBonus: { healingMult: 1.15, skillCheckBonus: 10 },
    departureCondition: 'red_room_death',
    departureText: 'Ysoldes Geist löst sich auf wie Nebel am Morgen. "Der Weg war es wert." Dann ist sie weg.',
    recruitmentSource: ['mentor_room', 'special_object'],
    recruitmentCost: 0,
    synergies: [
      {
        withLeaderId: 'L06',
        name: 'Dunkle Magie',
        description: 'Beide Magier aktiv: Alle Magie-Effekte +20%',
        bonusEffect: { magicEffectMult: 1.2 },
      },
    ],
    regionBias: ['nebelmoor'],
  },
  {
    id: 'L03',
    name: 'Kira Schattenläuferin',
    class: 'schurke',
    icon: '🗡️',
    description: 'Spionin und Infiltratorin. Macht die Feinde sichtbar — und sich selbst unsichtbar.',
    lore: 'Drei Könige haben versucht, sie zu töten. Alle drei wissen nicht mehr, dass sie existiert.',
    hp: 55,
    maxHp: 55,
    combatStrength: 18,
    ability: {
      id: 'KIRA_SCOUT',
      name: 'Vorauskundschaften',
      description: 'Enthüllt Schleier-Position für 2 Züge. Sichtbarkeit -1.',
      trigger: 'active',
      cooldown: 5,
      effect: { revealVeil: 2, visibilityMod: -1 },
    },
    passiveBonus: { escapeChanceBonus: 20, skillCheckBonus: 15 },
    departureCondition: 'veil_stage_5',
    departureText: '"Ich kämpfe gegen Schatten, nicht gegen einen Gott." Kira verschwindet — wie sie es immer tut.',
    recruitmentSource: ['special_object', 'event'],
    recruitmentCost: 30,
    synergies: [
      {
        withLeaderId: 'L01',
        name: 'Schild und Klinge',
        description: 'Kira + Brennan: Hinterhalt-Events kosten -50% HP',
        bonusEffect: { ambushDamageReduction: 0.5 },
      },
    ],
  },
  {
    id: 'L04',
    name: 'Aldric der Ungebrochene',
    class: 'kaempfer',
    icon: '🛡️',
    description: 'Stärkstes Schutzschild der Armee. Stirbt zuletzt — oder gar nicht.',
    lore: 'Man hat ihn drei Mal für tot erklärt. Zweimal hatte man Recht. Einmal nicht.',
    hp: 100,
    maxHp: 100,
    combatStrength: 30,
    ability: {
      id: 'ALDRIC_LAST_STAND',
      name: 'Letztes Bollwerk',
      description: 'Wenn Armee auf 0 sinken würde: Aldric kämpft allein weiter (1 Runde, dann Niederlage).',
      trigger: 'passive',
      effect: { lastStand: true },
    },
    passiveBonus: { armyStrengthMult: 1.12, armorBonus: 3 },
    departureCondition: 'three_losses',
    departureText: 'Aldric legt sein Schwert nieder. "Ich folge keiner Armee, die nicht gewinnen will." Er marschiert ab.',
    recruitmentSource: ['red_room_victory', 'special_object'],
    recruitmentCost: 50,
    synergies: [
      {
        withLeaderId: 'L07',
        name: 'Berg und Sturm',
        description: 'Aldric + Torvan: Armee ist unbesiegbar in der ersten Kampfrunde',
        bonusEffect: { firstRoundImmune: true },
      },
    ],
    regionBias: ['grenzlande'],
  },
  {
    id: 'L05',
    name: 'Mira die Spurenleserin',
    class: 'schurke',
    icon: '🦅',
    description: 'Jägerin und Kartografin. Niemand kennt das Terrain besser.',
    lore: 'Sie sagt, jede Karte lügt. Deshalb liest sie das Land selbst.',
    hp: 60,
    maxHp: 60,
    combatStrength: 16,
    ability: {
      id: 'MIRA_MAP',
      name: 'Geländekenntnis',
      description: 'Alle Raumfarben im aktuellen Gebiet sichtbar. Fog of War -2 Räume.',
      trigger: 'on_room_enter',
      cooldown: 0,
      effect: { revealAllColors: true, fogReduction: 2 },
    },
    passiveBonus: { skillCheckBonus: 20, escapeChanceBonus: 10 },
    departureCondition: 'army_below_5',
    departureText: '"Keine Armee, kein Auftrag." Mira verschwindet im Unterholz.',
    recruitmentSource: ['mentor_room', 'event'],
    recruitmentCost: 20,
    synergies: [
      {
        withLeaderId: 'L03',
        name: 'Doppelte Späher',
        description: 'Kira + Mira: Schleier-Position immer bekannt',
        bonusEffect: { veilAlwaysVisible: true },
      },
    ],
  },
  {
    id: 'L06',
    name: 'Soran der Fluchbrecher',
    class: 'magier',
    icon: '✨',
    description: 'Spezialist für Verderbnis und Flüche. Kämpft mit dunkler Magie — kontrolliert.',
    lore: 'Er hat jede Verderbnis selbst durchlebt. Deshalb kann er sie brechen.',
    hp: 45,
    maxHp: 45,
    combatStrength: 20,
    ability: {
      id: 'SORAN_CORRUPT',
      name: 'Verderbnis-Konversion',
      description: 'Wandelt 2 Verderbnis in +10% Armeestärke um (pro Gebiet 1x).',
      trigger: 'active',
      cooldown: 0, // Per Gebiet
      effect: { convertCorruption: 2, armyBoost: 0.1 },
    },
    passiveBonus: { armyStrengthMult: 1.06, healingMult: 1.1 },
    departureCondition: 'corruption_5',
    departureText: 'Sorans Augen leuchten dunkel. "Ich warne dich ein letztes Mal." Dann ist er Teil des Schleiers.',
    recruitmentSource: ['mentor_room', 'special_object'],
    recruitmentCost: 0,
    synergies: [
      {
        withLeaderId: 'L02',
        name: 'Dunkle Magie',
        description: 'Beide Magier aktiv: Alle Magie-Effekte +20%',
        bonusEffect: { magicEffectMult: 1.2 },
      },
    ],
    regionBias: ['nebelmoor'],
  },
  {
    id: 'L07',
    name: 'Torvan Sturmklinge',
    class: 'kommandant',
    icon: '⚡',
    description: 'Generalstaktiker. Sein Wort bewegt Armeen. Sein Schwert beendet Kriege.',
    lore: 'Er hat keinen Krieg verloren. Aber er hat auch noch nie einen Krieg gewonnen, dem er wirklich traute.',
    hp: 90,
    maxHp: 90,
    combatStrength: 35,
    ability: {
      id: 'TORVAN_TACTIC',
      name: 'Gefechtsstrategie',
      description: 'Wähle vor Kampf: Angriff (+20% Schaden), Verteidigung (-30% Verlust) oder Überrumpelung (erste Runde gratis).',
      trigger: 'on_combat_start',
      effect: { tacticsChoice: true },
    },
    passiveBonus: { armyStrengthMult: 1.15, damageBonus: 5 },
    departureCondition: 'hero_hp_below_20pct',
    departureText: '"Ein Anführer, der nicht auf sich selbst achtgeben kann, kann keine Armee führen." Torvan zieht ab.',
    recruitmentSource: ['red_room_victory', 'special_object'],
    recruitmentCost: 80,
    synergies: [
      {
        withLeaderId: 'L04',
        name: 'Berg und Sturm',
        description: 'Aldric + Torvan: Armee ist unbesiegbar in der ersten Kampfrunde',
        bonusEffect: { firstRoundImmune: true },
      },
      {
        withLeaderId: 'L01',
        name: 'Zwei Kommandanten',
        description: 'Brennan + Torvan: Armeestärke +25%',
        bonusEffect: { armyStrengthMult: 1.25 },
      },
    ],
  },
  {
    id: 'L08',
    name: 'Nessa die Ewige',
    class: 'kommandant',
    icon: '🌙',
    description: 'Niemand weiß, wie alt sie ist. Sie weiß es wahrscheinlich selbst nicht mehr.',
    lore: 'Sie hat Reiche aufsteigen und fallen sehen. Den Schleier kennt sie von damals, als er noch jung war.',
    hp: 70,
    maxHp: 70,
    combatStrength: 28,
    ability: {
      id: 'NESSA_INSIGHT',
      name: 'Altes Wissen',
      description: 'Zeigt Schleier-KI-Routing für die nächsten 2 Schritte.',
      trigger: 'active',
      cooldown: 6,
      effect: { previewVeilRoute: 2 },
    },
    passiveBonus: { skillCheckBonus: 25, goldMult: 1.1 },
    departureCondition: 'never',
    departureText: 'Nessa verlässt nie freiwillig — nur der Tod trennt sie.',
    recruitmentSource: ['special_object'],
    recruitmentCost: 100,
    synergies: [
      {
        withLeaderId: 'L05',
        name: 'Vergangenheit und Gegenwart',
        description: 'Nessa + Mira: Alle Knoten von Beginn an sichtbar (kein Fog of War)',
        bonusEffect: { noFogOfWar: true },
      },
      {
        withLeaderId: 'L06',
        name: 'Wissen und Macht',
        description: 'Nessa + Soran: Verderbnis steigt nie über 7',
        bonusEffect: { corruptionCap: 7 },
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════
// AKTIVE ANFÜHRER-STATE (im Run)
// ═══════════════════════════════════════════════════════════════════
export interface ActiveLeader {
  leaderId: string;
  currentHp: number;
  consecutiveLosses: number;
  abilityLastUsedStep: number;
  isAlive: boolean;
}

export interface LeaderState {
  activeLeaders: ActiveLeader[];
  activeSynergies: string[];
}

export function getActiveSynergies(leaders: ActiveLeader[]): string[] {
  const aliveIds = leaders.filter(l => l.isAlive).map(l => l.leaderId);
  const synergies: string[] = [];

  for (const id of aliveIds) {
    const leader = LEADERS.find(l => l.id === id);
    if (!leader) continue;
    for (const syn of leader.synergies) {
      if (aliveIds.includes(syn.withLeaderId)) {
        const synKey = [id, syn.withLeaderId].sort().join('_');
        if (!synergies.includes(synKey)) synergies.push(synKey);
      }
    }
  }
  return synergies;
}

export function checkDepartureConditions(
  state: LeaderState,
  heroState: {
    corruption: number;
    hp: number;
    maxHp: number;
    gold: number;
  },
  armySize: number,
  veilStage: number,
  consecutiveLosses: number
): { leaderId: string; reason: string }[] {
  const departures: { leaderId: string; reason: string }[] = [];

  for (const active of state.activeLeaders) {
    if (!active.isAlive) continue;
    const leader = LEADERS.find(l => l.id === active.leaderId);
    if (!leader) continue;

    switch (leader.departureCondition) {
      case 'corruption_5':
        if (heroState.corruption >= 5) {
          departures.push({ leaderId: leader.id, reason: leader.departureText });
        }
        break;
      case 'army_below_5':
        if (armySize < 5) {
          departures.push({ leaderId: leader.id, reason: leader.departureText });
        }
        break;
      case 'three_losses':
        if (active.consecutiveLosses >= 3) {
          departures.push({ leaderId: leader.id, reason: leader.departureText });
        }
        break;
      case 'veil_stage_5':
        if (veilStage >= 5) {
          departures.push({ leaderId: leader.id, reason: leader.departureText });
        }
        break;
      case 'hero_hp_below_20pct':
        if (heroState.hp / heroState.maxHp < 0.2) {
          departures.push({ leaderId: leader.id, reason: leader.departureText });
        }
        break;
      case 'gold_below_0':
        if (heroState.gold < 0) {
          departures.push({ leaderId: leader.id, reason: leader.departureText });
        }
        break;
      case 'never':
        break;
    }
  }
  return departures;
}

export function recruitLeader(
  state: LeaderState,
  leaderId: string
): LeaderState {
  if (state.activeLeaders.length >= 3) {
    throw new Error('Maximal 3 Anführer gleichzeitig aktiv.');
  }
  if (state.activeLeaders.find(al => al.leaderId === leaderId)) {
    throw new Error('Anführer bereits aktiv.');
  }

  const leader = LEADERS.find(l => l.id === leaderId);
  if (!leader) throw new Error(`Unbekannter Anführer: ${leaderId}`);

  const newActive: ActiveLeader = {
    leaderId,
    currentHp: leader.hp,
    consecutiveLosses: 0,
    abilityLastUsedStep: -999,
    isAlive: true,
  };

  const newLeaders = [...state.activeLeaders, newActive];
  return { activeLeaders: newLeaders, activeSynergies: getActiveSynergies(newLeaders) };
}

export function computeLeaderPassiveBonuses(state: LeaderState): Record<string, number> {
  const combined: Record<string, number> = {};

  for (const active of state.activeLeaders) {
    if (!active.isAlive) continue;
    const leader = LEADERS.find(l => l.id === active.leaderId);
    if (!leader) continue;

    for (const [key, val] of Object.entries(leader.passiveBonus)) {
      if (typeof val !== 'number') continue;
      const isMultiplier = key.endsWith('Mult');
      if (isMultiplier) {
        combined[key] = (combined[key] ?? 1.0) * val;
      } else {
        combined[key] = (combined[key] ?? 0) + val;
      }
    }
  }

  // Synergien
  const aliveIds = state.activeLeaders.filter(l => l.isAlive).map(l => l.leaderId);
  for (const id of aliveIds) {
    const leader = LEADERS.find(l => l.id === id);
    if (!leader) continue;
    for (const syn of leader.synergies) {
      if (!aliveIds.includes(syn.withLeaderId)) continue;
      for (const [key, val] of Object.entries(syn.bonusEffect)) {
        if (typeof val !== 'number') continue;
        const isMultiplier = key.endsWith('Mult');
        if (isMultiplier) {
          combined[key] = (combined[key] ?? 1.0) * val;
        } else {
          combined[key] = (combined[key] ?? 0) + val;
        }
      }
    }
  }

  return combined;
}
