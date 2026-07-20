// Boot, menus, settings, logo, main loop.
import * as THREE from 'three';
import { initTextures } from './textures.js';
import { CHARACTERS, buildCharacter } from './characters.js';
import { MAPS, MAP_IDS, DEFAULT_MAP, resolveMapId } from './maps.js';
import { Sfx } from './audio.js';
import { Game } from './game.js';
import { VERSION } from './version.js';

/* ---------------- settings & nickname ---------------- */
const SETTINGS_KEY = 'awpbr_settings';
const settings = Object.assign({ sens: 1, vol: 0.7, quality: 'med', speech: true, map: DEFAULT_MAP, wpnMode: 'all' },
  JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'));
const saveSettings = () => localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
const NICK_KEY = 'awpbr_nick';
const SOCIAL_KEY = 'awpbr_social';

/* ---------------- renderer ---------------- */
const container = document.getElementById('game-container');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;
container.appendChild(renderer.domElement);

const textures = initTextures();
const sfx = new Sfx(); sfx.vol = settings.vol;
sfx.speechEnabled = settings.speech !== false;
const sfxReady = sfx.loadManifest();

/* ---------------- selected map ---------------- */
const urlMap = new URLSearchParams(location.search).get('map');
let currentMap = resolveMapId(urlMap || settings.map);
settings.map = currentMap;

/* ---------------- menu backdrop (orbiting map) ---------------- */
let menuScene = new THREE.Scene();
MAPS[currentMap].build(menuScene, textures);
const menuCam = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 400);
function rebuildMenuBackdrop() {
  menuScene = new THREE.Scene();
  MAPS[currentMap].build(menuScene, textures);
}

/* ---------------- screens ---------------- */
const screens = ['mobile-warning', 'main-menu', 'team-select', 'char-select', 'settings-panel', 'howto-panel', 'ranking-panel', 'pause-menu', 'match-end'];
function show(id) {
  for (const s of screens) document.getElementById(s).classList.toggle('hidden', s !== id);
  if (!id) for (const s of screens) document.getElementById(s).classList.add('hidden');
}
const $ = id => document.getElementById(id);
const isMobile = matchMedia('(pointer: coarse)').matches || innerWidth < 820;
let settingsReturn = 'main-menu';

/* ---------------- 3D character preview ---------------- */
let pv = null;
function ensurePreview() {
  if (pv) return pv;
  const canvas = $('char-preview');
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  r.setSize(340, 340, false);
  r.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffe6c0, 0x5a4a38, 1.1));
  const key = new THREE.DirectionalLight(0xffe0b3, 1.8); key.position.set(2, 4, 3); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88aaff, 0.55); rim.position.set(-3, 2, -2); scene.add(rim);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.06, 26), new THREE.MeshLambertMaterial({ color: 0x2e331f }));
  disc.position.y = -0.03; disc.receiveShadow = true; scene.add(disc);
  const cam = new THREE.PerspectiveCamera(34, 1, 0.1, 20);
  cam.position.set(0, 1.3, 3.2); cam.lookAt(0, 0.92, 0);
  pv = { r, scene, cam, model: null };
  return pv;
}
function pvSetChar(def) {
  const p = ensurePreview();
  if (p.model) p.scene.remove(p.model);
  p.model = buildCharacter(def).group;
  p.model.rotation.y = 0.4;
  p.scene.add(p.model);
}
function pvThumb(def) {
  pvSetChar(def);
  const p = ensurePreview();
  p.model.rotation.y = 0.55;
  p.r.render(p.scene, p.cam);
  const c = document.createElement('canvas'); c.width = c.height = 96;
  c.getContext('2d').drawImage(p.r.domElement, 0, 0, 96, 96);
  return c.toDataURL();
}

/* ---------------- game lifecycle ---------------- */
let game = null, currentTeam = 'P', currentChar = CHARACTERS[0].id, selChar = null;
let submitted = true;   // current match stats already submitted?
let registeredNick = ''; // nick used when registering the session (the token is tied to it)
let heartbeatOff = false;
const params = new URLSearchParams(location.search);
const testMode = params.get('debug') === '1';

