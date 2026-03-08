export interface EventChoice {
  label: string;
  effects: EventEffects;
  text: string;
}

export interface EventEffects {
  hp?: number;
  mana?: number;
  gold?: number;
  threat?: number;
  visibility?: number;
  corruption?: number;
  army_miliz?: number;
  army_veteran?: number;
  army_elite?: number;
  army_leader?: number;
  army_mage?: number;
}

export interface GameEvent {
  id: string;
  name: string;
  icon: string;
  tags: string[];
  text: string;
  choices: EventChoice[];
}

export const EVENTS: GameEvent[] = [
  {
    id: 'E01', name: 'Staubige Spuren', icon: '👣',
    tags: ['hint'],
    text: 'Frische Spuren führen in die Tiefe des Gebiets. Jemand war hier — oder etwas.',
    choices: [
      { label: 'Folgen', effects: { visibility: 1, gold: 5 }, text: 'Du folgst den Spuren und findest einen versteckten Weg.' },
      { label: 'Ignorieren', effects: {}, text: 'Du lässt die Spuren hinter dir.' },
    ],
  },
  {
    id: 'E02', name: 'Räubergruppe', icon: '⚔️',
    tags: ['fight', 'bandits'],
    text: 'Eine Gruppe zerlumpter Räuber versperrt den Weg.',
    choices: [
      { label: 'Kämpfen', effects: { threat: 1, visibility: 1, gold: 15, army_miliz: 1 }, text: 'Die Räuber werden besiegt.' },
      { label: 'Einschüchtern', effects: { threat: 1, gold: 8 }, text: 'Deine Präsenz lässt sie zurückweichen.' },
    ],
  },
  {
    id: 'E03', name: 'Verlassene Truhe', icon: '📦',
    tags: ['loot'],
    text: 'Eine schwere Truhe liegt aufgebrochen im Staub.',
    choices: [
      { label: 'Öffnen', effects: { gold: 25, hp: -10 }, text: 'Eine Falle! Du nimmst Schaden, aber findest Gold.' },
      { label: 'Vorsichtig prüfen', effects: { gold: 20 }, text: 'Du erkennst die Falle und umgehst sie.' },
    ],
  },
  {
    id: 'E04', name: 'Falscher Wegweiser', icon: '🪧',
    tags: ['hint', 'deception'],
    text: 'Ein verwitterter Wegweiser zeigt in eine seltsame Richtung.',
    choices: [
      { label: 'Folgen', effects: { visibility: -1, threat: 1 }, text: 'Der Wegweiser war manipuliert.' },
      { label: 'Misstrauen', effects: {}, text: 'Dein Instinkt hat dich bewahrt.' },
    ],
  },
  {
    id: 'E05', name: 'Verlassene Waffenkammer', icon: '🗡️',
    tags: ['loot', 'risk'],
    text: 'Eine alte Militärkammer, halb versteckt hinter zerbrochenem Holz.',
    choices: [
      { label: 'Schnell plündern', effects: { gold: 35, visibility: 1 }, text: 'Du plünderst schnell — laut, aber effektiv.' },
      { label: 'Vorsichtig durchsuchen', effects: { gold: 25 }, text: 'Langsam, aber sicher.' },
    ],
  },
  {
    id: 'E06', name: 'Geist des alten Milizisten', icon: '👻',
    tags: ['mentor', 'corruption'],
    text: 'Ein blasser Geist in Militäruniform erscheint.',
    choices: [
      { label: 'Segen annehmen', effects: { army_veteran: 1 }, text: 'Der Geist lehrt dich Kampftaktik.' },
      { label: 'Pakt eingehen', effects: { army_leader: 1, corruption: 1 }, text: 'Ein mächtiger Anführer erwacht — die Verderbnis wächst.' },
    ],
  },
  {
    id: 'E07', name: 'Kartenfragment', icon: '🗺️',
    tags: ['hint', 'map'],
    text: 'Ein zerknittertes Stück Pergament mit Streckenmarkierungen.',
    choices: [
      { label: 'Studieren', effects: { gold: 5 }, text: 'Du enthüllst zwei weitere Raum-Verbindungen.' },
    ],
  },
  {
    id: 'E08', name: 'Hinterhalt in der Enge', icon: '🏹',
    tags: ['fight'],
    text: 'Pfeile fliegen! Du gerätst in einen gut geplanten Hinterhalt.',
    choices: [
      { label: 'Kämpfen', effects: { threat: 1, hp: -15, army_miliz: 2 }, text: 'Du kämpfst dich durch.' },
      { label: 'Fliehen', effects: { visibility: 1 }, text: 'Du entkommst. Kein Loot, aber du lebst.' },
    ],
  },
  {
    id: 'E09', name: 'Händler im Schatten', icon: '🛒',
    tags: ['merchant'],
    text: 'Ein misstrauisch dreinschauender Händler bietet seine Waren an.',
    choices: [
      { label: 'Waffen kaufen (20G)', effects: { gold: -20, army_veteran: 1 }, text: 'Du erhältst gut ausgerüstete Veteranen.' },
      { label: 'Tränke kaufen (10G)', effects: { gold: -10, hp: 30 }, text: 'Heilkräuter und Tränke.' },
      { label: 'Ignorieren', effects: {}, text: 'Du ziehst weiter.' },
    ],
  },
  {
    id: 'E10', name: 'Gefangener', icon: '⛓️',
    tags: ['hint'],
    text: 'Ein Gefangener liegt in einer Grube. Er kennt dieses Gebiet gut.',
    choices: [
      { label: 'Befreien', effects: { threat: -1, army_miliz: 1 }, text: 'Er schließt sich dankbar an.' },
      { label: 'Ausfragen', effects: {}, text: 'Er verrät dir Raum-Informationen.' },
      { label: 'Lassen', effects: {}, text: 'Du lässt ihn zurück.' },
    ],
  },
  {
    id: 'E11', name: 'Schwertmeister-Anführer', icon: '👑',
    tags: ['fight', 'elite'],
    text: 'Ein gerüsteter Anführer mit drei bewaffneten Leibwächtern.',
    choices: [
      { label: 'Elite-Kampf', effects: { threat: 1, hp: -20, army_elite: 1, gold: 40 }, text: 'Nach hartem Kampf fällt der Anführer.' },
    ],
  },
  {
    id: 'E12', name: 'Alarmglocke', icon: '🔔',
    tags: ['trap', 'visibility'],
    text: 'Eine versteckte Alarmglocke hängt quer über den Pfad.',
    choices: [
      { label: 'Entschärfen', effects: { visibility: -1 }, text: 'Geschickt entfernt.' },
      { label: 'Riskieren', effects: { visibility: 2 }, text: 'Die Glocke läutet! Deine Position ist kompromittiert.' },
    ],
  },
  {
    id: 'E13', name: 'Irrlicht-Schwarm', icon: '✨',
    tags: ['fight', 'magic'],
    text: 'Glühende Irrlichter umringen dich.',
    choices: [
      { label: 'Kämpfen', effects: { hp: -10, visibility: 1, army_mage: 1 }, text: 'Du überwindest den Schwarm.' },
      { label: 'Bannen', effects: { hp: -5 }, text: 'Du brichst ihren Bann schnell.' },
    ],
  },
  {
    id: 'E14', name: 'Moorfieber', icon: '🤒',
    tags: ['hazard'],
    text: 'Der Sumpfgeruch dringt tief ein. Dein Körper reagiert mit Fieber.',
    choices: [
      { label: 'Heiltrank nutzen', effects: { hp: -5, gold: -5 }, text: 'Du kämpfst das Fieber nieder.' },
      { label: 'Durchhalten', effects: { hp: -20 }, text: 'Das Fieber wütet.' },
    ],
  },
  {
    id: 'E15', name: 'Versunkene Statue', icon: '🗿',
    tags: ['loot', 'corruption'],
    text: 'Eine uralte Statue aus schwarzem Stein.',
    choices: [
      { label: 'Opfer bringen', effects: { army_leader: 1, corruption: 1 }, text: 'Ein Anführer-Geist folgt dir.' },
      { label: 'Bergen', effects: { gold: 30 }, text: 'Der Stein ist wertvoll.' },
    ],
  },
  {
    id: 'E16', name: 'Nebelpfad', icon: '🌫️',
    tags: ['mobility', 'hint'],
    text: 'Ein dichter Nebelstreifen bietet Deckung.',
    choices: [
      { label: 'Nutzen', effects: { visibility: -1, gold: 10 }, text: 'Du nutzt den Nebel als Deckung.' },
      { label: 'Ignorieren', effects: {}, text: 'Du gehst den sicheren Weg.' },
    ],
  },
  {
    id: 'E17', name: 'Sumpfbanditen', icon: '🐊',
    tags: ['fight', 'bandits'],
    text: 'Banditen, die das Moor als Versteck nutzen, greifen an.',
    choices: [
      { label: 'Kämpfen', effects: { threat: 1, army_miliz: 2, gold: 20 }, text: 'Du schlägst den Hinterhalt zurück.' },
    ],
  },
  {
    id: 'E18', name: 'Hexenaltar', icon: '🕯️',
    tags: ['mentor', 'corruption'],
    text: 'Ein uralter Altar mit frischen Blutspuren.',
    choices: [
      { label: 'Lehre empfangen', effects: { army_mage: 1 }, text: 'Eine Fluchweberin tritt deiner Armee bei.' },
      { label: 'Pakt eingehen', effects: { army_leader: 1, corruption: 2, hp: 20 }, text: 'Enorme Macht — auf Kosten deiner Seele.' },
    ],
  },
  {
    id: 'E19', name: 'Echogeräusche', icon: '👂',
    tags: ['hint', 'deception'],
    text: 'Seltsame Echos hallen durch die Räume.',
    choices: [
      { label: 'Horchen', effects: {}, text: 'Du lokalisierst die Schleier-Armee grob.' },
      { label: 'Sprinten', effects: { visibility: 1 }, text: 'Du eilst weiter. Laut, aber schnell.' },
    ],
  },
  {
    id: 'E20', name: 'Sumpfbrücke', icon: '🌉',
    tags: ['trap'],
    text: 'Die einzige Brücke knarzt bedrohlich.',
    choices: [
      { label: 'Reparieren', effects: { threat: 1, gold: -5 }, text: 'Du reparierst sie notdürftig.' },
      { label: 'Springen', effects: { hp: -15 }, text: 'Halb hält sie — du landest hart.' },
    ],
  },
  {
    id: 'E21', name: 'Alte Runen', icon: '🔣',
    tags: ['info'],
    text: 'Uralte Runen an der Wand.',
    choices: [
      { label: 'Studieren', effects: {}, text: 'Du enthüllst verborgene Raumtags.' },
      { label: 'Ignorieren', effects: {}, text: 'Du lässt die alten Zeichen hinter dir.' },
    ],
  },
  {
    id: 'E22', name: 'Verfluchter Schmuck', icon: '💍',
    tags: ['loot', 'corruption'],
    text: 'Ein Amulett mit dunklem Glanz.',
    choices: [
      { label: 'Anlegen', effects: { army_elite: 1, corruption: 1 }, text: 'Kraft strömt durch dich.' },
      { label: 'Verkaufen', effects: { gold: 25 }, text: 'Du nimmst das Gold.' },
      { label: 'Entsorgen', effects: { visibility: -1 }, text: 'Die Last des Fluchs schwindet.' },
    ],
  },
  {
    id: 'E23', name: 'Nebelmeister', icon: '🧙',
    tags: ['mentor'],
    text: 'Ein alter Mann sitzt still im Nebel.',
    choices: [
      { label: 'Ausbildung', effects: { army_veteran: 2, army_leader: 1 }, text: 'Der Meister teilt sein Wissen.' },
    ],
  },
  {
    id: 'E24', name: 'Wassergeist', icon: '💧',
    tags: ['mentor', 'risk'],
    text: 'Ein Geist aus fließendem Wasser bietet Heilung oder Prüfung.',
    choices: [
      { label: 'Segen', effects: { hp: 25, army_miliz: 1 }, text: 'Klares Wasser heilt deine Wunden.' },
      { label: 'Prüfung bestehen', effects: { hp: -10, army_elite: 1, gold: 30 }, text: 'Du überlebst die Prüfung.' },
    ],
  },
  {
    id: 'E25', name: 'Leerer Raum', icon: '🚪',
    tags: ['neutral'],
    text: 'Der Raum ist leer. Staub und Stille.',
    choices: [
      { label: 'Weiter', effects: { gold: 5 }, text: 'Du findest eine versteckte Münze.' },
    ],
  },
  {
    id: 'E26', name: 'Abkürzungstür', icon: '🚪',
    tags: ['route', 'risk'],
    text: 'Eine schwere Stahltür. Dahinter liegt ein kürzerer Weg.',
    choices: [
      { label: 'Aufbrechen', effects: { visibility: 1, gold: 10 }, text: 'Mit einem Krachen springt die Tür auf.' },
      { label: 'Umgehen', effects: {}, text: 'Du nimmst den sicheren Weg.' },
    ],
  },
  {
    id: 'E27', name: 'Vorratskiste', icon: '🧺',
    tags: ['loot'],
    text: 'Eine intakte Vorratskiste mit Verbrauchsgütern.',
    choices: [
      { label: 'Öffnen', effects: { hp: 20, gold: 10 }, text: 'Heiltränke und Proviant.' },
    ],
  },
  {
    id: 'E28', name: 'Spähposten', icon: '🔭',
    tags: ['hint'],
    text: 'Ein verlassener Spähposten mit einem Fernrohr.',
    choices: [
      { label: 'Ausspähen', effects: {}, text: 'Du siehst die Bewegungen des Schleiers.' },
    ],
  },
  {
    id: 'E29', name: 'Schleierflüstern', icon: '👁️',
    tags: ['corruption', 'event'],
    text: 'Eine dunkle Stimme spricht direkt in deinen Kopf.',
    choices: [
      { label: 'Widerstehen', effects: {}, text: 'Du verschließt deinen Geist.' },
      { label: 'Lauschen', effects: { corruption: 1, army_veteran: 1 }, text: 'Die Stimme enthüllt Geheimnisse.' },
    ],
  },
  {
    id: 'E30', name: 'Jäger treffen ein', icon: '🐺',
    tags: ['hunter', 'combat'],
    text: 'Geübte Jäger des Schleiers haben deine Spur aufgenommen.',
    choices: [
      { label: 'Kampf annehmen', effects: { hp: -20, threat: 1, army_miliz: 1, gold: 20 }, text: 'Du stellst dich den Jägern.' },
      { label: 'Rückzug', effects: { visibility: -2 }, text: 'Du verlässt das Gebiet schnell.' },
    ],
  },
];

