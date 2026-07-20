// Shared helpers for building arenas — box/plane factory, nav-graph generation
// and spawn placement. Keeps the buildWorld contract identical across maps while
// cutting the boilerplate each map would otherwise repeat. Zero deps beyond THREE.
import * as THREE from 'three';

// A scene builder bound to one root Group. addBox registers colliders/occluders
// unless opts.collide === false; addPlane is decoration only.
export function createBuilder(root) {
  const colliders = [];
  const occluders = [];
  function addBox(w, h, d, mat, x, y, z, opts = {}) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y + h / 2, z);
    m.castShadow = opts.cast !== false; m.receiveShadow = true;
    // 'YXZ' order applies yaw (Y) before pitch (X), giving matrix Ry·Rx — i.e. a roof slab is
    // pitched in the house's LOCAL frame, then the house is yawed about world Y. With the default
    // 'XYZ' order the pitch was applied after the yaw, so a 90°-yawed slab (ry = π/2) had its
    // pitch land on the ridge axis and rendered flat. Single-axis callers are unaffected.
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
  // manual collider (for cylinders/spheres added outside addBox)
  function addCollider(mesh, minX, maxX, minY, maxY, minZ, maxZ) {
    colliders.push({ minX, maxX, minY, maxY, minZ, maxZ });
    if (mesh) occluders.push(mesh);
  }
  return { colliders, occluders, addBox, addPlane, addCollider };
}

// Build a walkable waypoint graph over a rectangular arena, routing around the
// given colliders. groundHeightAt lets sloped/recessed maps exclude unreachable
// cells. Returns nodes + adjacency + nearestWaypoint + BFS findPath.
export function buildNav({ colliders, halfX, halfZ, step = 3.6, groundHeightAt = () => 0, minGround = -0.35, heightTol = 0.65 }) {
  const nodes = [], adj = [];
  const blocked = (x, z, inflate) => {
    const g = groundHeightAt(x, z);
    for (const c of colliders) {
      if (x > c.minX - inflate && x < c.maxX + inflate && z > c.minZ - inflate && z < c.maxZ + inflate && c.minY < g + heightTol + 0.95 && c.maxY > g + 0.15) return true;
    }
    return false;
  };
  for (let gx = -halfX + 2; gx <= halfX - 2; gx += step)
    for (let gz = -halfZ + 2; gz <= halfZ - 2; gz += step)
      if (!blocked(gx, gz, 0.5) && groundHeightAt(gx, gz) > minGround) nodes.push({ x: gx, z: gz });
  const segClear = (a, b) => {
    for (let i = 1; i < 6; i++) {
      const t = i / 6, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
      if (blocked(x, z, 0.25)) return false;
      if (Math.abs(groundHeightAt(x, z) - groundHeightAt(a.x, a.z)) > heightTol) return false;
    }
    return true;
  };
  for (let i = 0; i < nodes.length; i++) {
    adj.push([]);
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const dx = nodes[i].x - nodes[j].x, dz = nodes[i].z - nodes[j].z, d2 = dx * dx + dz * dz;
      if (d2 < step * step * 2.4 && segClear(nodes[i], nodes[j])) adj[i].push(j);
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
  return { nodes, adj, nearestWaypoint, findPath };
}

// Two teams spawning at the ±Z ends. P (Designers) south, B (Developers) north.
export function makeSpawns(halfZ, inset = 4, xs = [-6, -2, 2, 6]) {
  const mk = s => xs.map(x => ({ x, z: (halfZ - inset) * s, yaw: s < 0 ? 0 : Math.PI }));
  return { P: mk(-1), B: mk(1) };
}

// Small inline procedural texture helpers reused across maps.
export function mkTex(c, rx = 1, rz = 1, clamp = false) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  t.repeat.set(rx, rz);
  return t;
}
export function canvas(w, h = w) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
export function signTexture(bg, fg, title, sub) {
  const c = canvas(512, 128), x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, 512, 128);
  x.strokeStyle = fg; x.lineWidth = 8; x.strokeRect(6, 6, 500, 116);
  x.textAlign = 'center'; x.fillStyle = fg;
  x.font = 'bold 44px "Arial Black",Impact,sans-serif'; x.fillText(title, 256, 60);
  if (sub) { x.font = 'bold 20px Arial,sans-serif'; x.fillText(sub, 256, 96); }
  return mkTex(c, 1, 1, true);
}

