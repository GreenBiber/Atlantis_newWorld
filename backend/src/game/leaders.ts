// ═══════════════════════════════════════════════════════════════════
// SCHLEIER & DUNKEL — Anführer-Helden (SRS v3.1)
// 8 rekrutierbare Helden mit Abgangsbedingungen und Synergien
// ═══════════════════════════════════════════════════════════════════

export type LeaderClass = 'kaempfer' | 'magier' | 'kundschafter' | 'heiler';

export interface LeaderAbility {
  name: string;
  description: string;
  trigger: 'combat_start' | 'on_kill' | 'passive' | 'on_escape' | 'on_room_enter';
  effect: Record<string, number | string>;
}

export interface Leader {
  id: string;
  name: string;
  class: LeaderClass;
  hp: number;
  maxHp: number;
  armor: number;
  strength: number;             // Kampfstärke-Beitrag
  ability: LeaderAbility;
  recruitmentCost: number;      // Gold
  departureCondition: string;   // Beschreibung
  departureCheck: (state: LeaderDepartureState) => boolean;
  synergies: string[];          // IDs anderer Leader für Synergie-Bonus
  lore: string;
  regionBias?: string[];
}

export interface LeaderDepartureState {
  heroCorruption: number;
  heroThreat: number;
  heroVisibility: number;
  armyMilizCount: number;
  runRoomsCleared: number;
  heroGold: number;
  escapeCount: number;
  veilStage: number;
}

// ═══════════════════════════════════════════════════════════════════
// 8 ANFÜHRER-HELDEN
// ═══════════════════════════════════════════════════════════════════
export const LEADERS: Leader[] = [
  {
    id: 'L01',
    name: 'Aldric Grenzwächter',
    class: 'kaempfer',
    hp: 80, maxHp: 80, armor: 12, strength: 18,
    recruitmentCost: 30,
    lore: 'Zwanzig Jahre an der Grenze. Er hat jeden Trick der Räuber gesehen — und überlebt.',
    regionBias: ['grenzlande'],
    ability: {
      name: 'Schildwall',
      description: 'Zu Beginn jedes Kampfes: Armeeschaden -15% für 2 Runden',
      trigger: 'combat_start',
      effect: { damageReduction: 15, duration: 2 },
    },
    departureCondition: 'Verlässt wenn Verderbnis ≥ 7 (zu dunkel geworden)',
    departureCheck: (s) => s.heroCorruption >= 7,
    synergies: ['L03', 'L05'],
  },
  {
    id: 'L02',
    name: 'Syra die Spurensucherin',
    class: 'kundschafter',
    hp: 55, maxHp: 55, armor: 6, strength: 10,
    recruitmentCost: 20,
    lore: 'Sie sieht Wege wo andere nur Moor sehen. Und Gefahren wo andere Wege sehen.',
    regionBias: ['nebelmoor'],
    ability: {
      name: 'Nebelaugen',
      description: 'Alle benachbarten Knoten sichtbar (Fog ignoriert)',
      trigger: 'passive',
      effect: { fogRevealBonus: 2 },
    },
    departureCondition: 'Verlässt nach 3 Fluchten (hält Feiglinge nicht aus)',
    departureCheck: (s) => s.escapeCount >= 3,
    synergies: ['L07'],
  },
  {
    id: 'L03',
    name: 'Bren Stahlbrecher',
    class: 'kaempfer',
    hp: 100, maxHp: 100, armor: 15, strength: 22,
    recruitmentCost: 50,
    lore: 'Er hat die Schleier-Klaue mit bloßen Händen zerrissen. Die Narben beweisen es.',
    ability: {
      name: 'Berserker-Angriff',
      description: 'Bei Kampfbeginn: +30% Schaden für 1 Runde, -5 eigene Rüstung',
      trigger: 'combat_start',
      effect: { damageBonus: 30, armorPenalty: 5, duration: 1 },
    },
    departureCondition: 'Verlässt wenn Armee unter 5 Einheiten fällt (kein Respekt mehr)',
    departureCheck: (s) => s.armyMilizCount < 5,
    synergies: ['L01', 'L06'],
  },
  {
    id: 'L04',
    name: 'Lena Fluchbrecherin',
    class: 'heiler',
    hp: 60, maxHp: 60, armor: 5, strength: 8,
    recruitmentCost: 40,
    lore: 'Sie heilt nicht mit Kräutern. Sie heilt mit Willen. Das kostet sie mehr.',
    ability: {
      name: 'Heilsegen',
      description: 'Nach jedem Raum: +8 HP für Held (passiv)',
      trigger: 'on_room_enter',
      effect: { healAmount: 8 },
    },
    departureCondition: 'Verlässt wenn Verderbnis ≥ 5 (kann den Dunkel nicht mehr bekämpfen)',
    departureCheck: (s) => s.heroCorruption >= 5,
    synergies: ['L02', 'L07'],
  },
  {
    id: 'L05',
    name: 'Kommandant Varro',
    class: 'kaempfer',
    hp: 90, maxHp: 90, armor: 14, strength: 20,
    recruitmentCost: 60,
    lore: 'Er kommandierte tausend Mann. Jetzt kommandiert er dich — ob du willst oder nicht.',
    ability: {
      name: 'Schlachtordnung',
      description: 'Armeestärke +15% dauerhaft solange er lebt',
      trigger: 'passive',
      effect: { armyStrengthMult: 1.15 },
    },
    departureCondition: 'Verlässt wenn Bedrohung ≥ 8 (zu exponiert für gute Strategie)',
    departureCheck: (s) => s.heroThreat >= 8,
    synergies: ['L01', 'L03'],
  },
  {
    id: 'L06',
    name: 'Die Namenlose Klinge',
    class: 'kaempfer',
    hp: 70, maxHp: 70, armor: 8, strength: 25,
    recruitmentCost: 45,
    lore: 'Niemand weiß ihren Namen. Sie kämpft für Gold und nichts anderes. Zuverlässig auf ihre eigene Weise.',
    ability: {
      name: 'Präzisionsschlag',
      description: 'Bei Kill: Krit-Schaden +25% für nächsten Angriff',
      trigger: 'on_kill',
      effect: { critBonus: 25 },
    },
    departureCondition: 'Verlässt wenn Gold unter 10 fällt (nicht mehr rentabel)',
    departureCheck: (s) => s.heroGold < 10,
    synergies: ['L03'],
  },
  {
    id: 'L07',
    name: 'Alvar der Nebelseher',
    class: 'magier',
    hp: 50, maxHp: 50, armor: 4, strength: 12,
    recruitmentCost: 35,
    lore: 'Er sieht den Schleier nicht als Feind — als Werkzeug. Das macht ihn gefährlich.',
    regionBias: ['nebelmoor'],
    ability: {
      name: 'Schleier-Orakel',
      description: 'Zeigt Schleier-Route für nächsten Schritt (1x pro Gebiet)',
      trigger: 'passive',
      effect: { veilRouteReveal: 1 },
    },
    departureCondition: 'Verlässt wenn Schleier-Stufe V erreicht (zu mächtig geworden)',
    departureCheck: (s) => s.veilStage >= 5,
    synergies: ['L02', 'L04'],
  },
  {
    id: 'L08',
    name: 'Wächter des letzten Forts',
    class: 'kaempfer',
    hp: 120, maxHp: 120, armor: 18, strength: 15,
    recruitmentCost: 80,
    lore: 'Das Fort fiel. Er nicht. Er wartet noch immer auf Befehle die nie kamen.',
    ability: {
      name: 'Letzter Stand',
      description: 'Einmal pro Run: verhindert Tod des Helden (auf 1 HP)',
      trigger: 'passive',
      effect: { deathPrevention: 1 },
    },
    departureCondition: 'Verlässt nie (einmal rekrutiert, immer treu)',
    departureCheck: () => false,
    synergies: ['L01', 'L05', 'L03'],
  },
];

