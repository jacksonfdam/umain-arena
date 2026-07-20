// fy_tunnelbana — a Stockholm metro (T-bana) rock-cave station. Based on the
// original's fy_metro concept, re-themed Swedish: raw exposed-bedrock ceiling
// painted deep blue (à la T-Centralen), a tiled island platform, a stopped
// Blue Line train down the middle as central cover, rock pillars, benches and a
// Pressbyrån-style kiosk. Same buildWorld contract.
import * as THREE from 'three';
import { createBuilder, buildNav, makeSpawns, mkTex, canvas, signTexture, createPickups, PICKUP_PRIMARIES } from './map_kit.js';

const HALF_X = 15, HALF_Z = 27, WALL_H = 7;

function rockTex() {
  const c = canvas(256), x = c.getContext('2d');
  x.fillStyle = '#123a63'; x.fillRect(0, 0, 256, 256);           // deep T-bana blue
  for (let i = 0; i < 400; i++) { x.fillStyle = ['#0e2f52', '#1b4b7a', '#0a2542'][(Math.random() * 3) | 0]; x.fillRect(Math.random() * 256, Math.random() * 256, 6, 6); }
  x.strokeStyle = '#7fbf3f'; x.lineWidth = 3;                    // painted green vines
  for (let i = 0; i < 6; i++) { x.beginPath(); let px = Math.random() * 256, py = 0; x.moveTo(px, py); for (let s = 0; s < 8; s++) { px += (Math.random() - .5) * 40; py += 32; x.lineTo(px, py); } x.stroke(); }
  return mkTex(c, 3, 3);
}
function tileTex() {
  const c = canvas(128), x = c.getContext('2d');
  x.fillStyle = '#d8dade'; x.fillRect(0, 0, 128, 128);
  x.strokeStyle = '#b3b7bd'; x.lineWidth = 3;
  for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 32, 0); x.lineTo(i * 32, 128); x.stroke(); x.beginPath(); x.moveTo(0, i * 32); x.lineTo(128, i * 32); x.stroke(); }
  return mkTex(c, 10, 16);
}

