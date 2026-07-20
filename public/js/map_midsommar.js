// fy_midsommar — a Swedish midsummer meadow (Umain HQ is in Sweden).
// Open sunlit field for long AWP duels, a maypole (midsommarstång) landmark in
// the center, Falu-red cabins and birch groves for cover, hay bales and a long
// lunch table, and a shallow lake in one corner you have to wade through.
// Same buildWorld contract as map.js / map_pool_day.js.
import * as THREE from 'three';

const HALF_X = 22, HALF_Z = 30;   // outdoor half-extents (fence sits just outside)
const FENCE_H = 3.2;

// Swedish midsummer palette
const FALU = 0x8f3a2f;            // Falu red (falu rödfärg)
const FALU_DK = 0x6f2c23;
const TRIM = 0xf2efe6;            // white cabin trim
const BLÅ = 0x006aa7;            // Swedish flag blue
const GUL = 0xfecc00;            // Swedish flag yellow

function mkTex(c, rx = 1, rz = 1, clamp = false) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  t.repeat.set(rx, rz);
  return t;
}
function meadowTex() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#4f8a3a'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) {                       // grass speckle
    const g = ['#5a9a3e', '#457f32', '#6fae4a', '#3f7530'][(Math.random() * 4) | 0];
    x.fillStyle = g; x.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
  }
  for (let i = 0; i < 90; i++) {                        // wildflowers (yellow/white/blue)
    x.fillStyle = ['#fde047', '#f8fafc', '#7dd3fc'][(Math.random() * 3) | 0];
    x.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
  }
  return mkTex(c, 14, 20);
}
function plankTex(base, dark) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#' + base.toString(16).padStart(6, '0'); x.fillRect(0, 0, 128, 128);
  x.fillStyle = '#' + dark.toString(16).padStart(6, '0');
  for (let i = 0; i <= 128; i += 16) x.fillRect(0, i - 1, 128, 2);   // horizontal plank seams
  for (let i = 0; i < 60; i++) { x.globalAlpha = Math.random() * 0.12; x.fillRect(Math.random() * 128, Math.random() * 128, 2, 10); }
  x.globalAlpha = 1;
  return mkTex(c, 3, 2);
}
function birchTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d');
  x.fillStyle = '#f0ece2'; x.fillRect(0, 0, 64, 64);
  x.fillStyle = '#2a2a2a';
  for (let i = 0; i < 10; i++) x.fillRect(Math.random() * 64, Math.random() * 64, 6 + Math.random() * 10, 3);
  return mkTex(c, 1, 3);
}
function signTexture(bg, fg, title, sub) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, 512, 128);
  x.strokeStyle = fg; x.lineWidth = 8; x.strokeRect(6, 6, 500, 116);
  x.textAlign = 'center'; x.fillStyle = fg;
  x.font = 'bold 44px "Arial Black",Impact,sans-serif'; x.fillText(title, 256, 60);
  if (sub) { x.font = 'bold 20px Arial,sans-serif'; x.fillText(sub, 256, 96); }
  return mkTex(c, 1, 1, true);
}