async function startGame(team, charId) {
  if (isMobile && !testMode) { show('mobile-warning'); return; }
  currentTeam = team; currentChar = charId;
  if (game) game.dispose();
  show(null);
  await sfxReady;   // make sure voice/CS samples are registered before round 1 sounds
  game = new Game({
    renderer, textures, sfx, settings,
    playerCharId: charId, playerTeam: team, mapId: currentMap,
    nickname: $('nick-input').value, testMode,
    onMatchEnd: recordMatchStats,
  });
  window.__game = game;
  submitted = false;
  retryPending();
  armSwitchHook();
  game.onOpenSettings = () => { game.setPaused(true); settingsReturn = 'pause-menu'; show('settings-panel'); };
  game.onToggleSpeech = () => {
    settings.speech = !settings.speech;
    sfx.speechEnabled = settings.speech;
    saveSettings();
    $('set-speech').checked = settings.speech;
    return settings.speech;
  };
  game.start();
  // register the nick in the global ranking (silent if the API is offline)
  const nick = $('nick-input').value.trim();
  registeredNick = nick; heartbeatOff = false;
  if (nick && !testMode) {
    api('/api/register', {
      nick, token: getToken(),
      socials: socials.filter(s => s.handle),
    });
  }
  try { window.va?.('event', { name: 'game_start', data: { team, character: charId, map: currentMap } }); } catch {}
  if (!testMode) { try { renderer.domElement.requestPointerLock()?.catch?.(() => {}); } catch {} }
}
function quitToMenu() {
  if (game) { game.dispose(); game = null; }
  if (document.pointerLockElement) document.exitPointerLock();
  show('main-menu');
}

/* ---------------- heartbeat (presence/map) ---------------- */
setInterval(async () => {
  if (!game || !registeredNick || testMode || heartbeatOff) return;
  const res = await api('/api/heartbeat', { nick: registeredNick, token: getToken() });
  if (res && res.error) heartbeatOff = true;   // invalid token etc. — stop hammering
}, 30_000);

/* ---------------- avatar upload (no login — validated by nick+token) ---------------- */
$('avatar-btn').onclick = () => $('avatar-file').click();
$('avatar-file').onchange = async e => {
  const f = e.target.files[0];
  const nick = registeredNick || (nickEl.value || '').trim();
  if (!f || !nick) return;
  $('avatar-note').textContent = 'uploading…';
  try {
    const bmp = await createImageBitmap(f);
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d');
    const s = Math.min(bmp.width, bmp.height);
    x.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, 128, 128);
    const dataUrl = c.toDataURL('image/png');
    const res = await api('/api/avatar', { nick, token: getToken(), image: dataUrl });
    $('avatar-note').textContent = res && res.ok ? 'photo updated! ✓' : 'failed: ' + (res?.error || 'no connection');
  } catch { $('avatar-note').textContent = 'failed — try another image'; }
  e.target.value = '';
};

