// Ranks & tiers — Umain Arena
// Ranks: a permanent studio career ladder earned with XP (never resets).
// Tiers: a dynamic, Nordic-themed rating ladder that rises and falls per match
// (like CS:GO elo). Playful career personas — no real titles, no real people.

/* ─── XP per action ───────────────────────────────────────────────────── */
export const XP = { kill: 25, headshot: 12, winRound: 40, winMatch: 120, match: 25 };

/* ─── Progression curve ───────────────────────────────────────────────── */
// lvl1→2: 170 XP | lvl25→26: 650 XP | lvl49→50: 1,130 XP
// Total lvl1→50 ≈ 31,850 XP → ~91 competitive matches ≈ 24h of play.
export function xpToNextLevel(level) {
  if (level >= 50) return Infinity;
  return 150 + level * 20;
}

export function progressFromXp(totalXp) {
  let xp = Math.max(0, totalXp), level = 1;
  while (level < 50) {
    const need = xpToNextLevel(level);
    if (xp < need) break;
    xp -= need; level++;
  }
  return { level, xpCurrent: Math.floor(xp), xpNeeded: level < 50 ? xpToNextLevel(level) : 0 };
}

export function xpForMatch(s) {
  const myRounds = s.team === 'P' ? (s.roundsP || 0) : (s.roundsB || 0);
  return s.kills * XP.kill
       + (s.headshots || 0) * XP.headshot
       + myRounds * XP.winRound
       + (s.won ? XP.winMatch : 0)
       + XP.match;
}

/* ─── Rating change per match ─────────────────────────────────────────── */
export function ratingDelta(s) {
  const perf = Math.min(s.kills * 2 + (s.headshots || 0) * 3, 30);
  return s.won ? 55 + perf : -35 + Math.min(perf, 10);
}

/* ─── SVG helpers ─────────────────────────────────────────────────────── */
const S = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">${body}</svg>`;

function star(cx, cy, r, fill, stroke = 'none') {
  const ri = r * 0.4;
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rd = i % 2 === 0 ? r : ri;
    return `${+(cx + Math.cos(a) * rd).toFixed(1)},${+(cy + Math.sin(a) * rd).toFixed(1)}`;
  }).join(' ');
  return `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="0.5"/>`;
}

function rhombus(cx, cy, w, h, fill) {
  return `<polygon points="${cx},${cy - h} ${cx + w},${cy} ${cx},${cy + h} ${cx - w},${cy}" fill="${fill}"/>`;
}