export function buildMidsommar(scene, T) {
  const colliders = [];
  const occluders = [];
  const pickups = [];
  const root = new THREE.Group();
  scene.add(root);

  const lam = (opts) => new THREE.MeshLambertMaterial(opts);
  function addBox(w, h, d, mat, x, y, z, opts = {}) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y + h / 2, z);
    m.castShadow = opts.cast !== false; m.receiveShadow = true;
    // 'YXZ' applies yaw before pitch (matrix Ry·Rx): a roof slab is pitched in the cabin's local
    // frame, then the cabin is yawed about world Y. Default 'XYZ' applied pitch after the yaw, so
    // 90°-yawed cabins (ry = π/2) rendered a flat/inverted roof.
    if (opts.rx || opts.ry || opts.rz) {
      m.rotation.order = 'YXZ';
      m.rotation.set(opts.rx || 0, opts.ry || 0, opts.rz || 0);
    }
    root.add(m);
    if (opts.collide !== false) {
      const pad = opts.pad || 0;
      const ex = (opts.ry || opts.rz) ? Math.max(w, d) / 2 : w / 2;
      const ez = (opts.ry || opts.rz) ? Math.max(w, d) / 2 : d / 2;
      colliders.push({ minX: x - ex - pad, maxX: x + ex + pad, minY: y, maxY: y + h, minZ: z - ez - pad, maxZ: z + ez + pad });
      occluders.push(m);
    }
    return m;
  }
  function addPlane(w, h, mat, x, y, z, ry = 0, rx = 0) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z); m.rotation.y = ry; m.rotation.x = rx;
    m.receiveShadow = true; root.add(m); return m;
  }

  const TEX = { meadow: meadowTex(), falu: plankTex(FALU, FALU_DK), birch: birchTex() };
  const MAT = {
    grass: lam({ map: TEX.meadow }), falu: lam({ map: TEX.falu }),
    faluDk: lam({ color: FALU_DK }), trim: lam({ color: TRIM }),
    birch: lam({ map: TEX.birch }), leaf: lam({ color: 0x5a9a3e }), leafDk: lam({ color: 0x457f32 }),
    wood: lam({ color: 0x8a6b48 }), woodDk: lam({ color: 0x6b4f2c }),
    hay: lam({ color: 0xd8bd5e }), stone: lam({ color: 0x9a938a }),
    blue: lam({ color: BLÅ }), yellow: lam({ color: GUL }),
  };

  /* ---------------- meadow floor ---------------- */
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(HALF_X * 2 + 6, HALF_Z * 2 + 6), MAT.grass);
    m.rotation.x = -Math.PI / 2; m.position.y = 0; m.receiveShadow = true; root.add(m); }

  /* ---------------- shallow lake (NE corner) — you wade through it ---------------- */
  const LAKE = { cx: HALF_X - 7, cz: HALF_Z - 9, hx: 6, hz: 7 };
  { const w = new THREE.Mesh(new THREE.PlaneGeometry(LAKE.hx * 2, LAKE.hz * 2),
      lam({ color: 0x2f8fd0, transparent: true, opacity: 0.82 }));
    w.rotation.x = -Math.PI / 2; w.position.set(LAKE.cx, 0.04, LAKE.cz); root.add(w);
    // reeds / stones around the shore (low, non-colliding)
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2, rx = LAKE.hx + 0.6, rz = LAKE.hz + 0.6;
      addBox(0.5, 0.35, 0.5, MAT.stone, LAKE.cx + Math.cos(a) * rx, 0, LAKE.cz + Math.sin(a) * rz, { collide: false });
    }
  }
  const inLake = (x, z) => Math.abs(x - LAKE.cx) < LAKE.hx && Math.abs(z - LAKE.cz) < LAKE.hz;

  /* ---------------- perimeter fence (Falu-red pickets) ---------------- */
  const fX = HALF_X + 0.5, fZ = HALF_Z + 0.5;
  addBox(HALF_X * 2 + 2, FENCE_H, 0.5, MAT.falu, 0, 0, -fZ);
  addBox(HALF_X * 2 + 2, FENCE_H, 0.5, MAT.falu, 0, 0, fZ);
  addBox(0.5, FENCE_H, HALF_Z * 2 + 2, MAT.falu, -fX, 0, 0);
  addBox(0.5, FENCE_H, HALF_Z * 2 + 2, MAT.falu, fX, 0, 0);
  // white fence caps
  for (const [w, d, x, z] of [[HALF_X * 2 + 2, 0.2, 0, -fZ], [HALF_X * 2 + 2, 0.2, 0, fZ], [0.2, HALF_Z * 2 + 2, -fX, 0], [0.2, HALF_Z * 2 + 2, fX, 0]])
    addBox(w, 0.25, d, MAT.trim, x, FENCE_H, z, { collide: false });

  /* ---------------- maypole (midsommarstång) — central landmark + cover ---------------- */
  function maypole(cx, cz) {
    const H = 8.5;
    // planter base = the cover
    addBox(2.2, 0.7, 2.2, MAT.stone, cx, 0, cz, { pad: -0.1 });
    // greenery-wrapped pole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, H, 10), MAT.leafDk);
    pole.position.set(cx, 0.7 + H / 2, cz); pole.castShadow = true; root.add(pole);
    // horizontal cross arm near the top
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 5.4, 8), MAT.leafDk);
    arm.rotation.z = Math.PI / 2; arm.position.set(cx, 0.7 + H - 1.2, cz); root.add(arm);
    // the two hanging wreaths (rings)
    for (const sx of [-1, 1]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.16, 8, 20), MAT.leaf);
      ring.position.set(cx + sx * 2.2, 0.7 + H - 2.3, cz); root.add(ring);
    }
    // blue & yellow ribbons streaming down from the crossarm
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3.2, 0.12), i % 2 ? MAT.blue : MAT.yellow);
      rib.position.set(cx + Math.cos(a) * 0.5, 0.7 + H - 2.6, cz + Math.sin(a) * 0.5);
      rib.rotation.y = a; rib.rotation.x = 0.12; root.add(rib);
    }
  }
  maypole(0, 0);

  /* ---------------- Falu-red cabins (stugor) — hard cover / sightline breakers ---------------- */
  function cabin(cx, cz, w, d, ry = 0) {
    const wallH = 3.2;
    addBox(w, wallH, d, MAT.falu, cx, 0, cz, { ry, pad: -0.05 });
    // white corner trim
    addBox(w + 0.15, 0.3, d + 0.15, MAT.trim, cx, 0, cz, { ry, collide: false });
    addBox(w + 0.15, 0.3, d + 0.15, MAT.trim, cx, wallH - 0.3, cz, { ry, collide: false });
    // pitched roof (two slabs) — offset along the house's yawed local axis
    const rl = Math.hypot(d / 2, 1.3);
    const ang = Math.atan2(1.3, d / 2);
    const ox = Math.sin(ry) * (d / 4), oz = Math.cos(ry) * (d / 4);
    addBox(w + 0.5, 0.2, rl, MAT.woodDk, cx + ox, wallH, cz + oz, { ry, rx: ang, collide: false });
    addBox(w + 0.5, 0.2, rl, MAT.woodDk, cx - ox, wallH, cz - oz, { ry, rx: -ang, collide: false });
    // window
    addPlane(0.9, 0.9, MAT.blue, cx, 1.7, cz + (ry ? 0 : d / 2 + 0.03), ry, 0);
  }
  cabin(-13, 8, 5, 4);
  cabin(13, -8, 5, 4);
  cabin(-11, -15, 4, 3.5, Math.PI / 2);
  cabin(11, 15, 4, 3.5, Math.PI / 2);

  /* ---------------- birch groves — mid cover ---------------- */
  function birch(cx, cz) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 4.2, 8), MAT.birch);
    trunk.position.set(cx, 2.1, cz); trunk.castShadow = true; root.add(trunk);
    colliders.push({ minX: cx - 0.35, maxX: cx + 0.35, minY: 0, maxY: 2.2, minZ: cz - 0.35, maxZ: cz + 0.35 });
    occluders.push(trunk);
    for (const [dy, r] of [[4.2, 1.7], [5.2, 1.3], [6.0, 0.85]]) {
      const c = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), Math.random() < 0.5 ? MAT.leaf : MAT.leafDk);
      c.position.set(cx, dy, cz); c.castShadow = true; root.add(c);
    }
  }
  for (const [x, z] of [[-6, 18], [-3, 20], [6, -18], [3, -20], [-18, -2], [18, 2], [-8, -6], [8, 6], [16, -18]]) birch(x, z);

  /* ---------------- long midsummer lunch table (low cover, near center) ---------------- */
  for (const s of [-1, 1]) {
    const tz = s * 6;
    addBox(1.6, 0.8, 6, MAT.wood, s * 5, 0, tz, { });
    addBox(1.6, 0.45, 6, MAT.woodDk, s * 5, 0, tz + 1.1, { collide: false }); // bench
    addBox(1.6, 0.45, 6, MAT.woodDk, s * 5, 0, tz - 1.1, { collide: false });
  }

  /* ---------------- hay bales (round, low cover) scattered ---------------- */
  for (const [hx, hz] of [[-16, 12], [16, -12], [-9, 2], [9, -2], [0, 20], [0, -20], [-19, 18], [19, -18]]) {
    const bale = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.4, 12), MAT.hay);
    bale.rotation.z = Math.PI / 2; bale.position.set(hx, 0.7, hz); bale.castShadow = true; bale.receiveShadow = true; root.add(bale);
    colliders.push({ minX: hx - 1.0, maxX: hx + 1.0, minY: 0, maxY: 1.4, minZ: hz - 1.0, maxZ: hz + 1.0 });
    occluders.push(bale);
  }

  /* ---------------- spawns' end signage ---------------- */
  for (const s of [1, -1]) {
    const label = s < 0 ? signTexture('#c62f2f', '#ffffff', 'DESIGNERS', 'MIDSUMMER CAMP')
                        : signTexture('#1faa4d', '#ffd23f', 'DEVELOPERS', 'MIDSUMMER CAMP');
    addPlane(9, 2.6, label, 0, 2.3, (HALF_Z - 0.4) * s, s < 0 ? 0 : Math.PI);
  }

  /* ---------------- weapons on the grass (fy-style) ---------------- */
  const GM = { black: lam({ color: 0x1b1d21 }), steel: lam({ color: 0x9aa0a6 }), wood: lam({ color: 0x7a5326 }), tan: lam({ color: 0xb39a63 }), green: lam({ color: 0x16432a }) };
  const box = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return m; };
  const cyl = (r, len, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), mat); m.rotation.x = Math.PI / 2; m.position.set(x, y, z); return m; };
  function buildGun(kind, x, z, yaw) {
    const g = new THREE.Group(); const add = (...ms) => ms.forEach(m => g.add(m));
    switch (kind) {
      case 'awp': add(box(0.11, 0.1, 1.35, GM.green, 0, 0.09, 0.05), box(0.11, 0.16, 0.36, GM.green, 0, 0.1, 0.6), cyl(0.05, 0.36, GM.black, 0, 0.19, 0.05), box(0.08, 0.18, 0.16, GM.black, 0, 0.03, -0.15)); break;
      case 'ak': add(box(0.1, 0.1, 1.05, GM.black, 0, 0.09, 0), box(0.11, 0.13, 0.34, GM.wood, 0, 0.1, 0.46), box(0.11, 0.12, 0.24, GM.wood, 0, 0.1, -0.12), box(0.09, 0.24, 0.14, GM.black, 0, -0.02, -0.02)); break;
      case 'm4': add(box(0.09, 0.1, 1.0, GM.black, 0, 0.09, 0), box(0.1, 0.14, 0.32, GM.black, 0, 0.1, 0.45), box(0.08, 0.06, 0.3, GM.black, 0, 0.17, 0.02), box(0.08, 0.2, 0.13, GM.black, 0, 0, -0.05)); break;
      case 'mp5': add(box(0.09, 0.11, 0.62, GM.black, 0, 0.09, 0), box(0.09, 0.1, 0.22, GM.black, 0, 0.09, 0.36), box(0.07, 0.22, 0.1, GM.black, 0, 0, -0.02)); break;
      case 'shotgun': add(box(0.1, 0.11, 1.0, GM.black, 0, 0.11, 0), box(0.1, 0.09, 0.9, GM.wood, 0, 0.02, 0.02), box(0.11, 0.15, 0.34, GM.wood, 0, 0.1, 0.5)); break;
      case 'deagle': add(box(0.09, 0.13, 0.4, GM.steel, 0, 0.1, 0), box(0.09, 0.2, 0.11, GM.tan, 0, 0.02, 0.15)); break;
      default: add(box(0.08, 0.12, 0.3, GM.black, 0, 0.09, 0), box(0.08, 0.16, 0.1, GM.black, 0, 0.03, 0.11));
    }
    g.position.set(x, 0.02, z); g.rotation.y = yaw; g.traverse(o => { if (o.isMesh) o.castShadow = true; }); root.add(g); return g;
  }
  const place = (kind, x, z, yaw) => { const mesh = buildGun(kind, x, z, yaw); pickups.push({ x, z, kind, weapon: kind, readyAt: 0, mesh }); };
  // rifles around the maypole, pistols/shotguns toward the ends
  const RIFLES = ['awp', 'ak', 'm4', 'shotgun', 'mp5'];
  RIFLES.forEach((k, i) => { const a = (i / RIFLES.length) * Math.PI * 2; place(k, Math.cos(a) * 6, Math.sin(a) * 6, a); });
  for (const s of [-1, 1]) ['deagle', 'pistol', 'shotgun', 'pistol', 'deagle'].forEach((k, i) => place(k, [-8, -4, 0, 4, 8][i], (HALF_Z - 9) * s, s > 0 ? Math.PI : 0));
  place('awp', -14, 5, 0); place('awp', 14, -5, 0);

  /* ---------------- lighting: bright, long Nordic summer daylight ---------------- */
  scene.background = T.sky;
  scene.fog = new THREE.Fog(0xcfe6f2, 60, 150);
  const hemi = new THREE.HemisphereLight(0xfff3d6, 0x6f8f52, 1.15);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2cc, 1.5);   // warm low midsummer sun
  sun.position.set(-24, 30, 18); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -60; sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -60;
  sun.shadow.camera.far = 160; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xbfe0ff, 0.4);
  fill.position.set(20, 25, -18); scene.add(fill);

  /* ---------------- flat ground ---------------- */
  function groundHeightAt() { return 0; }
  function slowAt(x, z) { return inLake(x, z); }   // wading through the lake slows you

  /* ---------------- waypoints ---------------- */
  const nodes = [], adj = [];
  const STEP = 3.6;
  const blocked = (x, z, inflate) => {
    for (const c of colliders) {
      if (x > c.minX - inflate && x < c.maxX + inflate && z > c.minZ - inflate && z < c.maxZ + inflate && c.minY < 1.6 && c.maxY > 0.15) return true;
    }
    return false;
  };
  for (let gx = -HALF_X + 2; gx <= HALF_X - 2; gx += STEP)
    for (let gz = -HALF_Z + 2; gz <= HALF_Z - 2; gz += STEP)
      if (!blocked(gx, gz, 0.5)) nodes.push({ x: gx, z: gz });
  const segClear = (a, b) => {
    for (let i = 1; i < 6; i++) {
      const t = i / 6, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
      if (blocked(x, z, 0.25)) return false;
    }
    return true;
  };
  for (let i = 0; i < nodes.length; i++) {
    adj.push([]);
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const dx = nodes[i].x - nodes[j].x, dz = nodes[i].z - nodes[j].z, d2 = dx * dx + dz * dz;
      if (d2 < STEP * STEP * 2.4 && segClear(nodes[i], nodes[j])) adj[i].push(j);
    }
  }
  function nearestWaypoint(x, z) { let best = 0, bd = 1e9; for (let i = 0; i < nodes.length; i++) { const dx = nodes[i].x - x, dz = nodes[i].z - z, d = dx * dx + dz * dz; if (d < bd) { bd = d; best = i; } } return best; }
  function findPath(fromIdx, toIdx) {
    if (fromIdx === toIdx) return [toIdx];
    const prev = new Int16Array(nodes.length).fill(-1);
    const q = [fromIdx]; prev[fromIdx] = fromIdx;
    while (q.length) {
      const n = q.shift();
      for (const m of adj[n]) if (prev[m] === -1) {
        prev[m] = n;
        if (m === toIdx) { const path = [m]; let c = n; while (c !== fromIdx) { path.unshift(c); c = prev[c]; } path.unshift(fromIdx); return path; }
        q.push(m);
      }
    }
    return [fromIdx];
  }

  // spawns at the two ends
  const mk = s => [-6, -2, 2, 6].map(x => ({ x, z: (HALF_Z - 4) * s, yaw: s < 0 ? 0 : Math.PI }));
  const spawns = { P: mk(-1), B: mk(1) };

  return {
    root, colliders, occluders, groundHeightAt, slowAt, spawns, sun, hemi, pickups,
    waypoints: { nodes, adj }, nearestWaypoint, findPath,
    bounds: { minX: -HALF_X + 0.5, maxX: HALF_X - 0.5, minZ: -HALF_Z + 0.5, maxZ: HALF_Z - 0.5 },
  };
}