/* ---------------- menu wiring ---------------- */
$('btn-jogar').onclick = () => {
  if (!(nickEl.value || '').trim()) {
    nickEl.classList.add('invalid');
    nickEl.placeholder = 'ENTER A NICK FIRST!';
    nickEl.focus();
    setTimeout(() => nickEl.classList.remove('invalid'), 1500);
    return;   // no nick, no game
  }
  sfx.uiClick();
  const firstEmpty = socials.find(s => !s.handle);
  if (firstEmpty) {
    document.querySelector('.social-item input')?.classList.add('invalid');
    setTimeout(() => document.querySelector('.social-item input')?.classList.remove('invalid'), 1200);
  }
  show('team-select');
};
$('btn-ranking').onclick = () => { sfx.uiClick(); showRanking(); };
$('ranking-back').onclick = () => { sfx.uiClick(); show('main-menu'); };
// maps dropdown (after the user fields, before PLAY)
const mapSel = $('map-select');
for (const id of MAP_IDS) {
  const o = document.createElement('option');
  o.value = id; o.textContent = MAPS[id].name;
  mapSel.appendChild(o);
}
mapSel.value = currentMap;
mapSel.onchange = () => {
  sfx.uiClick();
  currentMap = resolveMapId(mapSel.value);
  settings.map = currentMap; saveSettings();
  rebuildMenuBackdrop();
};
const wpnSel = { value: settings.wpnMode || 'all' };
// custom weapon-mode dropdown (with original SVG icons)
const WPN_ICONS = {
  all: `<svg width="22" height="14" viewBox="0 0 22 14" fill="none"><path d="M1 9l8-6 1 1-8 6-1-1zm20-2L13 1l-1 1 8 6 1-1z" fill="currentColor"/><rect x="9" y="6" width="4" height="7" fill="currentColor"/></svg>`,
  pistols: `<svg width="20" height="14" viewBox="0 0 20 14" fill="none"><path d="M1 2h12v4H9v6H5V6H1V2z" fill="currentColor"/><rect x="9" y="1" width="4" height="3" fill="currentColor"/></svg>`,
  knife: `<svg width="20" height="14" viewBox="0 0 20 14" fill="none"><path d="M1 12L14 1l4 1-3 11-8 2-6-3z" fill="currentColor"/><rect x="1" y="10" width="5" height="3" fill="currentColor"/></svg>`,
  awp: `<svg width="26" height="12" viewBox="0 0 26 12" fill="none"><rect x="0" y="4" width="26" height="3" fill="currentColor"/><rect x="7" y="0" width="8" height="4" fill="currentColor"/><rect x="2" y="7" width="6" height="4" fill="currentColor"/></svg>`,
};
const WPN_MODES = [
  { id: 'all', label: 'ALL' },
  { id: 'pistols', label: 'PISTOLS ONLY' },
  { id: 'knife', label: 'KNIFE ONLY' },
  { id: 'awp', label: 'AWP ONLY' },
];
const wpnDdBtn = $('wpn-dd-btn'), wpnDdList = $('wpn-dd-list'), wpnDdLabel = $('wpn-dd-label');
function wpnLabel(id) {
  const m = WPN_MODES.find(m => m.id === id);
  wpnDdLabel.innerHTML = `<span class="dd-cur">${WPN_ICONS[id]}<span>${m ? m.label : id}</span></span>`;
}
wpnDdList.innerHTML = WPN_MODES.map(m =>
  `<button class="dd-item" data-id="${m.id}" type="button">${WPN_ICONS[m.id]}<span>${m.label}</span></button>`).join('');
