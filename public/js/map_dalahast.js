// de_dalahast — a modern Swedish town square built around a GIANT Dala horse
// (the classic orange Dalahäst from Dalarna). Based on the original's fy_baleia,
// which used a giant whale statue as central cover — here the Dala horse is the
// landmark you fight around, framed by glass buildings, a birch median and a
// painted bike lane. Same buildWorld contract.
import * as THREE from 'three';
import { createBuilder, buildNav, makeSpawns, mkTex, canvas, signTexture, createPickups } from './map_kit.js';

const HALF_X = 22, HALF_Z = 28;
const DALA = 0xd94f2a, DALA_DK = 0xb23a1c;

function glassTex() {
  const c = canvas(128, 256), x = c.getContext('2d');
  x.fillStyle = '#40525e'; x.fillRect(0, 0, 128, 256);
  for (let gy = 6; gy < 256; gy += 22) for (let gx = 6; gx < 128; gx += 22) { x.fillStyle = Math.random() < 0.5 ? '#a9c7d6' : '#6f8f9e'; x.fillRect(gx, gy, 18, 18); }
  return mkTex(c, 3, 6);
}

export function buildMidDalahast(scene, T) {
  const root = new THREE.Group(); scene.add(root);
  const B = createBuilder(root);
  const lam = (o) => new THREE.MeshLambertMaterial(o);
  const MAT = {
    plaza: lam({ color: 0xcbc6bb }), glass: lam({ map: glassTex() }),
    dala: lam({ color: DALA }), dalaDk: lam({ color: DALA_DK }),
    saddleB: lam({ color: 0x1f6fb2 }), saddleG: lam({ color: 0x2e8b57 }), white: lam({ color: 0xf2efe6 }),
    birch: lam({ color: 0xf0ece2 }), leaf: lam({ color: 0x5a9a3e }), bench: lam({ color: 0x8a6b48 }), bike: lam({ color: 0xf2c200 }),
  };

  // plaza floor + bike lane
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(HALF_X * 2 + 4, HALF_Z * 2 + 4), MAT.plaza);
  fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; root.add(fl);
  const lane = new THREE.Mesh(new THREE.PlaneGeometry(2.6, HALF_Z * 2), lam({ color: 0xb23b2e }));
  lane.rotation.x = -Math.PI / 2; lane.position.set(16, 0.02, 0); root.add(lane);

  // perimeter wall
  for (const [w, d, x, z] of [[HALF_X * 2 + 4, 1, 0, -HALF_Z - 0.5], [HALF_X * 2 + 4, 1, 0, HALF_Z + 0.5], [1, HALF_Z * 2 + 4, -HALF_X - 0.5, 0], [1, HALF_Z * 2 + 4, HALF_X + 0.5, 0]])
    B.addBox(w, 5.5, d, lam({ color: 0xb8b2a6 }), x, 0, z, { cast: false });

  // ---- the giant Dala horse (central landmark & cover) ----
  {
    // body: chunky box (main cover)
    B.addBox(6.4, 3.2, 2.4, MAT.dala, 0, 1.6, 0, { pad: -0.1 });
    // four stout legs (cover under the belly)
    for (const lx of [-2.2, 2.2]) for (const lz of [-0.8, 0.8]) B.addBox(0.9, 1.6, 0.9, MAT.dalaDk, lx, 0, lz);
    // arched neck rising at the front (+X)
    const neck = B.addBox(1.6, 3.2, 2.0, MAT.dala, 3.4, 3.0, 0, { collide: false }); neck.rotation.z = -0.5;
    // head + snout up top
    B.addBox(1.4, 1.6, 2.0, MAT.dala, 4.6, 5.2, 0, { collide: false });
    B.addBox(1.2, 0.8, 1.2, MAT.dala, 5.5, 5.6, 0, { collide: false });
    // ears
    for (const ez of [-0.5, 0.5]) B.addBox(0.3, 0.7, 0.3, MAT.dala, 4.3, 6.2, ez, { collide: false });
    // painted kurbits saddle (blue + green + white flourishes on the body sides)
    for (const sz of [-1.23, 1.23]) {
      B.addBox(2.6, 1.4, 0.06, MAT.saddleB, -0.4, 2.0, sz, { collide: false, cast: false });
      B.addBox(1.6, 0.8, 0.08, MAT.saddleG, -0.4, 2.0, sz, { collide: false, cast: false });
      B.addBox(0.5, 0.5, 0.1, MAT.white, 0.8, 2.4, sz, { collide: false, cast: false });
      B.addBox(0.5, 0.5, 0.1, MAT.white, -1.6, 1.7, sz, { collide: false, cast: false });
    }
    // little plinth
    B.addBox(8, 0.4, 4, lam({ color: 0x9a938a }), 0, 0, 0, { collide: false });
  }

  // glass buildings framing the square (tall cover)
  for (const [x, z, w, d, h] of [[-18, -18, 7, 6, 13], [18, -20, 6, 6, 15], [18, 20, 6, 6, 12], [-18, 20, 7, 6, 14], [-19, 2, 5, 8, 10]])
    B.addBox(w, h, d, MAT.glass, x, 0, z);

  // birch median + benches (mid/low cover)
  function birch(cx, cz) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 4.0, 8), MAT.birch);
    trunk.position.set(cx, 2.0, cz); trunk.castShadow = true; root.add(trunk);
    B.addCollider(trunk, cx - 0.35, cx + 0.35, 0, 2.1, cz - 0.35, cz + 0.35);
    for (const [dy, r] of [[4.0, 1.5], [5.0, 1.1]]) { const c = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), MAT.leaf); c.position.set(cx, dy, cz); c.castShadow = true; root.add(c); }
  }
  for (const [x, z] of [[-9, 12], [9, -12], [-11, -4], [11, 4], [0, 16], [0, -16]]) birch(x, z);
  for (const [x, z] of [[-5, 8], [5, -8], [8, 10], [-8, -10]]) B.addBox(2.4, 0.5, 0.7, MAT.bench, x, 0, z);

  // end signage
  for (const s of [1, -1]) {
    const label = s < 0 ? signTexture('#c62f2f', '#ffffff', 'DESIGNERS', 'STORTORGET')
                        : signTexture('#1faa4d', '#ffd23f', 'DEVELOPERS', 'STORTORGET');
    B.addPlane(9, 2.6, label, 0, 3.0, (HALF_Z - 0.4) * s, s < 0 ? 0 : Math.PI);
  }

  // pickups
  const { pickups, place } = createPickups(root);
  const RIFLES = ['awp', 'ak', 'm4', 'shotgun', 'mp5'];
  for (const sx of [-1, 1]) RIFLES.forEach((k, i) => place(k, sx * 12, [-8, -4, 0, 4, 8][i], sx > 0 ? Math.PI / 2 : -Math.PI / 2));
  for (const s of [-1, 1]) ['deagle', 'pistol', 'shotgun', 'pistol', 'deagle'].forEach((k, i) => place(k, [-8, -4, 0, 4, 8][i], (HALF_Z - 9) * s, s > 0 ? Math.PI : 0));
  place('awp', -6, 6); place('awp', 6, -6);

  // lighting — crisp Nordic afternoon
  scene.background = T.sky; scene.fog = new THREE.Fog(0xdfe8ee, 70, 160);
  const hemi = new THREE.HemisphereLight(0xf5f2ea, 0x8f9a86, 1.15); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2cc, 1.45); sun.position.set(20, 34, -14); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -56; sun.shadow.camera.right = 56; sun.shadow.camera.top = 56; sun.shadow.camera.bottom = -56;
  sun.shadow.camera.far = 150; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; scene.add(sun);
  const fill = new THREE.DirectionalLight(0xbfe0ff, 0.4); fill.position.set(-18, 26, 16); scene.add(fill);

  const groundHeightAt = () => 0;
  const nav = buildNav({ colliders: B.colliders, halfX: HALF_X, halfZ: HALF_Z });
  return {
    root, colliders: B.colliders, occluders: B.occluders, groundHeightAt, sun, hemi, pickups,
    spawns: makeSpawns(HALF_Z),
    waypoints: { nodes: nav.nodes, adj: nav.adj }, nearestWaypoint: nav.nearestWaypoint, findPath: nav.findPath,
    bounds: { minX: -HALF_X + 0.5, maxX: HALF_X - 0.5, minZ: -HALF_Z + 0.5, maxZ: HALF_Z - 0.5 },
  };
}