function chevron(cy, color, w = 2.5) {
  return `<polyline points="6,${cy + 6} 16,${cy} 26,${cy + 6}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function bar(y, color) {
  return `<rect x="7" y="${y}" width="18" height="3.5" rx="1.5" fill="${color}"/>`;
}

// Shield frame for tiers
const SH = 'M16,2 L28,8 L28,19 Q28,27 16,31 Q4,27 4,19 L4,8 Z';
function tierIcon(bg, stroke, inner) {
  return S(`<path d="${SH}" fill="${bg}" stroke="${stroke}" stroke-width="1.5"/>${inner}`);
}

/* ─── Rank insignia (generic studio-ladder badges) ────────────────────── */
const IC = {
  intern:    S(`<circle cx="16" cy="16" r="12" fill="none" stroke="#6b7280" stroke-width="2"/>
    <text x="16" y="20" text-anchor="middle" font-family="monospace" font-size="9" font-weight="bold" fill="#6b7280">INT</text>`),
  junior1:   S(star(16, 16, 11, '#9ca3af')),
  junior2:   S(star(10, 17, 8, '#9ca3af') + star(22, 17, 8, '#9ca3af')),
  assoc1:    S(chevron(18, '#a8a29e')),
  assoc2:    S(chevron(13, '#a8a29e') + chevron(21, '#a8a29e')),
  contrib1:  S(rhombus(16, 16, 7, 11, '#b45309')),
  contrib2:  S(rhombus(9, 16, 5.5, 8, '#b45309') + rhombus(23, 16, 5.5, 8, '#b45309')),
  maker1:    S(rhombus(6, 16, 4, 7, '#ca8a04') + rhombus(16, 16, 4, 7, '#ca8a04') + rhombus(26, 16, 4, 7, '#ca8a04')),
  maker2:    S(rhombus(6, 13, 3.5, 6, '#ca8a04') + rhombus(16, 13, 3.5, 6, '#ca8a04') + rhombus(26, 13, 3.5, 6, '#ca8a04') + chevron(21, '#ca8a04', 2)),
  senior:    S(`<path d="M7,20 L7,15 Q7,6 16,6 Q25,6 25,15 L25,20" fill="none" stroke="#d97706" stroke-width="2"/>
    <rect x="5" y="20" width="22" height="3" rx="1.5" fill="#d97706"/>` + rhombus(16, 12, 3.5, 6, '#fbbf24')),
  specialist: S(`<circle cx="16" cy="16" r="11" fill="none" stroke="#0369a1" stroke-width="1.5"/>
    <line x1="16" y1="5" x2="16" y2="27" stroke="#0369a1" stroke-width="2.5"/>
    <line x1="5" y1="16" x2="27" y2="16" stroke="#0369a1" stroke-width="2.5"/>`),
  lead:      S(bar(21, '#0284c7') + star(16, 12, 7, '#fbbf24')),
  seniorLead: S(bar(18, '#0284c7') + bar(24, '#0284c7') + star(16, 10, 5.5, '#fbbf24')),
  principal: S(bar(15, '#0e7490') + bar(20, '#0e7490') + bar(25, '#0e7490') + star(16, 9, 5, '#fbbf24')),
  staff:     S(`<path d="M16,4 L21,10 L29,11 L23,17 L25,25 L16,20.5 L7,25 L9,17 L3,11 L11,10 Z" fill="#7e22ce"/>
    <path d="M10,27 L16,23 L22,27 L16,30 Z" fill="#6d28d9"/>`),
  director:  S(`<path d="M16,4 L21,10 L29,11 L23,17 L25,25 L16,20.5 L7,25 L9,17 L3,11 L11,10 Z" fill="#6d28d9"/>` +
    star(16, 28, 3.5, '#e2e8f0')),
  seniorDir: S(`<path d="M16,4 L21,10 L29,11 L23,17 L25,25 L16,20.5 L7,25 L9,17 L3,11 L11,10 Z" fill="#4c1d95"/>` +
    star(10, 28, 3.5, '#e2e8f0') + star(22, 28, 3.5, '#e2e8f0')),
  vp:        S(star(9,  9,  7, '#9f1239') + star(23,  9, 7, '#9f1239') +
               star(9, 23,  7, '#9f1239') + star(23, 23, 7, '#9f1239')),
  svp:       S(star(16,  5, 6, '#be123c') +
               star( 5, 15, 6, '#be123c') + star(27, 15, 6, '#be123c') +
               star( 9, 26, 6, '#be123c') + star(23, 26, 6, '#be123c')),
  partner:   S(star(16,  4, 5, '#e11d48') +
               star( 4, 13, 5, '#e11d48') + star(28, 13, 5, '#e11d48') +
               star( 4, 22, 5, '#e11d48') + star(28, 22, 5, '#e11d48') +
               star(16, 28, 5, '#e11d48')),
  founder:   S(`<path d="M4,23 Q4,8 16,4 Q28,8 28,23 L24,27 L16,29 L8,27 Z" fill="none" stroke="#f43f5e" stroke-width="1.5"/>` +
    star( 8, 19, 4.5, '#f43f5e') + star(16, 11, 5.5, '#fbbf24') + star(24, 19, 4.5, '#f43f5e')),
  legend:    S(`<path d="M7,16 L7,12 Q7,4 16,3 Q25,4 25,12 L25,16 L22,19 L16,20 L10,19 Z" fill="#92400e"/>
    <rect x="8" y="12" width="16" height="2" fill="#fbbf24"/>
    <rect x="6" y="15" width="20" height="2" fill="#fbbf24"/>
    <rect x="8" y="8" width="16" height="2" fill="#fbbf24"/>` +
    star(16, 26, 5.5, '#fbbf24')),
};

/* ─── Tier icons ──────────────────────────────────────────────────────── */
const TI = {
  tundra1:   tierIcon('#451a03', '#d97706', star(16, 20, 7, '#d97706')),
  tundra2:   tierIcon('#451a03', '#d97706', star(10, 20, 5.5, '#d97706') + star(22, 20, 5.5, '#d97706')),
  tundra3:   tierIcon('#451a03', '#f59e0b', star(9, 20, 4.5, '#f59e0b') + star(16, 20, 4.5, '#f59e0b') + star(23, 20, 4.5, '#f59e0b')),
  frost1:    tierIcon('#1f2937', '#9ca3af', star(16, 20, 7, '#9ca3af')),
  frost2:    tierIcon('#1f2937', '#d1d5db', star(10, 20, 5.5, '#d1d5db') + star(22, 20, 5.5, '#d1d5db')),
  frost3:    tierIcon('#1f2937', '#e5e7eb', star(9, 20, 4.5, '#e5e7eb') + star(16, 20, 4.5, '#e5e7eb') + star(23, 20, 4.5, '#e5e7eb')),
  amber1:    tierIcon('#1c1400', '#fbbf24', star(16, 20, 7, '#fbbf24')),
  amber2:    tierIcon('#1c1400', '#f59e0b', star(10, 20, 5.5, '#f59e0b') + star(22, 20, 5.5, '#f59e0b')),
  amber3:    tierIcon('#1c1400', '#eab308', star(9, 20, 4.5, '#eab308') + star(16, 20, 4.5, '#eab308') + star(23, 20, 4.5, '#eab308')),
  glacier1:  tierIcon('#083344', '#06b6d4', `<polygon points="16,9 22,18 16,27 10,18" fill="#06b6d4" opacity="0.8"/>`),
  glacier2:  tierIcon('#083344', '#22d3ee', `<polygon points="16,8 23,18 16,28 9,18" fill="#0e7490"/>` + star(16, 18, 5.5, '#22d3ee')),
  glacier3:  tierIcon('#083344', '#67e8f9', `<polygon points="16,7 24,18 16,29 8,18" fill="#155e75"/>` + star(16, 18, 6, '#67e8f9')),
  aurora1:   tierIcon('#1e1b4b', '#818cf8', `<polygon points="16,7 24,18 16,29 8,18" fill="#3730a3"/>` + star(16, 18, 6, '#818cf8')),
  aurora2:   tierIcon('#1e1b4b', '#a5b4fc', `<polygon points="16,6 25,18 16,30 7,18" fill="#3730a3"/>` + star(16, 18, 6.5, '#a5b4fc')),
  aurora3:   tierIcon('#1e1b4b', '#c7d2fe', `<polygon points="16,5 26,18 16,31 6,18" fill="#312e81"/>` + star(16, 18, 7, '#c7d2fe')),
  midnight:  tierIcon('#2e1065', '#c084fc', `<circle cx="16" cy="19" r="8" fill="#7e22ce"/>` + star(16, 19, 5.5, '#f0abfc')),
  polaris:   tierIcon('#1a0030', '#f472b6', `<circle cx="16" cy="19" r="8" fill="#6d28d9"/>` + star(16, 19, 6, '#fde047')),
  viking:    tierIcon('#1c1400', '#fde047',
    `<path d="M10,26 Q8,15 16,10 Q24,15 22,26 L19,27 L16,28 L13,27 Z" fill="#92400e" stroke="#fde047" stroke-width="1"/>` +
    star(16, 19, 7, '#fde047')),
};

/* ─── 50 ranks — the studio career ladder ─────────────────────────────── */
const R = (title, short, color, icon) => ({ title, short, color, icon });

export const RANK_TABLE = [
  R('Intern',            'INT', '#6b7280', IC.intern),     //  1
  R('Junior',            'JR',  '#9ca3af', IC.junior1),    //  2
  R('Junior',            'JR',  '#9ca3af', IC.junior1),    //  3
  R('Junior II',         'JR2', '#9ca3af', IC.junior2),    //  4
  R('Junior II',         'JR2', '#9ca3af', IC.junior2),    //  5
  R('Associate',         'ASC', '#a8a29e', IC.assoc1),     //  6
  R('Associate',         'ASC', '#a8a29e', IC.assoc1),     //  7
  R('Associate II',      'AS2', '#a8a29e', IC.assoc2),     //  8
  R('Contributor',       'CON', '#b45309', IC.contrib1),   //  9
  R('Contributor',       'CON', '#b45309', IC.contrib1),   // 10
  R('Contributor II',    'CN2', '#b45309', IC.contrib2),   // 11
  R('Contributor II',    'CN2', '#b45309', IC.contrib2),   // 12
  R('Maker',             'MKR', '#ca8a04', IC.maker1),     // 13
  R('Maker',             'MKR', '#ca8a04', IC.maker1),     // 14
  R('Maker II',          'MK2', '#ca8a04', IC.maker2),     // 15
  R('Maker II',          'MK2', '#ca8a04', IC.maker2),     // 16
  R('Senior',            'SNR', '#d97706', IC.senior),     // 17
  R('Senior',            'SNR', '#d97706', IC.senior),     // 18
  R('Specialist',        'SPC', '#0369a1', IC.specialist), // 19
  R('Specialist',        'SPC', '#0369a1', IC.specialist), // 20
  R('Lead',              'LD',  '#0284c7', IC.lead),       // 21
  R('Lead',              'LD',  '#0284c7', IC.lead),       // 22
  R('Senior Lead',       'SLD', '#0ea5e9', IC.seniorLead), // 23
  R('Senior Lead',       'SLD', '#0ea5e9', IC.seniorLead), // 24
  R('Principal',         'PRN', '#0e7490', IC.principal),  // 25
  R('Principal',         'PRN', '#0e7490', IC.principal),  // 26
  R('Principal',         'PRN', '#0e7490', IC.principal),  // 27
  R('Staff',             'STF', '#7e22ce', IC.staff),      // 28
  R('Staff',             'STF', '#7e22ce', IC.staff),      // 29
  R('Staff',             'STF', '#7e22ce', IC.staff),      // 30
  R('Director',          'DIR', '#6d28d9', IC.director),   // 31
  R('Director',          'DIR', '#6d28d9', IC.director),   // 32
  R('Director',          'DIR', '#6d28d9', IC.director),   // 33
  R('Senior Director',   'SDR', '#4c1d95', IC.seniorDir),  // 34
  R('Senior Director',   'SDR', '#4c1d95', IC.seniorDir),  // 35
  R('Senior Director',   'SDR', '#4c1d95', IC.seniorDir),  // 36
  R('Senior Director',   'SDR', '#4c1d95', IC.seniorDir),  // 37
  R('VP',                'VP',  '#9f1239', IC.vp),         // 38
  R('VP',                'VP',  '#9f1239', IC.vp),         // 39
  R('VP',                'VP',  '#9f1239', IC.vp),         // 40
  R('Senior VP',         'SVP', '#be123c', IC.svp),        // 41
  R('Senior VP',         'SVP', '#be123c', IC.svp),        // 42
  R('Senior VP',         'SVP', '#be123c', IC.svp),        // 43
  R('Partner',           'PTN', '#e11d48', IC.partner),    // 44
  R('Partner',           'PTN', '#e11d48', IC.partner),    // 45
  R('Partner',           'PTN', '#e11d48', IC.partner),    // 46
  R('Founder',           'FND', '#f43f5e', IC.founder),    // 47
  R('Founder',           'FND', '#f43f5e', IC.founder),    // 48
  R('Founder',           'FND', '#f43f5e', IC.founder),    // 49
  R('Studio Legend',     'LGD', '#fbbf24', IC.legend),     // 50
];

export function rankForLevel(level) {
  return RANK_TABLE[Math.min(Math.max(level, 1), 50) - 1];
}

/* ─── 18 tiers — the Nordic rating ladder ─────────────────────────────── */
export const ELOS = [
  { id: 'tundra1',  name: 'Tundra I',    min: 0,     color: '#d97706', icon: TI.tundra1  },
  { id: 'tundra2',  name: 'Tundra II',   min: 400,   color: '#d97706', icon: TI.tundra2  },
  { id: 'tundra3',  name: 'Tundra III',  min: 800,   color: '#f59e0b', icon: TI.tundra3  },
  { id: 'frost1',   name: 'Frost I',     min: 1200,  color: '#9ca3af', icon: TI.frost1   },
  { id: 'frost2',   name: 'Frost II',    min: 1700,  color: '#d1d5db', icon: TI.frost2   },
  { id: 'frost3',   name: 'Frost III',   min: 2200,  color: '#e5e7eb', icon: TI.frost3   },
  { id: 'amber1',   name: 'Amber I',     min: 2800,  color: '#fbbf24', icon: TI.amber1   },
  { id: 'amber2',   name: 'Amber II',    min: 3400,  color: '#f59e0b', icon: TI.amber2   },
  { id: 'amber3',   name: 'Amber III',   min: 4000,  color: '#eab308', icon: TI.amber3   },
  { id: 'glacier1', name: 'Glacier I',   min: 4700,  color: '#06b6d4', icon: TI.glacier1 },
  { id: 'glacier2', name: 'Glacier II',  min: 5500,  color: '#22d3ee', icon: TI.glacier2 },
  { id: 'glacier3', name: 'Glacier III', min: 6300,  color: '#67e8f9', icon: TI.glacier3 },
  { id: 'aurora1',  name: 'Aurora I',    min: 7200,  color: '#818cf8', icon: TI.aurora1  },
  { id: 'aurora2',  name: 'Aurora II',   min: 8200,  color: '#a5b4fc', icon: TI.aurora2  },
  { id: 'aurora3',  name: 'Aurora III',  min: 9300,  color: '#c7d2fe', icon: TI.aurora3  },
  { id: 'midnight', name: 'Midnight Sun', min: 10500, color: '#c084fc', icon: TI.midnight },
  { id: 'polaris',  name: 'Polaris',     min: 12000, color: '#f472b6', icon: TI.polaris  },
  { id: 'viking',   name: 'VIKING',      min: 14000, color: '#fde047', icon: TI.viking   },
];

export function eloFromRating(rating) {
  let elo = ELOS[0];
  for (const e of ELOS) if (rating >= e.min) elo = e;
  return elo;
}

export function eloProgress(rating) {
  const elo = eloFromRating(rating);
  const idx = ELOS.indexOf(elo);
  const next = idx < ELOS.length - 1 ? ELOS[idx + 1] : null;
  const pct = next ? Math.round(((rating - elo.min) / (next.min - elo.min)) * 100) : 100;
  return { elo, next, pct };
}