export function buildMidTbana(scene, T) {
  const root = new THREE.Group(); scene.add(root);
  const B = createBuilder(root);
  const lam = (o) => new THREE.MeshLambertMaterial(o);
  const TEX = { rock: rockTex(), tile: tileTex() };
  const MAT = {
    rock: lam({ map: TEX.rock }), tile: lam({ map: TEX.tile }),
    train: lam({ color: 0x1f6fb2 }), trainDk: lam({ color: 0x14507f }), glass: lam({ color: 0x9fd0e8 }),
    steel: lam({ color: 0x8a9096 }), bench: lam({ color: 0xcaa15a }), kiosk: lam({ color: 0xd83a3a }),
    rail: lam({ color: 0x9a9a9a }),
  };

  // platform floor
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(HALF_X * 2, HALF_Z * 2), MAT.tile);
  fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; root.add(fl);
  // yellow safety edge lines beside the track bed
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.PlaneGeometry(0.4, HALF_Z * 2), lam({ color: 0xf2c200 })); e.rotation.x = -Math.PI / 2; e.position.set(sx * 2.6, 0.02, 0); root.add(e); }

  // perimeter walls + curved rock-cave ceiling
  B.addBox(HALF_X * 2 + 2, WALL_H, 1, MAT.rock, 0, 0, -HALF_Z - 0.5);
  B.addBox(HALF_X * 2 + 2, WALL_H, 1, MAT.rock, 0, 0, HALF_Z + 0.5);
  B.addBox(1, WALL_H, HALF_Z * 2 + 2, MAT.rock, -HALF_X - 0.5, 0, 0);
  B.addBox(1, WALL_H, HALF_Z * 2 + 2, MAT.rock, HALF_X + 0.5, 0, 0);
  for (let z = -HALF_Z; z <= HALF_Z; z += 4) {              // vaulted rock ceiling ribs
    B.addBox(HALF_X * 2, 1.1, 3.6, MAT.rock, 0, WALL_H - 0.3, z, { collide: false, cast: false, rx: 0 });
  }

  // the stopped Blue Line train down the centre (central cover)
  const TL = 30;
  B.addBox(3.0, 0.4, TL, MAT.trainDk, 0, 0, 0, { collide: false, cast: false });     // undercarriage/bed
  B.addBox(2.8, 2.8, TL, MAT.train, 0, 0.4, 0, { pad: -0.1 });                        // body
  B.addBox(3.0, 0.5, TL, MAT.trainDk, 0, 3.2, 0, { collide: false });                // roof cap
  for (let z = -13; z <= 13; z += 2.4) {                                              // windows both sides
    for (const sx of [-1, 1]) B.addBox(0.06, 1.0, 1.6, MAT.glass, sx * 1.45, 1.7, z, { collide: false, cast: false });
  }
  B.addBox(3.0, 2.4, 0.3, lam({ color: 0x0e3a5f }), 0, 0.4, -TL / 2, { collide: false });  // cab ends
  B.addBox(3.0, 2.4, 0.3, lam({ color: 0x0e3a5f }), 0, 0.4, TL / 2, { collide: false });
  // rails along the bed
  for (const sx of [-0.9, 0.9]) B.addBox(0.12, 0.12, HALF_Z * 2, MAT.rail, sx, 0.06, 0, { collide: false, cast: false });

  // rock pillars flanking the platforms
  for (const px of [-9, 9]) for (const pz of [-16, -6, 6, 16]) B.addBox(1.4, WALL_H, 1.4, MAT.rock, px, 0, pz);

  // platform benches (low cover)
  for (const sx of [-1, 1]) for (const bz of [-10, 0, 10]) B.addBox(2.6, 0.5, 0.8, MAT.bench, sx * 12, 0, bz);

  // Pressbyrån kiosk near one end (solid cover)
  B.addBox(3.4, 2.6, 2.4, MAT.kiosk, -11, 0, -21);
  B.addBox(3.8, 0.3, 2.8, lam({ color: 0xf0f0f0 }), -11, 2.6, -21, { collide: false });

  // signage at both ends
  for (const s of [1, -1]) {
    const label = s < 0 ? signTexture('#003a8c', '#ffffff', 'DESIGNERS', 'PLATTFORM A')
                        : signTexture('#003a8c', '#ffd23f', 'DEVELOPERS', 'PLATTFORM B');
    B.addPlane(9, 2.6, label, 0, 4.4, (HALF_Z - 0.2) * s, s < 0 ? 0 : Math.PI);
  }
  B.addPlane(6, 1.6, signTexture('#003a8c', '#ffffff', 'TUNNELBANA', 'T-CENTRALEN'), 11, 4.6, -HALF_Z + 0.6, 0);

  // weapon pickups on the two platforms
  const { pickups, place } = createPickups(root);
  for (const sx of [-1, 1]) {
    const half = sx < 0 ? PICKUP_PRIMARIES.slice(0, 7) : PICKUP_PRIMARIES.slice(7);
    half.forEach((k, i) => place(k, sx * 13, -8 + i * 2.7, sx > 0 ? Math.PI / 2 : -Math.PI / 2));
  }
  for (const s of [-1, 1]) {
    const row = s > 0 ? ['he', 'flash', 'smoke', 'usp'] : ['deagle', 'usp', 'glock', 'elite'];
    row.forEach((k, i) => place(k, [-6, -2, 2, 6][i], 22 * s));
  }
  place('awp', -6, 0); place('awp', 6, 0);

  // lighting — cool underground with warm platform lamps
  scene.background = new THREE.Color(0x0a1a2a); scene.fog = new THREE.Fog(0x0a1a2a, 40, 90);
  const hemi = new THREE.HemisphereLight(0xbfd8ff, 0x25506f, 1.0); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2cc, 1.1); sun.position.set(8, 30, -6); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -30; sun.shadow.camera.right = 30; sun.shadow.camera.top = 30; sun.shadow.camera.bottom = -30;
  sun.shadow.camera.far = 100; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffe6b0, 0.5); fill.position.set(-10, 20, 12); scene.add(fill);

  const groundHeightAt = () => 0;
  const nav = buildNav({ colliders: B.colliders, halfX: HALF_X, halfZ: HALF_Z });
  return {
    root, colliders: B.colliders, occluders: B.occluders, groundHeightAt, sun, hemi,
    pickups, spawns: makeSpawns(HALF_Z),
    waypoints: { nodes: nav.nodes, adj: nav.adj }, nearestWaypoint: nav.nearestWaypoint, findPath: nav.findPath,
    bounds: { minX: -HALF_X + 0.5, maxX: HALF_X - 0.5, minZ: -HALF_Z + 0.5, maxZ: HALF_Z - 0.5 },
  };
}
