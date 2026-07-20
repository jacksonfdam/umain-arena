// de_moderna — a Nordic art-museum plaza. Based on the original's fy_masp (a
// raised gallery slab on pillars with an open span underneath), re-themed as a
// Scandinavian modernist museum: a white concrete-and-glass gallery box floating
// on slim pillars over an open plaza, framed by glass office blocks, birch
// planters and a painted bike lane (Sweden cycles). Same buildWorld contract.
import * as THREE from 'three';
import { createBuilder, buildNav, makeSpawns, mkTex, canvas, signTexture, createPickups, PICKUP_PRIMARIES } from './map_kit.js';

const HALF_X = 24, HALF_Z = 30;

function glassTex() {
  const c = canvas(128, 256), x = c.getContext('2d');
  x.fillStyle = '#3a5566'; x.fillRect(0, 0, 128, 256);
  for (let gy = 6; gy < 256; gy += 20) for (let gx = 6; gx < 128; gx += 20) {
    x.fillStyle = Math.random() < 0.5 ? '#9fd0e8' : '#6f9ab0'; x.fillRect(gx, gy, 16, 16);
  }
  return mkTex(c, 3, 6);
}
function pavingTex() {
  const c = canvas(256), x = c.getContext('2d');
  x.fillStyle = '#c7c2b8'; x.fillRect(0, 0, 256, 256);
  x.strokeStyle = '#a8a293'; x.lineWidth = 2;
  for (let i = 0; i <= 256; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 256); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(256, i); x.stroke(); }
  return mkTex(c, 16, 20);
}

