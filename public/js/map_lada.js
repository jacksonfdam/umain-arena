// fy_lada — a Swedish farmyard (lantgård). Based on the original's fy_sitio
// (country estate: main house, orchard, gate + sign), re-themed with a big
// Falu-red barn (lada) as the dominant structure, a red cottage, a round silo,
// a parked tractor, an apple orchard, hay bales and a gated dirt yard.
// Same buildWorld contract.
import * as THREE from 'three';
import { createBuilder, buildNav, makeSpawns, mkTex, canvas, signTexture, createPickups } from './map_kit.js';

const HALF_X = 22, HALF_Z = 28;
const FALU = 0x8f3a2f, FALU_DK = 0x6f2c23, TRIM = 0xf2efe6;

function plankTex(base, dark) {
  const c = canvas(128), x = c.getContext('2d');
  x.fillStyle = '#' + base.toString(16).padStart(6, '0'); x.fillRect(0, 0, 128, 128);
  x.fillStyle = '#' + dark.toString(16).padStart(6, '0');
  for (let i = 0; i <= 128; i += 12) x.fillRect(i - 1, 0, 2, 128);   // vertical planks
  for (let i = 0; i < 40; i++) { x.globalAlpha = Math.random() * 0.12; x.fillRect(Math.random() * 128, Math.random() * 128, 10, 2); }
  x.globalAlpha = 1;
  return mkTex(c, 3, 2);
}
function dirtTex() {
  const c = canvas(256), x = c.getContext('2d');
  x.fillStyle = '#7c6a4e'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 700; i++) { x.fillStyle = ['#6b5a40', '#8a7657', '#5f8f3f', '#73623f'][(Math.random() * 4) | 0]; x.fillRect(Math.random() * 256, Math.random() * 256, 4, 4); }
  return mkTex(c, 14, 18);
}