// ── Event für Raum auswählen ──
export function getEventForRoom(
  nodeType: string,
  nodeRisk: string,
  region: string,
  seed: number,
  step: number
): GameEvent {
  const rng = () => {
    let s = (seed + step) | 0;
    s = (s + 0x6d2b79f5) | 0;
    return ((s ^ (s >>> 15)) >>> 0) / 4294967296;
  };

  let pool = [...EVENTS];

  // Nach Raumtyp filtern
  if (nodeType === 'mentor') {
    pool = pool.filter(e => e.tags.includes('mentor'));
  } else if (nodeType === 'command') {
    pool = pool.filter(e => e.tags.includes('fight') || e.tags.includes('elite'));
  } else if (nodeType === 'neutral') {
    pool = pool.filter(e => !e.tags.includes('fight') || rng() < 0.3);
  }

  // Nebelmoor: Corruption-Events bevorzugen
  if (region === 'nebelmoor') {
    const corruptionEvents = pool.filter(e => e.tags.includes('corruption'));
    if (corruptionEvents.length > 0 && rng() < 0.4) {
      pool = corruptionEvents;
    }
  }

  if (!pool.length) pool = EVENTS.filter(e => e.tags.includes('neutral'));
  if (!pool.length) return EVENTS[24]; // E25 Leerer Raum als Fallback

  return pool[Math.floor(rng() * pool.length)];
}