wpnLabel(wpnSel.value);
wpnDdBtn.onclick = e => { e.stopPropagation(); wpnDdList.classList.toggle('hidden'); wpnDdBtn.classList.toggle('open'); };
document.addEventListener('click', () => { wpnDdList.classList.add('hidden'); wpnDdBtn.classList.remove('open'); });
wpnDdList.querySelectorAll('.dd-item').forEach(b => b.onclick = () => {
  settings.wpnMode = b.dataset.id; saveSettings();
  wpnLabel(settings.wpnMode); sfx.uiClick();
});
$('btn-howto').onclick = () => { sfx.uiClick(); show('howto-panel'); };
$('howto-back').onclick = () => { sfx.uiClick(); show('main-menu'); };
$('btn-settings').onclick = () => { sfx.uiClick(); settingsReturn = 'main-menu'; show('settings-panel'); };
$('settings-back').onclick = () => {
  sfx.uiClick(); saveSettings();
  if (game) game.applySettings();
  show(settingsReturn);
};
$('mobile-ok').onclick = () => { sfx.uiClick(); show('main-menu'); };
$('team-back').onclick = () => { sfx.uiClick(); show('main-menu'); };
$('char-back').onclick = () => { sfx.uiClick(); show('team-select'); };
$('btn-team-p').onclick = () => { sfx.uiClick(); pickTeam('P'); };
$('btn-team-b').onclick = () => { sfx.uiClick(); pickTeam('B'); };
$('btn-resume').onclick = () => { sfx.uiClick(); game?.resume(); };
$('btn-pause-settings').onclick = () => { sfx.uiClick(); settingsReturn = 'pause-menu'; show('settings-panel'); };
$('btn-quit').onclick = () => {
  sfx.uiClick();
  const pl = partialPayload();
  if (pl) { submitted = true; submitGlobal(pl); }
  quitToMenu();
};
$('btn-again').onclick = () => { sfx.uiClick(); startGame(currentTeam, currentChar); };
$('btn-menu').onclick = () => { sfx.uiClick(); quitToMenu(); };
// M in-game: pick the new team's character before switching
let switchMode = false;
function armSwitchHook() {
  game.onRequestSwitch = () => {
    if (document.pointerLockElement) document.exitPointerLock();
    switchMode = true;
    pickTeam(game.enemyTeam);
  };
}
$('char-confirm').onclick = () => {
  sfx.uiClick();
  if (!selChar) return;
  if (switchMode) {
    switchMode = false;
    currentChar = selChar.id;
    show(null);
    game._switchTeam(selChar.id);
    if (!testMode) renderer.domElement.requestPointerLock();
  } else startGame(currentTeam, selChar.id);
};

const nickEl = $('nick-input');
nickEl.value = localStorage.getItem(NICK_KEY) || '';
nickEl.oninput = () => localStorage.setItem(NICK_KEY, nickEl.value);
const SOCIAL_NET_KEY = 'awpbr_social_net'; // legacy (migration to multiple networks)
function sanitizeHandle(v) { return v.replace(/^@+/, '').replace(/[^a-zA-Z0-9._-]/g, ''); }
function extractFromUrl(v) {
  const m = v.match(/(?:x\.com|twitter\.com|github\.com|instagram\.com|tiktok\.com\/@|youtube\.com\/@|linkedin\.com\/in)\/?@?([A-Za-z0-9._-]+)/i);
  return m ? m[1] : null;
}

/* ---------------- multiple social networks (up to 3, no login) ---------------- */
const SOCIALS_KEY = 'awpbr_socials';
const NETS = [['x', 'X / Twitter'], ['github', 'GitHub'], ['instagram', 'Instagram'],
  ['linkedin', 'LinkedIn'], ['tiktok', 'TikTok'], ['youtube', 'YouTube'], ['site', 'Own site']];
let socials = [];
try { socials = JSON.parse(localStorage.getItem(SOCIALS_KEY) || '[]'); } catch {}
// migration from the old single field
if (!socials.length) {
  const oldNet = localStorage.getItem(SOCIAL_NET_KEY), oldHandle = localStorage.getItem(SOCIAL_KEY);
  if (oldNet && oldHandle) socials = [{ net: oldNet, handle: oldHandle }];
}
function saveSocials() {
  localStorage.setItem(SOCIALS_KEY, JSON.stringify(socials));
  updateAvatarVisibility();
}
function updateAvatarVisibility() {
  const hasAuto = socials.some(s => ['x', 'github'].includes(s.net) && s.handle);
  $('avatar-row').classList.toggle('hidden', hasAuto || !(nickEl.value || '').trim());
}
function renderSocials() {
  const list = $('social-list');
  list.innerHTML = '';
  socials.forEach((s, i) => {
    const row = document.createElement('div');
    row.className = 'pc-row social-item';
    row.innerHTML =
      `<select>${NETS.map(([v, l]) => `<option value="${v}"${v === s.net ? ' selected' : ''}>${l}</option>`).join('')}</select>` +
      `<input maxlength="40" placeholder="username" value="${String(s.handle).replace(/"/g, '&quot;')}">` +
      `<button class="social-del" title="remove" type="button">✕</button>`;
    const sel = row.querySelector('select'), inp = row.querySelector('input'), del = row.querySelector('.social-del');
    sel.onchange = () => { s.net = sel.value; saveSocials(); };
    inp.oninput = () => {
      let v = extractFromUrl(inp.value) || inp.value;
      v = sanitizeHandle(v);
      if (v !== inp.value) inp.value = v;
      s.handle = v; saveSocials();
    };
    del.onclick = () => { socials.splice(i, 1); saveSocials(); renderSocials(); };
    list.appendChild(row);
  });
  $('social-add').classList.toggle('hidden', socials.length >= 3);
}
$('social-add').onclick = () => { socials.push({ net: 'x', handle: '' }); saveSocials(); renderSocials(); };
nickEl.addEventListener('input', updateAvatarVisibility);
renderSocials();