export function buildMidModerna(scene, T) {
  const root = new THREE.Group(); scene.add(root);
  const B = createBuilder(root);
  const lam = (o) => new THREE.MeshLambertMaterial(o);
  const TEX = { glass: glassTex(), paving: pavingTex() };
  const MAT = {
    paving: lam({ map: TEX.paving }), glass: lam({ map: TEX.glass }),
    concrete: lam({ color: 0xeceae4 }), pillar: lam({ color: 0xdedbd2 }),
    accent: lam({ color: 0x1f6fb2 }), birchTrunk: lam({ color: 0xf0ece2 }),
    leaf: lam({ color: 0x5a9a3e }), bench: lam({ color: 0x8a6b48 }), bike: lam({ color: 0xf2c200 }),
  };

  // plaza floor
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(HALF_X * 2 + 4, HALF_Z * 2 + 4), MAT.paving);
  fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; root.add(fl);
  // painted bike lane down one side
  const lane = new THREE.Mesh(new THREE.PlaneGeometry(3, HALF_Z * 2), lam({ color: 0xb23b2e }));
  lane.rotation.x = -Math.PI / 2; lane.position.set(-18, 0.02, 0); root.add(lane);
  for (let z = -HALF_Z; z < HALF_Z; z += 4) B.addPlane(0.3, 1.6, MAT.bike, -18, 0.03, z + 1, 0, -Math.PI / 2);

  // perimeter low wall
  for (const [w, d, x, z] of [[HALF_X * 2 + 4, 1, 0, -HALF_Z - 0.5], [HALF_X * 2 + 4, 1, 0, HALF_Z + 0.5], [1, HALF_Z * 2 + 4, -HALF_X - 0.5, 0], [1, HALF_Z * 2 + 4, HALF_X + 0.5, 0]])
    B.addBox(w, 5, d, MAT.concrete, x, 0, z, { cast: false });

  // the raised gallery slab on slim pillars — the centrepiece (open span under it)
  {
    const slabY = 4.2, slabW = 20, slabD = 12;
    for (const px of [-8, 8]) for (const pz of [-4.5, 4.5]) {
      B.addBox(0.9, slabY, 0.9, MAT.pillar, px, 0, pz, { pad: 0.05 });   // pillars = cover
      B.addBox(1.2, 0.3, 1.2, MAT.accent, px, slabY - 0.3, pz, { collide: false });
    }
    B.addBox(slabW, 0.6, slabD, MAT.accent, 0, slabY, 0, { collide: false, cast: false });      // beam deck
    B.addBox(slabW - 1, 3.4, slabD - 1, MAT.glass, 0, slabY + 0.6, 0, { collide: false, cast: false }); // glass gallery
    B.addBox(slabW, 0.7, slabD, MAT.concrete, 0, slabY + 4.0, 0, { collide: false, cast: false });      // roof
    B.addPlane(8, 2.2, signTexture('#1f6fb2', '#ffffff', 'MODERNA', 'ARENA MUSEUM'), 0, slabY + 2.3, slabD / 2 + 0.05, 0);
  }

  // glass office blocks framing the plaza (tall solid cover, break sightlines)
  for (const [x, z, w, d, h] of [[-20, -20, 6, 6, 12], [20, -18, 7, 6, 14], [20, 18, 6, 7, 11], [-20, 20, 6, 6, 13], [18, 0, 5, 8, 9]])
    B.addBox(w, h, d, MAT.glass, x, 0, z);

  // birch planters (mid cover) + benches (low cover)
  function birch(cx, cz) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 4.0, 8), MAT.birchTrunk);
    trunk.position.set(cx, 2.0, cz); trunk.castShadow = true; root.add(trunk);
    B.addCollider(trunk, cx - 0.35, cx + 0.35, 0, 2.1, cz - 0.35, cz + 0.35);
    for (const [dy, r] of [[4.0, 1.5], [5.0, 1.1]]) { const c = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), MAT.leaf); c.position.set(cx, dy, cz); c.castShadow = true; root.add(c); }
  }
  for (const [x, z] of [[-10, 14], [10, -14], [-6, -10], [6, 10], [12, 6], [-12, -6]]) birch(x, z);
  for (const [x, z] of [[-3, 16], [3, -16], [8, 0], [-8, 0]]) B.addBox(2.4, 0.5, 0.7, MAT.bench, x, 0, z);

  // planters / low concrete blocks near mid for cover
  for (const [x, z] of [[-14, 8], [14, -8], [0, 12], [0, -12]]) B.addBox(2.2, 1.0, 2.2, MAT.concrete, x, 0, z);

  // end signage
  for (const s of [1, -1]) {
    const label = s < 0 ? signTexture('#c62f2f', '#ffffff', 'DESIGNERS', 'MUSEUM PLAZA')
                        : signTexture('#1faa4d', '#ffd23f', 'DEVELOPERS', 'MUSEUM PLAZA');
    B.addPlane(9, 2.6, label, 0, 3.0, (HALF_Z - 0.4) * s, s < 0 ? 0 : Math.PI);
  }

  // pickups
  const { pickups, place } = createPickups(root);
  PICKUP_PRIMARIES.forEach((k, i) => { const a = (i / PICKUP_PRIMARIES.length) * Math.PI * 2; place(k, Math.cos(a) * 6, Math.sin(a) * 3.2, a); });
  for (const s of [-1, 1]) {
    const row = s > 0 ? ['he', 'usp', 'flash', 'glock', 'smoke'] : ['deagle', 'usp', 'glock', 'elite', 'deagle'];
    row.forEach((k, i) => place(k, [-8, -4, 0, 4, 8][i], (HALF_Z - 9) * s, s > 0 ? Math.PI : 0));
  }
  place('awp', -16, 4); place('awp', 16, -4);

  // lighting — bright overcast Nordic daylight
  scene.background = T.sky; scene.fog = new THREE.Fog(0xdfe8ee, 70, 160);
  const hemi = new THREE.HemisphereLight(0xf2f8ff, 0x9aa39a, 1.2); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff6e0, 1.4); sun.position.set(-22, 34, 16); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -60; sun.shadow.camera.right = 60; sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -60;
  sun.shadow.camera.far = 160; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; scene.add(sun);
  const fill = new THREE.DirectionalLight(0xbfe0ff, 0.4); fill.position.set(20, 26, -18); scene.add(fill);

  const groundHeightAt = () => 0;
  const nav = buildNav({ colliders: B.colliders, halfX: HALF_X, halfZ: HALF_Z });
  return {
    root, colliders: B.colliders, occluders: B.occluders, groundHeightAt, sun, hemi, pickups,
    spawns: makeSpawns(HALF_Z),
    waypoints: { nodes: nav.nodes, adj: nav.adj }, nearestWaypoint: nav.nearestWaypoint, findPath: nav.findPath,
    bounds: { minX: -HALF_X + 0.5, maxX: HALF_X - 0.5, minZ: -HALF_Z + 0.5, maxZ: HALF_Z - 0.5 },
  };
}