// ═══════════════════════════════════════════════════════════════════
// HILFSFUNKTIONEN
// ═══════════════════════════════════════════════════════════════════
export function recruitLeader(leaderId: string): Leader | null {
  return LEADERS.find(l => l.id === leaderId) || null;
}

export function checkDepartureConditions(
  activeLeaderIds: string[],
  state: LeaderDepartureState
): string[] {
  // Gibt IDs der Anführer zurück die gehen müssen
  return activeLeaderIds.filter(id => {
    const leader = LEADERS.find(l => l.id === id);
    return leader ? leader.departureCheck(state) : false;
  });
}

export function computeLeaderPassiveBonuses(activeLeaderIds: string[]): {
  armyStrengthMult: number;
  hpRegenPerRoom: number;
  fogRevealBonus: number;
  veilRouteReveal: number;
  deathPrevention: number;
} {
  const bonuses = {
    armyStrengthMult: 1.0,
    hpRegenPerRoom: 0,
    fogRevealBonus: 0,
    veilRouteReveal: 0,
    deathPrevention: 0,
  };

  for (const id of activeLeaderIds) {
    const leader = LEADERS.find(l => l.id === id);
    if (!leader || leader.ability.trigger !== 'passive') continue;
    const e = leader.ability.effect;
    if (e.armyStrengthMult) bonuses.armyStrengthMult *= e.armyStrengthMult as number;
    if (e.healAmount) bonuses.hpRegenPerRoom += e.healAmount as number;
    if (e.fogRevealBonus) bonuses.fogRevealBonus += e.fogRevealBonus as number;
    if (e.veilRouteReveal) bonuses.veilRouteReveal += e.veilRouteReveal as number;
    if (e.deathPrevention) bonuses.deathPrevention += e.deathPrevention as number;
  }

  // Synergie-Bonus: +5% Armeestärke wenn 2+ Synergien aktiv
  for (const id of activeLeaderIds) {
    const leader = LEADERS.find(l => l.id === id);
    if (!leader) continue;
    const synergyCount = leader.synergies.filter(s => activeLeaderIds.includes(s)).length;
    if (synergyCount >= 1) bonuses.armyStrengthMult *= 1.05;
  }

  return bonuses;
}