// ── Effekte anwenden ──
export function applyEffects(
  hero: {
    hp: number; maxHp: number; mana: number; maxMana: number;
    gold: number; threat: number; visibility: number; corruption: number;
  },
  army: Record<string, number>,
  effects: EventEffects
): void {
  if (effects.hp) hero.hp = Math.min(hero.maxHp, Math.max(0, hero.hp + effects.hp));
  if (effects.mana) hero.mana = Math.min(hero.maxMana, Math.max(0, hero.mana + effects.mana));
  if (effects.gold) hero.gold = Math.max(0, hero.gold + effects.gold);
  if (effects.threat !== undefined) hero.threat = Math.max(0, Math.min(10, hero.threat + effects.threat));
  if (effects.visibility !== undefined) hero.visibility = Math.max(0, Math.min(10, hero.visibility + effects.visibility));
  if (effects.corruption !== undefined) hero.corruption = Math.max(0, Math.min(10, hero.corruption + effects.corruption));
  if (effects.army_miliz) army.miliz = (army.miliz || 0) + effects.army_miliz;
  if (effects.army_veteran) army.veteran = (army.veteran || 0) + effects.army_veteran;
  if (effects.army_elite) army.elite = (army.elite || 0) + effects.army_elite;
  if (effects.army_leader) army.leader = (army.leader || 0) + effects.army_leader;
  if (effects.army_mage) army.mage = (army.mage || 0) + effects.army_mage;
}