/* ---------------- global ranking API (via the site's /api/*) ---------------- */
const TOKEN_KEY = 'awpbr_token';
function getToken() {
  let t = localStorage.getItem(TOKEN_KEY);
  if (!t) { t = crypto.randomUUID(); localStorage.setItem(TOKEN_KEY, t); }
  return t;
}
async function api(path, body) {
  try {
    const r = await fetch(path, body
      ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }
      : undefined);
    const j = await r.json().catch(() => ({}));
    return r.ok ? j : { error: j.error || `http_${r.status}` };
  } catch { return null; }
}
function submitNote(msg) {
  console.warn('[ranking]', msg);
  const el = document.getElementById('match-stats');
  if (el && !document.getElementById('match-end').classList.contains('hidden')) {
    const d = document.createElement('div');
    d.style.cssText = 'color:#ff8080;font-size:12px;width:100%';
    d.textContent = '⚠ stats not submitted: ' + msg;
    el.appendChild(d);
  }
}

// partial stats when the player leaves the match (quit to menu / close tab)
function partialPayload() {
  if (!game || submitted || testMode) return null;
  if (!['live', 'roundEnd', 'countdown'].includes(game.state)) return null;
  const g = game, p = g.player;
  const rounds = g.roundsWon.P + g.roundsWon.B;
  if (!p.kills && !p.deaths && !rounds && g.time < 30) return null;
  const nick = registeredNick || (nickEl.value || '').trim();
  if (!nick) return null;
  return {
    nick, token: getToken(), won: false, kills: p.kills, deaths: p.deaths,
    headshots: p.headshots || 0, bestStreak: g.mk.best || 0, rounds, team: g.playerTeam,
    seconds: Math.round(g.time), character: currentChar,
  };
}
addEventListener('beforeunload', () => {
  const pl = partialPayload();
  if (pl) navigator.sendBeacon('/api/submit-match', new Blob([JSON.stringify(pl)], { type: 'application/json' }));
});

/* ---------------- resend queue (server rate limit) ---------------- */
const PENDING_KEY = 'awpbr_pending_submit';
async function submitGlobal(pl) {
  const res = await api('/api/submit-match', pl);
  if (res?.error && /wait/i.test(res.error)) {
    localStorage.setItem(PENDING_KEY, JSON.stringify(pl));
    setTimeout(retryPending, 95_000);   // resends on its own once the window opens
  }
  return res;
}
async function retryPending() {
  const raw = localStorage.getItem(PENDING_KEY);
  if (!raw) return;
  const res = await api('/api/submit-match', JSON.parse(raw));
  if (res && !res.error) localStorage.removeItem(PENDING_KEY);
  else if (res?.error && /wait/i.test(res.error)) setTimeout(retryPending, 95_000);
}