// fy-style ground weapons. Returns { pickups, place } — place(kind,x,z,yaw)
// drops a crude gun mesh and records the pickup. Same gun shapes as fy_pool_day.
export function createPickups(root) {
  const lam = (o) => new THREE.MeshLambertMaterial(o);
  const GM = { black: lam({ color: 0x1b1d21 }), steel: lam({ color: 0x9aa0a6 }), wood: lam({ color: 0x7a5326 }), tan: lam({ color: 0xb39a63 }), green: lam({ color: 0x16432a }) };
  const box = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return m; };
  const cyl = (r, len, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), mat); m.rotation.x = Math.PI / 2; m.position.set(x, y, z); return m; };
  const pickups = [];
  function buildGun(kind, x, z, yaw) {
    const g = new THREE.Group(); const add = (...ms) => ms.forEach(m => g.add(m));
    switch (kind) {
      case 'awp': add(box(0.11, 0.1, 1.35, GM.green, 0, 0.09, 0.05), box(0.11, 0.16, 0.36, GM.green, 0, 0.1, 0.6), cyl(0.05, 0.36, GM.black, 0, 0.19, 0.05), box(0.08, 0.18, 0.16, GM.black, 0, 0.03, -0.15)); break;
      case 'ak': add(box(0.1, 0.1, 1.05, GM.black, 0, 0.09, 0), box(0.11, 0.13, 0.34, GM.wood, 0, 0.1, 0.46), box(0.11, 0.12, 0.24, GM.wood, 0, 0.1, -0.12), box(0.09, 0.24, 0.14, GM.black, 0, -0.02, -0.02)); break;
      case 'm4': add(box(0.09, 0.1, 1.0, GM.black, 0, 0.09, 0), box(0.1, 0.14, 0.32, GM.black, 0, 0.1, 0.45), box(0.08, 0.06, 0.3, GM.black, 0, 0.17, 0.02), box(0.08, 0.2, 0.13, GM.black, 0, 0, -0.05)); break;
      case 'mp5': add(box(0.09, 0.11, 0.62, GM.black, 0, 0.09, 0), box(0.09, 0.1, 0.22, GM.black, 0, 0.09, 0.36), box(0.07, 0.22, 0.1, GM.black, 0, 0, -0.02)); break;
      case 'shotgun': add(box(0.1, 0.11, 1.0, GM.black, 0, 0.11, 0), box(0.1, 0.09, 0.9, GM.wood, 0, 0.02, 0.02), box(0.11, 0.15, 0.34, GM.wood, 0, 0.1, 0.5)); break;
      case 'scout': add(box(0.09, 0.09, 1.25, GM.green, 0, 0.09, 0.05), box(0.1, 0.14, 0.32, GM.black, 0, 0.1, 0.55), cyl(0.045, 0.3, GM.black, 0, 0.18, 0.0), box(0.08, 0.16, 0.14, GM.black, 0, 0.03, -0.12)); break;
      case 'famas': add(box(0.1, 0.11, 0.9, GM.black, 0, 0.09, 0), box(0.09, 0.13, 0.28, GM.black, 0, 0.1, 0.42), box(0.08, 0.22, 0.12, GM.black, 0, -0.01, -0.05)); break;
      case 'galil': add(box(0.1, 0.1, 1.0, GM.black, 0, 0.09, 0), box(0.11, 0.13, 0.3, GM.black, 0, 0.1, 0.45), box(0.1, 0.26, 0.14, GM.black, 0, -0.03, -0.02)); break;
      case 'aug': add(box(0.11, 0.13, 0.95, GM.tan, 0, 0.1, 0), box(0.11, 0.14, 0.3, GM.tan, 0, 0.1, -0.18), cyl(0.04, 0.24, GM.black, 0, 0.2, 0.1), box(0.1, 0.24, 0.14, GM.black, 0, -0.02, 0.1)); break;
      case 'sg552': add(box(0.1, 0.11, 1.0, GM.black, 0, 0.09, 0), box(0.11, 0.13, 0.3, GM.black, 0, 0.1, 0.45), cyl(0.038, 0.2, GM.black, 0, 0.19, 0.05), box(0.1, 0.24, 0.14, GM.black, 0, -0.03, -0.02)); break;
      case 'p90': add(box(0.11, 0.12, 0.66, GM.black, 0, 0.1, 0), box(0.09, 0.06, 0.4, GM.steel, 0, 0.17, 0.02), box(0.08, 0.2, 0.12, GM.black, 0, 0, -0.05)); break;
      case 'mac10': add(box(0.09, 0.12, 0.5, GM.black, 0, 0.1, 0), box(0.08, 0.24, 0.1, GM.black, 0, -0.02, 0.02)); break;
      case 'ump': add(box(0.09, 0.11, 0.72, GM.black, 0, 0.09, 0), box(0.09, 0.1, 0.24, GM.black, 0, 0.09, 0.4), box(0.08, 0.22, 0.11, GM.black, 0, 0, -0.02)); break;
      case 'm249': add(box(0.12, 0.13, 1.15, GM.black, 0, 0.11, 0), box(0.14, 0.18, 0.22, GM.black, 0, 0.06, -0.05), box(0.11, 0.13, 0.3, GM.black, 0, 0.11, 0.5)); break;
      case 'deagle': add(box(0.09, 0.13, 0.4, GM.steel, 0, 0.1, 0), box(0.09, 0.2, 0.11, GM.tan, 0, 0.02, 0.15)); break;
      case 'usp': add(box(0.08, 0.12, 0.34, GM.black, 0, 0.1, 0), cyl(0.035, 0.14, GM.black, 0, 0.11, 0.22), box(0.08, 0.18, 0.1, GM.black, 0, 0.02, -0.11)); break;
      case 'glock': add(box(0.08, 0.13, 0.3, GM.black, 0, 0.1, 0), box(0.08, 0.18, 0.1, GM.black, 0, 0.02, -0.09)); break;
      case 'elite': add(box(0.07, 0.12, 0.3, GM.steel, -0.08, 0.1, 0), box(0.07, 0.16, 0.09, GM.black, -0.08, 0.02, -0.09), box(0.07, 0.12, 0.3, GM.steel, 0.08, 0.1, 0), box(0.07, 0.16, 0.09, GM.black, 0.08, 0.02, -0.09)); break;
      case 'he': add(box(0.14, 0.2, 0.14, GM.green, 0, 0.11, 0)); break;
      case 'flash': add(box(0.13, 0.19, 0.13, GM.steel, 0, 0.11, 0)); break;
      case 'smoke': add(box(0.14, 0.2, 0.14, lam({ color: 0x8a9098 }), 0, 0.11, 0)); break;
      default: add(box(0.08, 0.12, 0.3, GM.black, 0, 0.09, 0), box(0.08, 0.16, 0.1, GM.black, 0, 0.03, 0.11));
    }
    g.position.set(x, 0.02, z); g.rotation.y = yaw; g.traverse(o => { if (o.isMesh) o.castShadow = true; }); root.add(g); return g;
  }
  const place = (kind, x, z, yaw = 0) => { const mesh = buildGun(kind, x, z, yaw); pickups.push({ x, z, kind, weapon: kind, readyAt: 0, mesh }); };
  return { pickups, place };
}

// Shared arsenal so every arena offers the same variety of pickups.
export const PICKUP_PRIMARIES = ['awp', 'scout', 'ak', 'm4', 'famas', 'galil', 'aug', 'sg552', 'mp5', 'p90', 'mac10', 'ump', 'm249', 'shotgun'];
export const PICKUP_SECONDARIES = ['deagle', 'usp', 'glock', 'elite'];
export const PICKUP_GRENADES = ['he', 'flash', 'smoke'];