export function buildMidLada(scene, T) {
  const root = new THREE.Group(); scene.add(root);
  const B = createBuilder(root);
  const lam = (o) => new THREE.MeshLambertMaterial(o);
  const MAT = {
    dirt: lam({ map: dirtTex() }), falu: lam({ map: plankTex(FALU, FALU_DK) }), faluDk: lam({ color: FALU_DK }),
    trim: lam({ color: TRIM }), roof: lam({ color: 0x3a3330 }), silo: lam({ color: 0xcfd2d6 }),
    wood: lam({ color: 0x8a6b48 }), hay: lam({ color: 0xd8bd5e }), tractor: lam({ color: 0x2e8b3f }),
    tyre: lam({ color: 0x1a1a1a }), leaf: lam({ color: 0x4f8a3a }), trunk: lam({ color: 0x6b4f2c }), apple: lam({ color: 0xd23b2e }),
  };

  // dirt/grass yard
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(HALF_X * 2 + 4, HALF_Z * 2 + 4), MAT.dirt);
  fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; root.add(fl);

  // perimeter fence (Falu-red)
  const fX = HALF_X + 0.5, fZ = HALF_Z + 0.5;
  B.addBox(HALF_X * 2 + 2, 3, 0.5, MAT.falu, 0, 0, -fZ);
  B.addBox(HALF_X * 2 + 2, 3, 0.5, MAT.falu, 0, 0, fZ);
  B.addBox(0.5, 3, HALF_Z * 2 + 2, MAT.falu, -fX, 0, 0);
  B.addBox(0.5, 3, HALF_Z * 2 + 2, MAT.falu, fX, 0, 0);

  // ---- the big red barn (lada) — dominant structure, walk around it ----
  function barn(cx, cz, w, d, ry = 0) {
    const wallH = 4.5;
    B.addBox(w, wallH, d, MAT.falu, cx, 0, cz, { ry, pad: -0.05 });
    B.addBox(w + 0.2, 0.4, d + 0.2, MAT.trim, cx, 0, cz, { ry, collide: false });        // base trim
    B.addBox(w + 0.2, 0.4, d + 0.2, MAT.trim, cx, wallH - 0.4, cz, { ry, collide: false }); // eave trim
    // white cross-brace on the gable face
    B.addBox(0.4, wallH, 0.15, MAT.trim, cx, 0, cz + (ry ? 0 : d / 2 + 0.05), { ry, collide: false });
    // pitched roof
    const rl = Math.hypot(d / 2, 1.8), ang = Math.atan2(1.8, d / 2);
    B.addBox(w + 0.6, 0.25, rl, MAT.roof, cx, wallH, cz + d / 4, { ry, rx: -ang, collide: false });
    B.addBox(w + 0.6, 0.25, rl, MAT.roof, cx, wallH, cz - d / 4, { ry, rx: ang, collide: false });
    // big dark barn door on the front
    B.addBox(w * 0.4, wallH * 0.7, 0.1, MAT.faluDk, cx, 0, cz + (ry ? 0 : d / 2 + 0.06), { ry, collide: false });
  }
  barn(-8, -6, 10, 8);

  // red cottage (stuga)
  function cottage(cx, cz, ry = 0) {
    const h = 3.0;
    B.addBox(5, h, 4, MAT.falu, cx, 0, cz, { ry, pad: -0.05 });
    B.addBox(5.4, 0.3, 4.4, MAT.trim, cx, h - 0.3, cz, { ry, collide: false });
    const rl = Math.hypot(2, 1.2), ang = Math.atan2(1.2, 2);
    B.addBox(5.6, 0.2, rl, MAT.roof, cx, h, cz + 1, { ry, rx: -ang, collide: false });
    B.addBox(5.6, 0.2, rl, MAT.roof, cx, h, cz - 1, { ry, rx: ang, collide: false });
    B.addPlane(0.9, 0.9, lam({ color: 0x1f6fb2 }), cx, 1.6, cz + (ry ? 0 : 2.03), ry, 0);   // window
  }
  cottage(11, 8);

  // round grain silo (cylinder, cover)
  { const silo = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 8, 16), MAT.silo);
    silo.position.set(-13, 4, -18); silo.castShadow = true; root.add(silo);
    B.addCollider(silo, -15, -11, 0, 8, -20, -16);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(2.0, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), MAT.silo);
    dome.position.set(-13, 8, -18); root.add(dome); }

  // parked tractor (boxes) — low cover
  { const tx = 6, tz = -14;
    B.addBox(1.8, 1.2, 3.2, MAT.tractor, tx, 0.5, tz, { });
    B.addBox(1.4, 1.1, 1.4, MAT.tractor, tx, 1.7, tz - 0.6, { collide: false });   // cab
    for (const [wx, wz, r] of [[-1, 1.1, 0.55], [1, 1.1, 0.55], [-1, -1.1, 0.9], [1, -1.1, 0.9]]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.4, 12), MAT.tyre);
      w.rotation.z = Math.PI / 2; w.position.set(tx + wx, r, tz + wz); root.add(w);
    }
  }

  // apple orchard (mid cover)
  function tree(cx, cz) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 2.6, 8), MAT.trunk);
    trunk.position.set(cx, 1.3, cz); trunk.castShadow = true; root.add(trunk);
    B.addCollider(trunk, cx - 0.4, cx + 0.4, 0, 1.4, cz - 0.4, cz + 0.4);
    for (const [dy, r] of [[2.8, 1.8], [3.7, 1.3]]) { const c = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), MAT.leaf); c.position.set(cx, dy, cz); c.castShadow = true; root.add(c); }
    for (let i = 0; i < 5; i++) { const a = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), MAT.apple); a.position.set(cx + (Math.random() - .5) * 2, 2.6 + Math.random(), cz + (Math.random() - .5) * 2); root.add(a); }
  }
  for (const [x, z] of [[13, -6], [16, -12], [10, -20], [17, 16], [13, 20], [-18, 10], [-14, 16]]) tree(x, z);

  // hay bales (low cover)
  for (const [hx, hz] of [[2, 4], [-2, 10], [4, 18], [-6, 20], [-18, -8]]) {
    const bale = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.4, 12), MAT.hay);
    bale.rotation.z = Math.PI / 2; bale.position.set(hx, 0.7, hz); bale.castShadow = true; root.add(bale);
    B.addCollider(bale, hx - 1.0, hx + 1.0, 0, 1.4, hz - 1.0, hz + 1.0);
  }

  // gate posts + sign at the north end
  for (const gx of [-3, 3]) B.addBox(0.6, 4, 0.6, MAT.wood, gx, 0, HALF_Z - 2);
  B.addPlane(6, 1.4, signTexture('#6f2c23', '#f2efe6', 'LANTGÅRD', 'FÄRILA 43'), 0, 4.2, HALF_Z - 2, Math.PI);

  // end signage
  for (const s of [1, -1]) {
    const label = s < 0 ? signTexture('#c62f2f', '#ffffff', 'DESIGNERS', 'FARMYARD')
                        : signTexture('#1faa4d', '#ffd23f', 'DEVELOPERS', 'FARMYARD');
    B.addPlane(8, 2.4, label, 0, 2.4, (HALF_Z - 0.4) * s, s < 0 ? 0 : Math.PI);
  }

  // pickups
  const { pickups, place } = createPickups(root);
  const RIFLES = ['awp', 'ak', 'm4', 'shotgun', 'mp5'];
  RIFLES.forEach((k, i) => { const a = (i / RIFLES.length) * Math.PI * 2; place(k, Math.cos(a) * 5, Math.sin(a) * 5, a); });
  for (const s of [-1, 1]) ['deagle', 'pistol', 'shotgun', 'pistol', 'deagle'].forEach((k, i) => place(k, [-8, -4, 0, 4, 8][i], (HALF_Z - 9) * s, s > 0 ? Math.PI : 0));
  place('awp', -16, 4); place('awp', 15, 0);

  // lighting — golden late-afternoon farm light
  scene.background = T.sky; scene.fog = new THREE.Fog(0xe6e0cf, 70, 160);
  const hemi = new THREE.HemisphereLight(0xfff0d0, 0x6f7a4f, 1.15); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe6a8, 1.5); sun.position.set(-20, 28, -16); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -56; sun.shadow.camera.right = 56; sun.shadow.camera.top = 56; sun.shadow.camera.bottom = -56;
  sun.shadow.camera.far = 150; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; scene.add(sun);
  const fill = new THREE.DirectionalLight(0xbfe0ff, 0.35); fill.position.set(20, 24, 16); scene.add(fill);

  const groundHeightAt = () => 0;
  const nav = buildNav({ colliders: B.colliders, halfX: HALF_X, halfZ: HALF_Z });
  return {
    root, colliders: B.colliders, occluders: B.occluders, groundHeightAt, sun, hemi, pickups,
    spawns: makeSpawns(HALF_Z),
    waypoints: { nodes: nav.nodes, adj: nav.adj }, nearestWaypoint: nav.nearestWaypoint, findPath: nav.findPath,
    bounds: { minX: -HALF_X + 0.5, maxX: HALF_X - 0.5, minZ: -HALF_Z + 0.5, maxZ: HALF_Z - 0.5 },
  };
}