/* ---------------- local stats (mirrored to the global ranking) ---------------- */
const STATS_KEY = 'awpbr_stats';
function loadStats() {
  return Object.assign({ matches: 0, wins: 0, kills: 0, deaths: 0, headshots: 0, bestStreak: 0 },
    JSON.parse(localStorage.getItem(STATS_KEY) || '{}'));
}
async function recordMatchStats(s) {
  submitted = true;
  const st = loadStats();
  st.matches++; if (s.won) st.wins++;
  st.kills += s.kills; st.deaths += s.deaths; st.headshots += s.headshots;
  st.playSeconds = (st.playSeconds || 0) + (s.seconds || 0);
  st.rounds = (st.rounds || 0) + s.roundsP + s.roundsB;
  st.bestStreak = Math.max(st.bestStreak, s.bestStreak);
  localStorage.setItem(STATS_KEY, JSON.stringify(st));
  // mirror to the global ranking (warn on screen if it fails)
  const nick = registeredNick || (nickEl.value || '').trim();
  if (nick && !testMode) {
    const res = await submitGlobal({
      nick, token: getToken(), won: s.won, kills: s.kills, deaths: s.deaths,
      headshots: s.headshots, bestStreak: s.bestStreak,
      rounds: s.roundsP + s.roundsB, team: s.team, seconds: s.seconds || 0,
      character: s.character,
    });
    if (!res) submitNote('global ranking unavailable');
    else if (res.error) submitNote(res.error);
  }
}
function showRanking() {
  const st = loadStats();
  const kd = st.deaths ? (st.kills / st.deaths).toFixed(2) : st.kills.toFixed(2);
  const fmt = (s) => { const m = Math.round(s / 60); return m < 60 ? `${m}min` : m < 1440 ? `${Math.floor(m / 60)}h ${m % 60}min` : `${Math.floor(m / 1440)}d ${Math.floor((m % 1440) / 60)}h`; };
  const secs = st.playSeconds || 0;
  const tempo = secs > 0 ? fmt(secs)
    : (st.rounds || 0) > 0 ? `~${fmt(st.rounds * 99)}`
    : st.matches > 0 ? `~${fmt(st.matches * 297)}` : '0min';
  const nick = (nickEl.value || 'YOU').trim();
  const social = socials.find(s => s.handle);
  $('rank-local').innerHTML =
    `<div style="grid-column:1/-1;text-align:center;color:var(--cs);font-size:18px">${nick}` +
    (social ? ` · <span style="color:#8a8064;font-size:12px">${social.net}/${social.handle.replace(/</g, '&lt;')}</span>` : '') + `</div>` +
    `<div><b>${st.matches}</b>matches</div><div><b>${st.wins > 0 ? st.wins : "—"}</b>wins</div><div><b>${kd}</b>K/D</div><div><b>${tempo}</b>arena</div>` +
    `<div><b>${st.kills}</b>kills</div><div><b>${st.deaths}</b>deaths</div><div><b>${st.headshots}</b>headshots</div><div><b>${st.rounds || 0}</b>rounds</div>`;
  show('ranking-panel');
  renderGlobal(nick);
}
async function renderGlobal(nick) {
  const box = $('rank-global');
  box.innerHTML = '<h3>🌐 GLOBAL RANKING</h3><div class="rg-off">loading…</div>';
  const data = await api('/api/leaderboard');
  if (!data || !data.players) {
    box.innerHTML = '<h3>🌐 GLOBAL RANKING</h3><div class="rg-off">unavailable right now</div>';
    return;
  }
  const rows = data.players.slice(0, 10).map((p, i) =>
    `<tr class="${p.nick === nick ? 'me' : ''}"><td>${i + 1}</td><td>${p.nick}</td><td>${p.kd}</td><td>${p.kills}</td><td>${p.wins > 0 ? p.wins : "—"}</td></tr>`).join('');
  box.innerHTML = '<h3>🌐 GLOBAL RANKING (top 10)</h3>' +
    (rows
      ? `<table><tr><th>#</th><th>PLAYER</th><th>K/D</th><th>KILLS</th><th>WINS</th></tr>${rows}</table>`
      : '<div class="rg-off">still empty — be the first!</div>') +
    `<div class="rg-links"><a href="/ranking" target="_blank" style="color:var(--cs)">FULL RANKING ↗</a>` +
    (nick ? `<a href="/u/${encodeURIComponent(nick)}" target="_blank" style="color:var(--cs)">MY PROFILE ↗</a>` : '') +
    `<a href="/mapa" target="_blank" style="color:var(--cs)">LIVE MAP ↗</a></div>`;
}

