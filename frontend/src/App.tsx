import { useState, useEffect, useRef, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface User { id: number; email: string; token: string; }
interface RunSummary { id: number; region: string; hero_class: string; status: string; }
interface HeroState {
  hp: number; max_hp: number; armor: number;
  mana: number; max_mana: number;
  threat: number; visibility: number; corruption: number;
  gold: number; escape_count: number;
  learned_skills: string; army_strength: number; hero_class: string;
}
interface VeilState {
  stage: number; hunters_active: boolean; current_node: string;
  boss_name: string; boss_active: boolean; boss_hp: number;
}
interface ArmyUnit { side: string; unit_type: string; count: number; }
interface MapNode {
  node_key: string; node_type: string; risk_color: string;
  x: number; y: number; side: string;
  is_revealed: boolean; is_visited: boolean; is_blocked: boolean;
}
interface MapEdge { from_node: string; to_node: string; is_blocked: boolean; }
interface StepResult {
  step: number; node: string; type: 'event' | 'encounter' | 'exit';
  eventId?: string; eventName?: string; eventIcon?: string;
  eventText?: string; choices?: { label: string; text: string }[];
  heroStr?: number; veilStr?: number; veilBoss?: string;
}
interface CombatState {
  round: number; heroStr: number; veilStr: number;
  heroBaseStr: number; veilBaseStr: number;
  log: { type: string; text: string }[];
  finished: boolean; winner?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────
const API = '/api';

async function apiFetch(path: string, token: string, method = 'GET', body?: any) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles (injected)
// ─────────────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');

  :root {
    --bg:     #0a0805; --bg2: #110e09; --bg3: #1a1510; --panel: #13100c;
    --border: #3d2e1a; --border2: #5a4020;
    --gold:   #c9922a; --gold2: #e8b84b; --gold3: #f5d78e;
    --red:    #8b1a1a; --red2: #c0392b;
    --green2: #27ae60; --blue2: #2471a3;
    --text:   #d4c5a9; --text2: #a89070; --text3: #6b5540;
    --white:  #f0e8d8; --veil: #4a1060; --veil2: #8b2fc9;
  }
  *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
  body { background:var(--bg); color:var(--text); font-family:'Crimson Text',serif; font-size:16px; }
  h1,h2,h3,.cinzel { font-family:'Cinzel',serif; }
  button { cursor:pointer; font-family:'Cinzel',serif; }
  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-track { background:var(--bg); }
  ::-webkit-scrollbar-thumb { background:var(--border2); }

  .screen { width:100vw; height:100vh; display:flex; }

  /* ── INTRO ── */
  .intro { flex-direction:column; align-items:center; justify-content:center;
    background:radial-gradient(ellipse at center, #1a0f05 0%, #0a0805 70%); position:relative; overflow:hidden; }
  .intro-title { font-family:'Cinzel',serif; font-size:clamp(2.5rem,6vw,5rem); font-weight:900;
    color:var(--gold2); letter-spacing:.1em; text-align:center;
    text-shadow:0 0 40px rgba(201,146,42,.4),0 2px 4px rgba(0,0,0,.8);
    animation:glow 3s ease-in-out infinite alternate; }
  .intro-sub { font-style:italic; color:var(--text2); margin:.5rem 0 2rem; font-size:1.1rem; }
  .divider { width:300px; height:1px; background:linear-gradient(to right,transparent,var(--gold),transparent);
    margin:1.5rem auto; position:relative; }
  .divider::before { content:'⬟'; position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);
    color:var(--gold); font-size:12px; background:var(--bg); padding:0 8px; }
  @keyframes glow {
    from { text-shadow:0 0 20px rgba(201,146,42,.3),0 2px 4px rgba(0,0,0,.8); }
    to   { text-shadow:0 0 60px rgba(201,146,42,.6),0 0 100px rgba(201,146,42,.2),0 2px 4px rgba(0,0,0,.8); }
  }
  .rune { position:absolute; font-family:'Cinzel',serif; color:rgba(201,146,42,.05);
    font-size:80px; animation:floatRune 20s infinite linear; user-select:none; pointer-events:none; }
  @keyframes floatRune {
    0%   { transform:translateY(110vh) rotate(0deg); opacity:0; }
    10%  { opacity:1; }
    90%  { opacity:1; }
    100% { transform:translateY(-10vh) rotate(360deg); opacity:0; }
  }

  /* ── AUTH ── */
  .auth-box { background:var(--panel); border:1px solid var(--border2); padding:2.5rem;
    width:360px; display:flex; flex-direction:column; gap:1rem; }
  .auth-box h2 { font-size:1.1rem; color:var(--gold2); text-align:center; letter-spacing:.1em; }
  .field { display:flex; flex-direction:column; gap:.3rem; }
  .field label { font-size:.72rem; color:var(--text3); letter-spacing:.1em; text-transform:uppercase; font-family:'Cinzel',serif; }
  .field input { background:var(--bg3); border:1px solid var(--border); color:var(--white);
    padding:.6rem .8rem; font-family:'Crimson Text',serif; font-size:1rem; outline:none; }
  .field input:focus { border-color:var(--gold); }
  .err { color:var(--red2); font-size:.82rem; text-align:center; }
  .link-btn { background:none; border:none; color:var(--text3); font-size:.8rem;
    font-family:'Crimson Text',serif; text-decoration:underline; }

  /* ── BUTTONS ── */
  .btn { font-family:'Cinzel',serif; font-size:.8rem; letter-spacing:.08em;
    padding:.6rem 1.4rem; border:1px solid var(--border2); background:var(--bg3);
    color:var(--text); transition:all .25s; position:relative; overflow:hidden; }
  .btn:hover { border-color:var(--gold); color:var(--gold2); box-shadow:0 0 12px rgba(201,146,42,.2); }
  .btn.primary { background:rgba(201,146,42,.15); border-color:var(--gold); color:var(--gold2); }
  .btn.primary:hover { background:rgba(201,146,42,.25); box-shadow:0 0 20px rgba(201,146,42,.3); }
  .btn.danger { border-color:var(--red); color:var(--red2); }
  .btn.danger:hover { border-color:var(--red2); background:rgba(139,26,26,.2); }
  .btn.large { padding:.9rem 2.5rem; font-size:1rem; }
  .btn:disabled { opacity:.4; cursor:not-allowed; }

  /* ── SELECT SCREEN ── */
  .select-screen { flex-direction:column; align-items:center; overflow-y:auto;
    background:radial-gradient(ellipse at center,#1a0f05 0%,#0a0805 70%); padding:2rem; gap:1.2rem; }
  .select-grid { display:grid; grid-template-columns:1fr 1fr; gap:.8rem; width:100%; max-width:680px; }
  .select-card { background:var(--panel); border:1px solid var(--border);
    padding:1.4rem; cursor:pointer; transition:all .3s; position:relative; }
  .select-card:hover, .select-card.sel { border-color:var(--gold); box-shadow:0 0 20px rgba(201,146,42,.2); }
  .select-card.sel { border-color:var(--gold2); background:rgba(201,146,42,.05); }
  .card-icon { font-size:2.2rem; margin-bottom:.4rem; }
  .card-title { font-family:'Cinzel',serif; font-size:1rem; color:var(--gold2); margin-bottom:.2rem; }
  .card-desc { font-size:.88rem; color:var(--text2); line-height:1.4; }
  .card-tag { display:inline-block; font-size:.7rem; padding:2px 7px; margin-top:.4rem;
    margin-right:4px; border:1px solid var(--border2); color:var(--text3);
    font-family:'Cinzel',serif; letter-spacing:.05em; }
  .section-label { font-family:'Cinzel',serif; font-size:.65rem; color:var(--text3);
    letter-spacing:.15em; text-transform:uppercase; align-self:flex-start; max-width:680px; width:100%; }

  /* ── GAME LAYOUT ── */
  .game { flex-direction:column; height:100vh; overflow:hidden; }
  .topbar { display:flex; align-items:center; justify-content:space-between;
    padding:.5rem 1rem; background:var(--panel); border-bottom:1px solid var(--border);
    flex-shrink:0; gap:.8rem; flex-wrap:wrap; }
  .topbar-title { font-family:'Cinzel',serif; font-size:.95rem; color:var(--gold); letter-spacing:.1em; }
  .badge { display:flex; align-items:center; gap:.3rem; font-size:.78rem;
    padding:3px 10px; border:1px solid var(--border); background:var(--bg2); }
  .badge .lbl { color:var(--text3); font-family:'Cinzel',serif; font-size:.62rem; letter-spacing:.08em; }
  .badge .val { color:var(--gold2); font-weight:600; }
  .badge.danger .val { color:var(--red2); }
  .game-body { display:grid; grid-template-columns:260px 1fr; flex:1; overflow:hidden; }

  /* ── LEFT PANEL ── */
  .left { background:var(--panel); border-right:1px solid var(--border);
    display:flex; flex-direction:column; overflow-y:auto; overflow-x:hidden; }
  .hero-head { padding:.8rem; background:linear-gradient(180deg,rgba(201,146,42,.08) 0%,transparent 100%);
    border-bottom:1px solid var(--border); text-align:center; }
  .portrait { width:60px; height:60px; border:2px solid var(--gold); margin:0 auto .4rem;
    display:flex; align-items:center; justify-content:center; font-size:2rem; background:var(--bg3); }
  .hero-name { font-family:'Cinzel',serif; font-size:.85rem; color:var(--gold2); }
  .hero-cls  { font-size:.72rem; color:var(--text3); font-style:italic; }
  .sec { font-family:'Cinzel',serif; font-size:.6rem; letter-spacing:.15em; color:var(--gold);
    padding:.4rem .8rem .2rem; border-top:1px solid var(--border); text-transform:uppercase; }
  .bar-wrap { padding:.25rem .8rem; }
  .bar-lbl { display:flex; justify-content:space-between; font-size:.68rem; color:var(--text2); margin-bottom:2px; }
  .bar { height:7px; background:var(--bg3); border:1px solid var(--border); overflow:hidden; }
  .bar-fill { height:100%; transition:width .5s ease; }
  .bar-fill.hp  { background:linear-gradient(to right,#4a1a1a,#c0392b); }
  .bar-fill.mana{ background:linear-gradient(to right,#1a1a4a,#2471a3); }
  .bar-fill.thr { background:linear-gradient(to right,#3a2a1a,#c0392b); }
  .bar-fill.vis { background:linear-gradient(to right,#2a3a1a,#27ae60); }
  .bar-fill.cor { background:linear-gradient(to right,#2a1a3a,#8b2fc9); }
  .army-row { display:flex; justify-content:space-between; padding:.2rem .8rem;
    font-size:.78rem; border-bottom:1px solid rgba(61,46,26,.4); }
  .army-row .aname { color:var(--text2); }
  .army-row .acount { color:var(--gold2); font-weight:600; }
  .escape-dots { padding:.4rem .8rem; display:flex; gap:5px; align-items:center; }
  .dot { width:11px; height:11px; border:1px solid var(--gold); background:var(--gold); }
  .dot.used { background:transparent; border-color:var(--border2); }
  .gold-val { padding:.2rem .8rem; font-size:.85rem; color:var(--gold2); font-weight:600; }

  /* ── MAP ── */
  .map-wrap { position:relative; overflow:hidden; background:var(--bg); }
  canvas#mc { width:100%; height:100%; }
  .map-overlay { position:absolute; top:.7rem; right:.7rem; display:flex; flex-direction:column; gap:.3rem; pointer-events:none; }
  .veil-ind { background:rgba(74,16,96,.85); border:1px solid var(--veil2);
    padding:.35rem .7rem; font-family:'Cinzel',serif; font-size:.72rem; color:var(--veil2); }
  .hunter-ind { background:rgba(139,26,26,.85); border:1px solid var(--red2);
    padding:.35rem .7rem; font-family:'Cinzel',serif; font-size:.72rem; color:var(--red2); }
  .legend { position:absolute; top:.7rem; left:.7rem; display:flex; flex-direction:column; gap:3px; pointer-events:none; }
  .leg-item { display:flex; align-items:center; gap:5px; font-size:.68rem; color:var(--text2); }
  .leg-dot { width:9px; height:9px; border-radius:50%; flex-shrink:0; }
  .map-btns { position:absolute; bottom:.7rem; left:50%; transform:translateX(-50%); display:flex; gap:.5rem; }
  .phase-banner { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
    font-family:'Cinzel',serif; font-size:1.6rem; color:var(--gold2);
    text-shadow:0 0 30px rgba(201,146,42,.8); pointer-events:none; z-index:50;
    animation:fadeIn .5s ease; text-align:center; }
  @keyframes fadeIn { from{opacity:0;transform:translate(-50%,-60%)} to{opacity:1;transform:translate(-50%,-50%)} }

  /* ── DRAWER ── */
  .drawer { position:absolute; bottom:0; left:260px; right:0; background:var(--panel);
    border-top:2px solid var(--gold); transform:translateY(100%);
    transition:transform .4s cubic-bezier(.16,1,.3,1); z-index:100; max-height:55vh; overflow-y:auto; }
  .drawer.open { transform:translateY(0); }
  .drawer-head { display:flex; align-items:center; justify-content:space-between;
    padding:.7rem 1rem; border-bottom:1px solid var(--border);
    background:linear-gradient(90deg,rgba(201,146,42,.08),transparent); }
  .drawer-title { font-family:'Cinzel',serif; font-size:.95rem; color:var(--gold2); }
  .drawer-sub { font-size:.82rem; color:var(--text2); font-style:italic; }
  .drawer-body { padding:.9rem 1rem; }
  .event-text { font-size:.98rem; line-height:1.7; margin-bottom:.8rem; }
  .btn-row { display:flex; gap:.5rem; flex-wrap:wrap; }

  /* ── COMBAT ── */
  .combat-grid { display:grid; grid-template-columns:1fr 80px 1fr; gap:.8rem; align-items:start; margin-bottom:.8rem; }
  .combatant { background:var(--bg3); border:1px solid var(--border); padding:.7rem; }
  .combatant-name { font-family:'Cinzel',serif; font-size:.82rem; color:var(--gold2); margin-bottom:.25rem; }
  .combatant-stats { font-size:.75rem; color:var(--text2); line-height:1.8; }
  .vs { text-align:center; font-family:'Cinzel',serif; font-size:1.3rem; color:var(--gold); padding-top:.8rem; }
  .combat-log { max-height:80px; overflow-y:auto; font-size:.75rem; color:var(--text2);
    padding:.3rem; background:var(--bg); border:1px solid var(--border); line-height:1.6; margin-bottom:.8rem; }
  .log-hero   { color:#f5d78e; }
  .log-veil   { color:#8b2fc9; }
  .log-system { color:var(--text3); font-style:italic; }

  /* ── END SCREENS ── */
  .end-screen { flex-direction:column; align-items:center; justify-content:center; gap:1.5rem; }
  .dead-bg  { background:radial-gradient(ellipse,#1a0505,#0a0805); }
  .win-bg   { background:radial-gradient(ellipse,#1a1505,#0a0805); }
  .end-title { font-family:'Cinzel',serif; font-size:3rem; font-weight:900; }
  .end-dead  { color:var(--red2); text-shadow:0 0 40px rgba(192,57,43,.5); }
  .end-win   { color:var(--gold2); text-shadow:0 0 40px rgba(201,146,42,.5); animation:glow 2s ease-in-out infinite alternate; }
  .end-sub   { font-style:italic; color:var(--text2); font-size:1.1rem; }
  .stats-row { display:flex; gap:1rem; flex-wrap:wrap; justify-content:center; }
  .stat-box  { text-align:center; padding:.7rem 1rem; background:var(--panel); border:1px solid var(--border); min-width:90px; }
  .stat-val  { font-family:'Cinzel',serif; font-size:1.5rem; color:var(--gold2); }
  .stat-lbl  { font-size:.7rem; color:var(--text3); text-transform:uppercase; letter-spacing:.1em; }

  /* ── RECAP ── */
  .recap-screen { flex-direction:column; align-items:center; gap:1.5rem; overflow-y:auto;
    background:radial-gradient(ellipse,#1a0f05,#0a0805); padding:2rem; }
  canvas#rc { border:1px solid var(--border2); background:var(--bg2); max-width:700px; width:100%; }

  .pulse { animation:pulse 1.5s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.6} }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const RUNES = ['ᚠ','ᚢ','ᚦ','ᚨ','ᚱ','ᚲ','ᚷ','ᚹ','ᚺ','ᚾ','ᛁ','ᛃ','ᛇ','ᛈ','ᛉ','ᛊ','ᛏ','ᛒ','ᛖ','ᛗ','ᛚ','ᛜ','ᛞ','ᛟ'];
const RISK_COLOR: Record<string, string> = { green:'#27ae60', yellow:'#e8b84b', red:'#c0392b' };
const HERO_NAMES: Record<string, string[]> = {
  kaempfer: ['Aldric der Unbeugsame','Mira Stahlklingen','Bren Schildbrecher'],
  magier:   ['Syra die Sehende','Korvan Flammenweber','Lena des Abgrunds'],
};
const ARMY_LABELS: Record<string, string> = {
  miliz:'Miliz', veteran:'Veteran', elite:'Elite', leader:'Anführer', mage:'Magie-Adept',
};

// ─────────────────────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────────────────────
type Screen = 'intro'|'auth'|'select'|'game'|'dead'|'victory'|'recap';

export default function App() {
  // ── State ──
  const [screen, setScreen]           = useState<Screen>('intro');
  const [user, setUser]               = useState<User|null>(null);
  const [authMode, setAuthMode]       = useState<'login'|'register'>('login');
  const [authEmail, setAuthEmail]     = useState('');
  const [authPw, setAuthPw]           = useState('');
  const [authErr, setAuthErr]         = useState('');

  const [selRegion, setSelRegion]     = useState('');
  const [selClass, setSelClass]       = useState('');

  const [runId, setRunId]             = useState<number|null>(null);
  const [hero, setHero]               = useState<HeroState|null>(null);
  const [veil, setVeil]               = useState<VeilState|null>(null);
  const [units, setUnits]             = useState<ArmyUnit[]>([]);
  const [mapNodes, setMapNodes]       = useState<MapNode[]>([]);
  const [mapEdges, setMapEdges]       = useState<MapEdge[]>([]);
  const [heroName, setHeroName]       = useState('');

  const [plannedRoute, setPlannedRoute] = useState<string[]>([]);
  const [currentNode, setCurrentNode]   = useState('');
  const [veilNode, setVeilNode]         = useState('');
  const [stepCount, setStepCount]       = useState(0);
  const [roomCount, setRoomCount]       = useState(0);

  const [drawer, setDrawer]             = useState<null|{
    title: string; sub: string; icon: string; body: React.ReactNode;
  }>(null);
  const [banner, setBanner]             = useState('');
  const [executing, setExecuting]       = useState(false);

  // Combat
  const [combatState, setCombatState]   = useState<CombatState|null>(null);
  const [pendingSteps, setPendingSteps] = useState<StepResult[]>([]);

  const mapCanvasRef  = useRef<HTMLCanvasElement>(null);
  const recapCanvasRef = useRef<HTMLCanvasElement>(null);

  // ── CSS injection ──
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  // ── Rune animation on intro ──
  const runeEls = Array.from({ length: 10 }, (_, i) => (
    <div key={i} className="rune" style={{
      left: `${10 + i * 8}%`,
      animationDelay: `${i * 2}s`,
      animationDuration: `${16 + i * 2}s`,
      fontSize: `${50 + (i % 3) * 30}px`,
    }}>{RUNES[i * 2 % RUNES.length]}</div>
  ));

  // ── Map drawing ──
  const drawMap = useCallback(() => {
    const canvas = mapCanvasRef.current;
    if (!canvas || !mapNodes.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(61,46,26,.12)'; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    const nmap: Record<string, MapNode> = {};
    mapNodes.forEach(n => { nmap[n.node_key] = n; });
    const nx = (n: MapNode) => n.x * W;
    const ny = (n: MapNode) => n.y * H;

    // Edges
    mapEdges.forEach(e => {
      const a = nmap[e.from_node], b = nmap[e.to_node];
      if (!a || !b || (!a.is_revealed && !b.is_revealed)) return;
      const inRoute = isEdgeInRoute(e.from_node, e.to_node);
      ctx.beginPath(); ctx.moveTo(nx(a), ny(a)); ctx.lineTo(nx(b), ny(b));
      if (e.is_blocked) { ctx.strokeStyle='#8b1a1a'; ctx.setLineDash([4,4]); ctx.lineWidth=2; }
      else if (inRoute) { ctx.strokeStyle='#c9922a'; ctx.setLineDash([]); ctx.lineWidth=3; }
      else { ctx.strokeStyle='rgba(90,64,32,.55)'; ctx.setLineDash([]); ctx.lineWidth=1.5; }
      ctx.stroke(); ctx.setLineDash([]);
    });

    // Nodes
    mapNodes.forEach(node => {
      if (!node.is_revealed) {
        ctx.beginPath(); ctx.arc(nx(node), ny(node), 4, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(61,46,26,.25)'; ctx.fill(); return;
      }
      const x = nx(node), y = ny(node);
      const isCurrent = node.node_key === currentNode;
      const isVeil    = node.node_key === veilNode && stepCount > 0;
      const inRoute   = plannedRoute.includes(node.node_key);
      const rIdx      = plannedRoute.indexOf(node.node_key);
      const r         = isCurrent ? 17 : node.node_type === 'exit' ? 15 : 13;
      const rc        = RISK_COLOR[node.risk_color] ?? '#888';

      if (isCurrent || node.node_type === 'exit') {
        const grd = ctx.createRadialGradient(x,y,r,x,y,r+9);
        grd.addColorStop(0, isCurrent ? 'rgba(201,146,42,.3)' : 'rgba(201,146,42,.18)');
        grd.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(x, y, r+9, 0, Math.PI*2); ctx.fillStyle=grd; ctx.fill();
      }
      if (inRoute) {
        ctx.beginPath(); ctx.arc(x, y, r+5, 0, Math.PI*2);
        ctx.strokeStyle='#c9922a'; ctx.lineWidth=2; ctx.setLineDash([3,3]); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
      ctx.fillStyle = node.side==='hero' ? '#1a3a6a' : node.side==='veil' ? '#3a1060' :
                      node.node_type==='exit' ? '#3a2a00' : node.is_visited ? '#1a1510' : '#13100c';
      ctx.fill();
      ctx.strokeStyle = node.is_visited ? 'rgba(90,64,32,.5)' : rc;
      ctx.lineWidth = isCurrent ? 3 : 2; ctx.stroke();

      ctx.font = `${isCurrent ? 13 : 11}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const icon = node.side==='hero'&&!node.is_visited ? '⚔' :
                   node.side==='veil'&&!node.is_visited ? '👁' :
                   node.node_type==='exit' ? '◈' :
                   node.node_type==='mentor' ? '✦' :
                   node.node_type==='command' ? '★' :
                   node.is_visited ? '✓' :
                   node.risk_color==='red' ? '☠' : node.risk_color==='yellow' ? '◆' : '○';
      ctx.fillStyle = node.side==='hero' ? '#4a8fd0' : node.side==='veil' ? '#8b2fc9' :
                      node.node_type==='exit' ? '#c9922a' : node.is_visited ? 'rgba(90,64,32,.8)' : rc;
      ctx.fillText(icon, x, y);

      if (inRoute && rIdx >= 0) {
        ctx.beginPath(); ctx.arc(x+r-2, y-r+2, 8, 0, Math.PI*2);
        ctx.fillStyle='#c9922a'; ctx.fill();
        ctx.font='bold 9px Cinzel,serif'; ctx.fillStyle='#000';
        ctx.fillText(String(rIdx+1), x+r-2, y-r+2);
      }
      if (isVeil) {
        ctx.beginPath(); ctx.arc(x, y+r+8, 7, 0, Math.PI*2);
        ctx.fillStyle='rgba(139,47,201,.7)'; ctx.fill();
        ctx.font='8px serif'; ctx.fillStyle='#fff'; ctx.fillText('👁', x, y+r+8);
      }
      ctx.font='8px Crimson Text,serif'; ctx.fillStyle='rgba(168,144,112,.5)';
      ctx.fillText(node.node_key, x, y+r+14);
    });
  }, [mapNodes, mapEdges, currentNode, veilNode, plannedRoute, stepCount]);

  function isEdgeInRoute(a: string, b: string) {
    for (let i=0; i<plannedRoute.length-1; i++)
      if ((plannedRoute[i]===a&&plannedRoute[i+1]===b)||(plannedRoute[i]===b&&plannedRoute[i+1]===a)) return true;
    if (plannedRoute.length>0 &&
        ((currentNode===a&&plannedRoute[0]===b)||(currentNode===b&&plannedRoute[0]===a))) return true;
    return false;
  }

  useEffect(() => {
    const canvas = mapCanvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const wrap = canvas.parentElement!;
      canvas.width  = wrap.clientWidth;
      canvas.height = wrap.clientHeight - 52;
      drawMap();
    });
    ro.observe(canvas.parentElement!);
    return () => ro.disconnect();
  }, [drawMap]);

  useEffect(() => { drawMap(); }, [drawMap]);

  // ── Map click ──
  function onMapClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (executing || drawer) return;
    const canvas = mapCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top)  * (canvas.height / rect.height);
    const W = canvas.width, H = canvas.height;

    let closest: MapNode|null = null, minDist = 28;
    mapNodes.forEach(node => {
      if (!node.is_revealed) return;
      const d = Math.hypot(node.x*W - mx, node.y*H - my);
      if (d < minDist) { minDist = d; closest = node; }
    });
    if (!closest) return;
    const n = closest as MapNode;
    if (n.node_key === currentNode) return;

    const last = plannedRoute.length ? plannedRoute[plannedRoute.length-1] : currentNode;
    const lastNode = mapNodes.find(x => x.node_key === last)!;
    const edgeExists = mapEdges.some(e => !e.is_blocked &&
      ((e.from_node===last&&e.to_node===n.node_key)||(e.from_node===n.node_key&&e.to_node===last)));
    if (!edgeExists) { showBanner('Nicht verbunden!'); return; }

    const idx = plannedRoute.indexOf(n.node_key);
    if (idx !== -1) {
      setPlannedRoute(r => r.slice(0, idx));
    } else {
      if (plannedRoute.length >= 4) { showBanner('Max. 4 Schritte!'); return; }
      setPlannedRoute(r => [...r, n.node_key]);
      // Reveal neighbours
      setMapNodes(prev => {
        const neighbours = mapEdges
          .filter(e => e.from_node===n.node_key||e.to_node===n.node_key)
          .map(e => e.from_node===n.node_key ? e.to_node : e.from_node);
        return prev.map(mn => neighbours.includes(mn.node_key) ? {...mn, is_revealed:true} : mn);
      });
    }
  }

  function showBanner(msg: string) {
    setBanner(msg);
    setTimeout(() => setBanner(''), 2000);
  }

  // ── Auth ──
  async function doAuth() {
    setAuthErr('');
    try {
      const data = await apiFetch(`/auth/${authMode}`, '', 'POST', { email: authEmail, password: authPw });
      setUser({ id: data.user.id, email: data.user.email, token: data.token });
      setScreen('select');
    } catch (e: any) { setAuthErr(e.message); }
  }

  // ── Start Run ──
  async function startRun() {
    if (!user || !selRegion || !selClass) return;
    try {
      const data = await apiFetch('/runs', user.token, 'POST', { region: selRegion, heroClass: selClass });
      setRunId(data.runId);
      setCurrentNode(data.heroStart);
      setVeilNode(data.veilStart);
      setStepCount(0);
      setRoomCount(0);
      setPlannedRoute([]);
      // pick hero name
      const names = HERO_NAMES[selClass];
      setHeroName(names[Math.floor(Math.random() * names.length)]);
      await loadRunState(data.runId, user.token);
      setScreen('game');
      // welcome drawer
      setTimeout(() => setDrawer({
        icon: '⚔', title: 'Der Run beginnt',
        sub: `${selRegion==='grenzlande'?'Die Grenzlande':'Das Nebelmoor'} · ${selClass==='kaempfer'?'Kämpfer':'Magier'}`,
        body: (
          <div>
            <p className="event-text">Du betrittst das Gebiet. Der Schleier wartet irgendwo in der Tiefe des Knotennetzes.<br/><br/>
              Klicke Knoten an um deine Route zu planen (max. 4 Schritte), dann <em>Route ausführen</em>.</p>
            <div className="btn-row"><button className="btn primary" onClick={() => setDrawer(null)}>Run beginnen →</button></div>
          </div>
        ),
      }), 200);
    } catch (e: any) { alert('Fehler: ' + e.message); }
  }

  async function loadRunState(id: number, token: string) {
    const data = await apiFetch(`/runs/${id}`, token);
    setHero(data.hero);
    setVeil(data.veil);
    setUnits(data.units);
    setMapNodes(data.nodes);
    setMapEdges(data.edges);
    setCurrentNode(data.run.current_hero_node);
    setVeilNode(data.run.current_veil_node);
    setStepCount(data.run.step_count ?? 0);
    return data;
  }

  // ── Execute Route ──
  async function executeRoute() {
    if (!user || !runId || plannedRoute.length === 0 || executing) return;
    setExecuting(true);
    try {
      await apiFetch(`/runs/${runId}/plan`, user.token, 'POST', { route: plannedRoute });
      const result = await apiFetch(`/runs/${runId}/execute`, user.token, 'POST');
      setPlannedRoute([]);

      // Update local state immediately
      await loadRunState(runId, user.token);

      // Process steps sequentially
      for (const step of result.steps as StepResult[]) {
        if (step.type === 'exit') {
          setScreen('recap');
          drawRecapMap();
          return;
        }
        if (step.type === 'encounter') {
          await showEncounter(step);
          if (screen === 'dead') return;
        } else if (step.type === 'event') {
          await showEvent(step);
        }
      }

      if (result.runStatus === 'dead') { setScreen('dead'); return; }
      if (result.runStatus === 'schleier_besiegt' || result.runStatus === 'completed') {
        setScreen('victory'); return;
      }
    } catch (e: any) {
      showBanner('Fehler: ' + e.message);
    } finally {
      setExecuting(false);
    }
  }

  function showEvent(step: StepResult): Promise<void> {
    return new Promise(resolve => {
      setDrawer({
        icon: step.eventIcon ?? '📜',
        title: step.eventName ?? 'Ereignis',
        sub: `Raum ${step.node}`,
        body: (
          <div>
            <p className="event-text">{step.eventText}</p>
            <div className="btn-row">
              {(step.choices ?? []).map((c, i) => (
                <button key={i} className={`btn${i===0?' primary':''}`}
                  onClick={async () => {
                    try {
                      const res = await apiFetch(`/runs/${runId}/event/choose`, user!.token, 'POST',
                        { eventId: step.eventId, choiceIndex: i });
                      setHero(h => h ? {...h, ...res.heroState} : h);
                      setDrawer({
                        icon: step.eventIcon ?? '📜',
                        title: step.eventName ?? 'Ereignis',
                        sub: `Raum ${step.node}`,
                        body: (
                          <div>
                            <p className="event-text" style={{color:'var(--gold3)'}}>{c.text}</p>
                            <div className="btn-row">
                              <button className="btn primary" onClick={() => { setDrawer(null); resolve(); }}>
                                Weiter →
                              </button>
                            </div>
                          </div>
                        ),
                      });
                      if (res.heroState?.hp <= 0) { setScreen('dead'); resolve(); }
                    } catch (e: any) { showBanner(e.message); }
                  }}>{c.label}</button>
              ))}
            </div>
          </div>
        ),
      });
    });
  }

  function showEncounter(step: StepResult): Promise<void> {
    return new Promise(resolve => {
      const initCS: CombatState = {
        round: 0,
        heroStr:     step.heroStr ?? 0,
        veilStr:     step.veilStr ?? 0,
        heroBaseStr: step.heroStr ?? 0,
        veilBaseStr: step.veilStr ?? 0,
        log: [{ type:'system', text:`⚡ BEGEGNUNG bei ${step.node}!` }],
        finished: false,
      };
      setCombatState(initCS);
      showCombatDrawer(initCS, step, resolve);
    });
  }

  function showCombatDrawer(cs: CombatState, step: StepResult, resolve: ()=>void) {
    const canEscape = (hero?.escape_count ?? 0) < 3;
    setDrawer({
      icon: '⚔',
      title: 'Begegnung!',
      sub: `Schleier-Konfrontation — Raum ${step.node}`,
      body: (
        <div>
          <div className="combat-grid">
            <div className="combatant">
              <div className="combatant-name">⚔ Deine Armee</div>
              <div className="combatant-stats">
                HP: {hero?.hp}/{hero?.max_hp}<br/>
                {Object.entries(ARMY_LABELS).map(([k,l]) => {
                  const u = units.find(x=>x.side==='hero'&&x.unit_type===k);
                  return u && u.count>0 ? <span key={k}>{l}: {u.count}<br/></span> : null;
                })}
                <strong style={{color:'var(--gold2)'}}>Stärke: {Math.floor(cs.heroStr)}</strong>
              </div>
            </div>
            <div className="vs">VS</div>
            <div className="combatant" style={{borderColor:'var(--veil)'}}>
              <div className="combatant-name" style={{color:'var(--veil2)'}}>👁 {step.veilBoss ?? 'Schleier-Armee'}</div>
              <div className="combatant-stats">
                <strong style={{color:'var(--veil2)'}}>Stärke: {Math.floor(cs.veilStr)}</strong>
              </div>
            </div>
          </div>
          <div className="combat-log">
            {cs.log.map((l,i) => (
              <div key={i} className={`log-${l.type}`}>{l.text}</div>
            ))}
          </div>
          <div className="btn-row">
            <button className="btn primary" onClick={() => doCombatAction('attack', cs, step, resolve)}>⚔ Angreifen</button>
            <button className="btn" onClick={() => doCombatAction('defend', cs, step, resolve)}>🛡 Verteidigen</button>
            {canEscape
              ? <button className="btn danger" onClick={() => doCombatAction('escape', cs, step, resolve)}>
                  🏃 Fliehen ({3-(hero?.escape_count??0)} übrig)
                </button>
              : <button className="btn" disabled>Fliehen (aufgebraucht)</button>
            }
          </div>
          <div style={{fontSize:'.72rem',color:'var(--text3)',marginTop:'.4rem'}}>Runde {cs.round+1}</div>
        </div>
      ),
    });
  }

  async function doCombatAction(action: 'attack'|'defend'|'escape', cs: CombatState, step: StepResult, resolve: ()=>void) {
    try {
      const newCS: CombatState = await apiFetch(`/runs/${runId}/combat/action`, user!.token, 'POST',
        { action, combatState: cs });
      setCombatState(newCS);

      if (newCS.finished) {
        if (newCS.winner === 'veil') {
          setDrawer(null);
          setScreen('dead');
          resolve();
          return;
        }
        if (newCS.winner === 'hero' || newCS.winner === 'fled') {
          await loadRunState(runId!, user!.token);
          const resultText = newCS.winner === 'fled' ? '🏃 Du entkommst!' : '🏆 SIEG! Der Schleier zieht sich zurück.';
          setDrawer({
            icon: newCS.winner==='fled'?'🏃':'🏆',
            title: newCS.winner==='fled'?'Flucht!':'Sieg!',
            sub: `Raum ${step.node}`,
            body: (
              <div>
                <p className="event-text" style={{color:'var(--gold3)'}}>{resultText}</p>
                <div className="combat-log">
                  {newCS.log.slice(-3).map((l,i)=><div key={i} className={`log-${l.type}`}>{l.text}</div>)}
                </div>
                <div className="btn-row">
                  <button className="btn primary" onClick={() => { setDrawer(null); resolve(); }}>Weiter →</button>
                </div>
              </div>
            ),
          });
          return;
        }
      }
      showCombatDrawer(newCS, step, resolve);
    } catch (e: any) { showBanner(e.message); }
  }

  // ── Recap ──
  function drawRecapMap() {
    const canvas = recapCanvasRef.current;
    if (!canvas || !mapNodes.length) return;
    const W = 700, H = 350;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0a0805'; ctx.fillRect(0,0,W,H);
    const nmap: Record<string,MapNode> = {};
    mapNodes.forEach(n => { nmap[n.node_key]=n; });
    const rx = (n:MapNode) => n.x*W, ry = (n:MapNode) => n.y*H;
    mapEdges.forEach(e => {
      const a=nmap[e.from_node], b=nmap[e.to_node]; if(!a||!b) return;
      ctx.beginPath(); ctx.moveTo(rx(a),ry(a)); ctx.lineTo(rx(b),ry(b));
      ctx.strokeStyle='rgba(61,46,26,.5)'; ctx.lineWidth=1; ctx.stroke();
    });
    // Hero path
    const visited = mapNodes.filter(n=>n.is_visited&&n.side!=='veil').map(n=>n.node_key);
    for(let i=0;i<visited.length-1;i++) {
      const a=nmap[visited[i]],b=nmap[visited[i+1]]; if(!a||!b) continue;
      ctx.beginPath(); ctx.moveTo(rx(a),ry(a)); ctx.lineTo(rx(b),ry(b));
      ctx.strokeStyle='#2471a3'; ctx.lineWidth=3; ctx.stroke();
    }
    mapNodes.forEach(n => {
      ctx.beginPath(); ctx.arc(rx(n),ry(n),10,0,Math.PI*2);
      ctx.fillStyle=n.is_visited?'#1a2a4a':'#13100c'; ctx.fill();
      ctx.strokeStyle=RISK_COLOR[n.risk_color]??'#555'; ctx.lineWidth=2; ctx.stroke();
      ctx.font='9px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle=n.is_visited?'#4a8fd0':'#555';
      ctx.fillText(n.side==='hero'?'⚔':n.side==='veil'?'👁':n.node_type==='exit'?'◈':'○', rx(n),ry(n));
    });
    ctx.font='11px Crimson Text,serif';
    ctx.fillStyle='#2471a3'; ctx.fillText('━ Deine Route', 60, H-20);
  }

  // ── Army display ──
  function armyRows(side: 'hero'|'veil') {
    const labels = side==='hero'
      ? { miliz:'Miliz', veteran:'Veteran', elite:'Elite', leader:'Anführer', mage:'Magie-Adept' }
      : { soeldner:'Söldner', waechter:'Wächter', klaue:'Klaue' };
    return Object.entries(labels).map(([type, label]) => {
      const u = units.find(x=>x.side===side&&x.unit_type===type);
      if (!u || u.count<=0) return null;
      return <div key={type} className="army-row"><span className="aname">{label}</span><span className="acount">{u.count}</span></div>;
    });
  }

  function totalStr() {
    const w: Record<string,number> = {miliz:2,veteran:5,elite:10,leader:20,mage:8};
    return units.filter(u=>u.side==='hero').reduce((s,u)=>s+(w[u.unit_type]??0)*u.count,0);
  }

  // ── Stats for end screens ──
  function statsRow() {
    return (
      <div className="stats-row">
        <div className="stat-box"><div className="stat-val">{stepCount}</div><div className="stat-lbl">Schritte</div></div>
        <div className="stat-box"><div className="stat-val">{roomCount}</div><div className="stat-lbl">Räume</div></div>
        <div className="stat-box"><div className="stat-val">{hero?.gold??0}</div><div className="stat-lbl">Gold</div></div>
        <div className="stat-box"><div className="stat-val">{totalStr()}</div><div className="stat-lbl">Armee</div></div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render screens
  // ─────────────────────────────────────────────────────────────────────────

  if (screen === 'intro') return (
    <div className="screen intro">
      {runeEls}
      <h1 className="intro-title">SCHLEIER & DUNKEL</h1>
      <p className="intro-sub">„Zwei Armeen. Ein Knotennetz. Niemand sieht den Plan des anderen."</p>
      <div className="divider"/>
      <button className="btn primary large" onClick={() => setScreen('auth')}>Das Spiel beginnen</button>
      <p style={{marginTop:'1.5rem',fontSize:'.78rem',color:'var(--text3)',fontStyle:'italic'}}>MVP v1.0</p>
    </div>
  );

  if (screen === 'auth') return (
    <div className="screen intro">
      {runeEls}
      <div className="auth-box">
        <h2>{authMode==='login'?'ANMELDEN':'REGISTRIEREN'}</h2>
        <div className="field">
          <label>E-Mail</label>
          <input type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&doAuth()} autoFocus/>
        </div>
        <div className="field">
          <label>Passwort</label>
          <input type="password" value={authPw} onChange={e=>setAuthPw(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&doAuth()}/>
        </div>
        {authErr && <p className="err">{authErr}</p>}
        <button className="btn primary" onClick={doAuth}>
          {authMode==='login'?'Einloggen':'Registrieren'}
        </button>
        <button className="link-btn" onClick={()=>{ setAuthMode(m=>m==='login'?'register':'login'); setAuthErr(''); }}>
          {authMode==='login'?'Noch kein Konto? Registrieren':'Zurück zum Login'}
        </button>
        <button className="btn" onClick={()=>setScreen('intro')}>← Zurück</button>
      </div>
    </div>
  );

  if (screen === 'select') return (
    <div className="screen select-screen">
      <h2 style={{fontFamily:'Cinzel,serif',fontSize:'1.15rem',color:'var(--gold2)',letterSpacing:'.15em'}}>
        GEBIET & KLASSE WÄHLEN
      </h2>
      <p className="section-label">Startgebiet</p>
      <div className="select-grid">
        {[
          { id:'grenzlande', icon:'⚔️', title:'Die Grenzlande', desc:'Räuber, Militärposten, manipulierte Hinweise.', tags:['Sichtbarkeit','Banditen'] },
          { id:'nebelmoor',  icon:'🌿', title:'Das Nebelmoor',  desc:'Sumpf, Irrlichter, Flüche und Verderbnis.',   tags:['Verderbnis','Geister'] },
        ].map(r => (
          <div key={r.id} className={`select-card${selRegion===r.id?' sel':''}`} onClick={()=>setSelRegion(r.id)}>
            <div className="card-icon">{r.icon}</div>
            <div className="card-title">{r.title}</div>
            <div className="card-desc">{r.desc}</div>
            {r.tags.map(t=><span key={t} className="card-tag">{t}</span>)}
          </div>
        ))}
      </div>
      <p className="section-label">Klasse</p>
      <div className="select-grid">
        {[
          { id:'kaempfer', icon:'🛡️', title:'Kämpfer', desc:'Haltungs-Ressource. Stark in Engstellen.', tags:['HP Hoch','Block'] },
          { id:'magier',   icon:'🔮', title:'Magier',  desc:'Mana + Überhitzung. Burst gegen Gruppen.',  tags:['Mana','Burst'] },
        ].map(c => (
          <div key={c.id} className={`select-card${selClass===c.id?' sel':''}`} onClick={()=>setSelClass(c.id)}>
            <div className="card-icon">{c.icon}</div>
            <div className="card-title">{c.title}</div>
            <div className="card-desc">{c.desc}</div>
            {c.tags.map(t=><span key={t} className="card-tag">{t}</span>)}
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:'1rem',paddingBottom:'1rem'}}>
        <button className="btn" onClick={()=>setScreen('intro')}>← Zurück</button>
        <button className="btn primary" disabled={!selRegion||!selClass} onClick={startRun}>▶ Run starten</button>
      </div>
    </div>
  );

  if (screen === 'dead') return (
    <div className="screen end-screen dead-bg">
      <div className="end-title end-dead">GEFALLEN</div>
      <p className="end-sub">Die Dunkelheit hat dich verschluckt.</p>
      {statsRow()}
      <button className="btn primary large" onClick={()=>{ setScreen('select'); setSelRegion(''); setSelClass(''); }}>
        Erneut versuchen
      </button>
    </div>
  );

  if (screen === 'victory') return (
    <div className="screen end-screen win-bg">
      <div className="end-title end-win">⚔ DER SCHLEIER IST GEFALLEN ⚔</div>
      <p className="end-sub">Du hast die Schleier-Armee vernichtet.</p>
      {statsRow()}
      <button className="btn primary large" onClick={()=>{ setScreen('select'); setSelRegion(''); setSelClass(''); }}>
        Nächster Run
      </button>
    </div>
  );

  if (screen === 'recap') return (
    <div className="screen recap-screen">
      <h2 style={{fontFamily:'Cinzel,serif',color:'var(--gold2)',fontSize:'1.6rem',letterSpacing:'.1em'}}>
        ⚔ GEBIETS-RÜCKBLICK
      </h2>
      <canvas id="rc" ref={recapCanvasRef} height={350}/>
      {statsRow()}
      <div style={{display:'flex',gap:'1rem'}}>
        <button className="btn" onClick={()=>setScreen('game')}>← Zurück zum Spiel</button>
        <button className="btn primary" onClick={()=>{ setScreen('select'); setSelRegion(''); setSelClass(''); }}>
          Neuer Run
        </button>
      </div>
    </div>
  );

  // ── GAME SCREEN ──
  const stageRoman = ['','I','II','III','IV','V'][veil?.stage??1];
  return (
    <div className="screen game">
      {/* TOP BAR */}
      <div className="topbar">
        <span className="topbar-title">⚔ SCHLEIER & DUNKEL</span>
        <div style={{display:'flex',gap:'.4rem',flexWrap:'wrap'}}>
          <div className="badge"><span className="lbl">SCHRITT</span><span className="val">{stepCount}</span></div>
          <div className="badge"><span className="lbl">RÄUME</span><span className="val">{roomCount}</span></div>
          <div className="badge danger"><span className="lbl">SCHLEIER</span><span className="val">{stageRoman}</span></div>
        </div>
        <div style={{display:'flex',gap:'.4rem'}}>
          <button className="btn" onClick={()=>{setScreen('recap');drawRecapMap();}}>📜 Rückblick</button>
          <button className="btn danger" onClick={()=>{ setScreen('select'); setSelRegion(''); setSelClass(''); }}>Neuer Run</button>
        </div>
      </div>

      {/* BODY */}
      <div className="game-body">
        {/* LEFT */}
        <div className="left">
          <div className="hero-head">
            <div className="portrait">{selClass==='kaempfer'?'⚔️':'🔮'}</div>
            <div className="hero-name">{heroName}</div>
            <div className="hero-cls">{selClass==='kaempfer'?'Kämpfer':'Magier'}</div>
          </div>
          <div className="bar-wrap">
            <div className="bar-lbl"><span>Lebenspunkte</span><span>{hero?.hp??0}/{hero?.max_hp??0}</span></div>
            <div className="bar"><div className="bar-fill hp" style={{width:`${hero?hero.hp/hero.max_hp*100:0}%`}}/></div>
          </div>
          {selClass==='magier' && (
            <div className="bar-wrap">
              <div className="bar-lbl"><span>Mana</span><span>{hero?.mana??0}/{hero?.max_mana??0}</span></div>
              <div className="bar"><div className="bar-fill mana" style={{width:`${hero?hero.mana/hero.max_mana*100:0}%`}}/></div>
            </div>
          )}
          <div className="bar-wrap">
            <div className="bar-lbl"><span>Bedrohung</span><span>{hero?.threat??0}/10</span></div>
            <div className="bar"><div className="bar-fill thr" style={{width:`${(hero?.threat??0)*10}%`}}/></div>
          </div>
          <div className="bar-wrap">
            <div className="bar-lbl"><span>Sichtbarkeit</span><span>{hero?.visibility??0}/10</span></div>
            <div className="bar"><div className="bar-fill vis" style={{width:`${(hero?.visibility??0)*10}%`}}/></div>
          </div>
          <div className="bar-wrap">
            <div className="bar-lbl"><span>Verderbnis</span><span>{hero?.corruption??0}/10</span></div>
            <div className="bar"><div className="bar-fill cor" style={{width:`${(hero?.corruption??0)*10}%`}}/></div>
          </div>

          <div className="sec">⚔ Armee</div>
          {armyRows('hero')}
          <div style={{padding:'.2rem .8rem',fontSize:'.75rem',color:'var(--text3)'}}>
            Gesamtstärke: <span style={{color:'var(--gold2)'}}>{totalStr()}</span>
          </div>

          <div className="sec">🏃 Flucht</div>
          <div className="escape-dots">
            {[0,1,2].map(i=><div key={i} className={`dot${i<(hero?.escape_count??0)?' used':''}`}/>)}
            <span style={{fontSize:'.72rem',color:'var(--text3)',marginLeft:'6px'}}>{3-(hero?.escape_count??0)} übrig</span>
          </div>

          <div className="sec">💰 Gold</div>
          <div className="gold-val">{hero?.gold??0} Gold</div>

          <div className="sec">👁 Schleier</div>
          <div style={{padding:'.4rem .8rem',fontSize:'.75rem',color:'var(--text3)',fontStyle:'italic'}}>
            {veil?.boss_name && <strong style={{color:'var(--veil2)',display:'block'}}>{veil.boss_name}</strong>}
            Stufe {stageRoman}{veil?.hunters_active ? ' · ⚡ Jäger aktiv' : ''}
          </div>
        </div>

        {/* MAP */}
        <div className="map-wrap" id="map-wrap">
          <canvas id="mc" ref={mapCanvasRef} onClick={onMapClick} style={{cursor:'crosshair'}}/>
          <div className="legend">
            {[['#27ae60','Grün – Sicher'],['#e8b84b','Gelb – Mittel'],['#c0392b','Rot – Gefahr'],
              ['#2471a3','Held-Start'],['#8b2fc9','Schleier-Start'],['#c9922a','Exit']].map(([c,l])=>(
              <div key={l} className="leg-item"><div className="leg-dot" style={{background:c}}/>{l}</div>
            ))}
          </div>
          <div className="map-overlay">
            <div className={`veil-ind${veil?.stage!==undefined&&veil.stage>=3?' pulse':''}`}>
              Schleier-Stufe: <strong>{stageRoman}</strong>
            </div>
            {veil?.hunters_active && <div className="hunter-ind">⚡ JÄGER AKTIV</div>}
          </div>
          <div className="map-btns">
            <button className="btn" onClick={()=>setPlannedRoute([])}>Route löschen</button>
            <button className="btn primary" disabled={executing||plannedRoute.length===0} onClick={executeRoute}>
              {executing ? '...' : `Route ausführen → (${plannedRoute.length})`}
            </button>
          </div>
          {banner && <div className="phase-banner">{banner}</div>}
        </div>
      </div>

      {/* DRAWER */}
      <div className={`drawer${drawer?' open':''}`} style={{left:'260px'}}>
        {drawer && <>
          <div className="drawer-head">
            <div>
              <div className="drawer-title">{drawer.title}</div>
              <div className="drawer-sub">{drawer.sub}</div>
            </div>
            <div style={{fontSize:'1.6rem'}}>{drawer.icon}</div>
          </div>
          <div className="drawer-body">{drawer.body}</div>
        </>}
      </div>
    </div>
  );
}