function pickTeam(team) {
  currentTeam = team;
  const list = $('char-list');
  list.innerHTML = '';
  const chars = CHARACTERS.filter(c => c.team === team);
  let firstRow = null;
  chars.forEach((c, i) => {
    const row = document.createElement('button');
    row.className = 'char-row';
    row.innerHTML = `<img src="${pvThumb(c)}" alt="${c.name}"><span>${c.name}</span>`;
    row.onclick = () => { sfx.uiClick(); selectChar(c, row); };
    list.appendChild(row);
    if (i === 0) firstRow = row;
  });
  // select AFTER generating all thumbs — otherwise the preview keeps the last one
  if (firstRow) selectChar(chars[0], firstRow);
  show('char-select');
}
function selectChar(c, row) {
  selChar = c;
  document.querySelectorAll('.char-row').forEach(r => r.classList.remove('sel'));
  row.classList.add('sel');
  pvSetChar(c);
  $('char-info-name').textContent = c.name;
  $('char-info-blurb').textContent = c.blurb;
}

/* ---------------- settings wiring ---------------- */
const sensEl = $('set-sens'), volEl = $('set-vol'), qualEl = $('set-quality');
sensEl.value = settings.sens; volEl.value = settings.vol; qualEl.value = settings.quality;
const updLabels = () => {
  $('set-sens-val').textContent = Number(settings.sens).toFixed(1);
  $('set-vol-val').textContent = Math.round(settings.vol * 100) + '%';
};
sensEl.oninput = () => { settings.sens = +sensEl.value; updLabels(); saveSettings(); };
volEl.oninput = () => { settings.vol = +volEl.value; sfx.setVolume(settings.vol); updLabels(); saveSettings(); };
qualEl.onchange = () => { settings.quality = qualEl.value; saveSettings(); if (game) game.applySettings(); };
const speechEl = $('set-speech');
speechEl.checked = settings.speech !== false;
speechEl.onchange = () => {
  settings.speech = speechEl.checked;
  sfx.speechEnabled = settings.speech;
  saveSettings();
  if (game?.el?.hudSpeech) game.el.hudSpeech.textContent = settings.speech ? '🔊' : '🔇';
};
updLabels();

/* ---------------- logo ---------------- */
// logo is now a static <img id="logo-img"> in index.html (see menu markup)

/* ---------------- loop ---------------- */
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  menuCam.aspect = innerWidth / innerHeight; menuCam.updateProjectionMatrix();
  if (game) game.onResize();
});
const clock = new THREE.Clock();
let menuAngle = 0;
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, clock.getDelta());
  if (game) {
    game.update(dt);
  } else {
    menuAngle += dt * 0.07;
    menuCam.position.set(Math.sin(menuAngle) * 34, 17 + Math.sin(menuAngle * 0.6) * 4, Math.cos(menuAngle) * 34);
    menuCam.lookAt(0, 1, 0);
    renderer.render(menuScene, menuCam);
    if (pv && pv.model && !$('char-select').classList.contains('hidden')) {
      pv.model.rotation.y += dt * 0.9;
      pv.r.render(pv.scene, pv.cam);
    }
  }
}
loop();

/* ---------------- boot ---------------- */
document.querySelector('.footnote').textContent =
  `v${VERSION} · Fictional, all in good fun. Designers vs Developers — no hard feelings.`;
show(isMobile && !testMode ? 'mobile-warning' : 'main-menu');
if (testMode && params.get('auto')) {
  const [team, char] = params.get('auto').split(',');
  startGame(team || 'P', char || CHARACTERS[0].id);
}
