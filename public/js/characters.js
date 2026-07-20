// 10 fictional archetypes — procedural low-poly meshes.
// NOTE: names are placeholders pending final roster sign-off; ids are stable (used by DB/badges).
import * as THREE from 'three';

export const CHARACTERS = [
  { id: 'ux_lead', team: 'P', name: 'The UX Lead',
    blurb: 'Beard, tote bag and 47 stickers. Analyzes the whole flow before taking a shot.',
    pal: { skin: 0xe8b98a, shirt: 0xb03a2e, pants: 0x3a4a5a, hair: 0x4a3428, boots: 0x2a2a2a } },
  { id: 'brand_designer', team: 'P', name: 'The Brand Designer',
    blurb: 'Red cap, brand guidelines and a megaphone. Calls a kickoff every round.',
    pal: { skin: 0xc98d5e, shirt: 0x777777, pants: 0x2e3d55, hair: 0x3a3a3a, boots: 0x4a3428 } },
  { id: 'motion_designer', team: 'P', name: 'The Motion Designer',
    blurb: 'From storyboard to arena. Steady hands, tidy keyframes and a pixel-precise shot.',
    pal: { skin: 0x8d5a3b, shirt: 0x7a6a45, pants: 0x4a4030, hair: 0x2a1e14, boots: 0x5a3d1e } },
  { id: 'product_designer', team: 'P', name: 'The Product Designer',
    blurb: 'Lab coat, roadmap and a 24h on-call. Prescribes shots straight to the point.',
    pal: { skin: 0xd9a580, shirt: 0xf0f0f0, pants: 0x3a4a5a, hair: 0x3a2a1e, boots: 0x6b6b6b } },
  { id: 'illustrator', team: 'P', name: 'The Illustrator',
    blurb: 'Headband, tablet and a calibrated aura. Only fires when the palette feels right.',
    pal: { skin: 0xe8b98a, shirt: 0x9b59b6, pants: 0x3a4a5a, hair: 0x4a3428, boots: 0x5a3d1e } },
  { id: 'backend_dev', team: 'B', name: 'The Backend Dev',
    blurb: 'Server tee, road gloves and 40h of uptime a week. Brakes for no one.',
    pal: { skin: 0xd9a066, shirt: 0xffd23f, pants: 0x2e3d55, hair: 0x3a2a1e, boots: 0x3a3a3a } },
  { id: 'frontend_dev', team: 'B', name: 'The Frontend Dev',
    blurb: 'Golden shades, stories across 3 time zones and sponsored aim. Ship, post, engage.',
    pal: { skin: 0xf2c9a4, shirt: 0xf0f0f0, pants: 0xe8c25a, hair: 0xf5d76e, boots: 0xffffff } },
  { id: 'devops_engineer', team: 'B', name: 'The DevOps Engineer',
    blurb: 'Cowboy hat, gold buckle and a pipeline on his back. Deploys in double time.',
    pal: { skin: 0xc98d5e, shirt: 0x8a2f2f, pants: 0x2e3d55, hair: 0x2a1e14, boots: 0x5a3d1e } },
  { id: 'qa_engineer', team: 'B', name: 'The QA Engineer',
    blurb: 'Sees every edge case and reads 300 chat threads. Somehow always knows where you are.',
    pal: { skin: 0xeec39a, shirt: 0x1faa4d, pants: 0xffd23f, hair: 0xd8d8d8, boots: 0xf0f0f0 } },
  { id: 'tech_lead', team: 'B', name: 'The Tech Lead',
    blurb: 'Blazer, headset and 47 productivity frameworks. Already won before standup — in theory.',
    pal: { skin: 0xf2c9a4, shirt: 0xf0f0f0, pants: 0x2a2a2a, hair: 0x2a2a2a, boots: 0x1a1a1a } },
  { id: 'content_designer', team: 'P', name: 'The Content Designer',
    blurb: 'Notebook, a pencil behind the ear and strong opinions on microcopy. Fires only well-labeled shots.',
    pal: { skin: 0xe0a884, shirt: 0x2e8b8b, pants: 0x3a3f4a, hair: 0x5a3a24, boots: 0x2a2a2a } },
  { id: 'design_systems', team: 'P', name: 'The Design Systems Lead',
    blurb: 'Everything on an 8px grid, tokens for days. Reuses every shot — never ships a magic number.',
    pal: { skin: 0xc98d5e, shirt: 0x5b53c6, pants: 0x2a2e3a, hair: 0x1f1f1f, boots: 0x4a4a4a } },
  { id: 'mobile_dev', team: 'B', name: 'The Mobile Dev',
    blurb: 'Beanie, two test phones and a battery pack. Ships to both stores mid-firefight.',
    pal: { skin: 0xd9a066, shirt: 0x3a3f4a, pants: 0x24303f, hair: 0x2a1e14, boots: 0x1f1f1f } },
  { id: 'data_engineer', team: 'B', name: 'The Data Engineer',
    blurb: 'Big headphones, a pipeline on their back and cold coffee. Batches kills overnight.',
    pal: { skin: 0xeec39a, shirt: 0xe07b39, pants: 0x2e3d55, hair: 0x3a3a3a, boots: 0x3a2a1e } },
];
export const byId = id => CHARACTERS.find(c => c.id === id);

const matCache = new Map();
function M(color) {
  if (!matCache.has(color)) matCache.set(color, new THREE.MeshLambertMaterial({ color }));
  return matCache.get(color);
}
function box(w, h, d, color, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(color));
  m.position.set(x, y, z); m.castShadow = true; return m;
}

// AWP-style rifle, pointing +Z. ~0.9m long.
export function buildRifle(color = 0x2e4a2e) {
  const g = new THREE.Group();
  g.add(box(0.06, 0.10, 0.42, color, 0, 0, 0.05));                    // receiver/body
  g.add(box(0.05, 0.07, 0.22, 0x2a2a2a, 0, -0.045, -0.20));           // stock
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.5, 6), M(0x222222));
  barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.012, 0.48); barrel.castShadow = true; g.add(barrel);
  const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.16, 8), M(0x1a1a1a));
  scope.rotation.x = Math.PI / 2; scope.position.set(0, 0.09, 0.06); g.add(scope);
  g.add(box(0.02, 0.05, 0.03, 0x222222, 0, 0.045, 0.0));              // scope mount
  g.add(box(0.04, 0.12, 0.06, 0x3a2a1e, 0, -0.10, 0.02));             // grip
  return g;
}

// Humanoid ~1.8m, origin at feet, faces +Z.
export function buildCharacter(def) {
  const p = def.pal, g = new THREE.Group();
  const parts = {};
  const bulky = def.id === 'backend_dev';

  // legs (pivot at hip)
  for (const s of [-1, 1]) {
    const geo = new THREE.BoxGeometry(0.15, 0.78, 0.17); geo.translate(0, -0.39, 0);
    const leg = new THREE.Mesh(geo, M(p.pants)); leg.castShadow = true;
    leg.position.set(0.11 * s, 0.78, 0);
    leg.add(box(0.16, 0.1, 0.26, p.boots, 0, -0.73, 0.04));           // boot
    g.add(leg); parts[s < 0 ? 'legL' : 'legR'] = leg;
  }
  // torso
  const torsoW = bulky ? 0.52 : 0.44;
  const torso = new THREE.Group(); torso.position.y = 0.78;
  const chest = box(torsoW, 0.6, 0.26, p.shirt, 0, 0.3, 0);
  torso.add(chest);
  g.add(torso); parts.torso = torso; parts.chest = chest;

  // head (pivot at neck)
  const head = new THREE.Group(); head.position.y = 1.38;
  head.add(box(0.26, 0.28, 0.26, p.skin, 0, 0.14, 0));
  g.add(head); parts.head = head;

  // arms holding rifle forward (pivot at shoulder)
  for (const s of [-1, 1]) {
    const geo = new THREE.BoxGeometry(0.11, 0.5, 0.13); geo.translate(0, -0.25, 0);
    const arm = new THREE.Mesh(geo, M(def.id === 'qa_engineer' ? 0xffd23f : p.shirt));
    arm.castShadow = true;
    arm.position.set((torsoW / 2 + 0.06) * s, 0.52, 0);
    arm.rotation.x = -1.35;                                            // forward hold
    arm.rotation.z = -0.12 * s;
    torso.add(arm); parts[s < 0 ? 'armL' : 'armR'] = arm;
  }
  // rifle in front of chest
  const gun = buildRifle();
  gun.position.set(0.10, 0.34, 0.30);
  torso.add(gun); parts.gun = gun;

  // team armband
  const band = def.team === 'P' ? 0xe03232 : 0x1faa4d;
  parts.armL.add(box(0.13, 0.08, 0.15, band, 0, -0.12, 0));

  addAccessories(def, parts, torsoW);
  return { group: g, parts, def };
}

function addAccessories(def, parts, torsoW) {
  const p = def.pal, head = parts.head, torso = parts.torso;
  const cap = (color) => {
    head.add(box(0.28, 0.09, 0.28, color, 0, 0.30, 0));
    head.add(box(0.26, 0.03, 0.16, color, 0, 0.27, 0.20));            // brim
  };
  const sunglasses = (w = 0.28, color = 0x111111) => {
    head.add(box(w, 0.07, 0.04, color, 0, 0.17, 0.14));
  };
  switch (def.id) {
    case 'ux_lead':
      head.add(box(0.24, 0.12, 0.06, 0x3a2a1e, 0, 0.02, 0.13));       // beard
      head.add(box(0.26, 0.10, 0.12, p.hair, 0, 0.30, -0.02));        // hair
      sunglasses(0.26, 0x222222);                                      // glasses
      torso.add(box(0.34, 0.08, 0.30, 0xd32f2f, 0, 0.56, 0));         // red scarf
      torso.add(box(0.20, 0.30, 0.06, 0xe8dcc0, torsoW / 2 + 0.1, -0.05, 0.05)); // tote bag
      torso.add(box(0.04, 0.04, 0.02, 0xffd23f, -0.12, 0.42, 0.14));  // button 1
      torso.add(box(0.04, 0.04, 0.02, 0xe03232, -0.05, 0.38, 0.14));  // button 2
      break;
    case 'brand_designer':
      cap(0xc0392b);
      torso.add(box(torsoW + 0.04, 0.5, 0.30, 0x8e2f24, 0, 0.28, 0)); // vest
      torso.add(box(0.07, 0.05, 0.02, 0xffd23f, -0.13, 0.4, 0.16));   // patch
      torso.add(box(0.07, 0.05, 0.02, 0xffd23f, 0.13, 0.32, 0.16));   // patch
      { const mega = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 8), M(0xf0f0f0));
        mega.rotation.x = 2.4; mega.position.set(-torsoW / 2 - 0.1, 0.02, 0.08);
        mega.castShadow = true; torso.add(mega); }                     // megaphone at hip
      break;
    case 'motion_designer':
      cap(0xc0392b);
      torso.add(box(0.32, 0.07, 0.28, 0xd32f2f, 0, 0.55, 0));         // scarf
      torso.add(box(0.34, 0.42, 0.16, 0x3f5a34, 0, 0.28, -0.22));     // backpack
      { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 5), M(0x8a6b48));
        pole.position.set(0.14, 0.75, -0.24); torso.add(pole);
        torso.add(box(0.02, 0.16, 0.24, 0xe03232, 0.14, 0.9, -0.36)); } // little red flag
      break;
    case 'product_designer':
      head.add(box(0.28, 0.08, 0.28, p.hair, 0, 0.29, 0));              // hair top
      head.add(box(0.08, 0.22, 0.08, p.hair, 0, 0.14, -0.18));          // ponytail
      torso.add(box(torsoW + 0.04, 0.56, 0.30, 0xf0f0f0, 0, 0.28, 0));  // lab coat
      torso.add(box(torsoW + 0.02, 0.16, 0.28, 0xf0f0f0, 0, -0.04, 0)); // coat skirt
      { const stet = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.014, 6, 14), M(0x2a2a2a));
        stet.position.set(0, 0.55, 0.05); stet.rotation.x = 1.25; torso.add(stet);   // stethoscope
        const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.02, 8), M(0x888888));
        chest.rotation.x = Math.PI / 2; chest.position.set(0.07, 0.38, 0.16); torso.add(chest); }
      torso.add(box(0.06, 0.06, 0.02, 0x2b4d8f, -0.13, 0.44, 0.16));    // ID badge
      torso.add(box(0.16, 0.22, 0.02, 0xd8cfc0, -torsoW / 2 - 0.1, 0.12, 0.08)); // clipboard
      break;
    case 'backend_dev':
      cap(0x2456a6);
      sunglasses();
      torso.add(box(0.46, 0.08, 0.28, 0x1faa4d, 0, 0.56, 0));         // green collar stripe
      parts.armR.add(box(0.13, 0.1, 0.15, 0x8a6b48, 0, -0.44, 0));    // trucker glove
      break;
    case 'frontend_dev':
      head.add(box(0.29, 0.12, 0.29, p.hair, 0, 0.31, -0.02));        // blonde
      head.add(box(0.29, 0.26, 0.08, p.hair, 0, 0.16, -0.15));        // long back hair
      sunglasses(0.30, 0xc9a227);                                      // gold shades
      parts.armL.rotation.x = -2.4;                                    // phone up pose
      parts.armL.add(box(0.09, 0.02, 0.14, 0xffffff, 0, -0.5, 0.04)); // phone
      torso.add(box(0.4, 0.06, 0.28, 0xc9a227, 0, 0.06, 0));          // gold belt
      break;
    case 'devops_engineer':
      { const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.03, 10), M(0x7a5230));
        brim.position.y = 0.27; brim.castShadow = true; head.add(brim);
        head.add(box(0.24, 0.14, 0.24, 0x7a5230, 0, 0.35, 0)); }      // cowboy hat
      torso.add(box(0.14, 0.1, 0.03, 0xffd23f, 0, 0.02, 0.14));       // big buckle
      { const gc = box(0.22, 0.72, 0.1, 0x2a2a2a, 0.05, 0.3, -0.24);  // guitar case
        gc.rotation.z = 0.18; torso.add(gc); }
      break;
    case 'qa_engineer':
      { const bun = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), M(0xd8d8d8));
        bun.position.set(0, 0.34, -0.1); head.add(bun); }
      head.add(box(0.28, 0.06, 0.26, 0xd8d8d8, 0, 0.28, 0.02));       // gray hair
      sunglasses(0.32, 0x1a1a1a);                                      // oversized shades
      torso.add(box(0.36, 0.4, 0.05, 0xa97f4e, -0.04, 0.32, -0.19));  // corkboard on back
      torso.add(box(0.08, 0.06, 0.02, 0xf2ecd8, -0.12, 0.4, -0.215)); // note
      torso.add(box(0.08, 0.06, 0.02, 0xf2ecd8, 0.04, 0.26, -0.215)); // note
      torso.add(box(0.02, 0.2, 0.02, 0xd33, -0.04, 0.33, -0.215));    // red string
      parts.armR.add(box(0.1, 0.02, 0.15, 0x2b4d8f, 0, -0.44, 0.02)); // stickered phone
      break;
    case 'illustrator':
      head.add(box(0.29, 0.05, 0.29, 0xe8bd25, 0, 0.22, 0));          // headband
      head.add(box(0.24, 0.22, 0.06, p.hair, 0, -0.02, 0.13));        // long beard
      { const cry = new THREE.Mesh(new THREE.OctahedronGeometry(0.045), M(0x2fd3c0));
        cry.position.set(0, 0.42, 0.15); torso.add(cry); }            // crystal
      break;
    case 'tech_lead':
      torso.add(box(torsoW + 0.05, 0.5, 0.30, 0x1a2a4a, 0, 0.28, 0)); // blazer navy
      { const band = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.015, 6, 12, Math.PI), M(0x1a1a1a));
        band.rotation.z = Math.PI; band.position.set(0, 0.24, 0); head.add(band); } // headset arc
      head.add(box(0.015, 0.015, 0.14, 0x1a1a1a, 0.14, 0.08, 0.1));   // mic
      torso.add(box(0.16, 0.22, 0.03, 0xf0f0f0, -torsoW / 2 - 0.1, 0.12, 0.08)); // book
      torso.add(box(0.12, 0.03, 0.035, 0xe03232, -torsoW / 2 - 0.1, 0.14, 0.09)); // book title
      break;
    case 'content_designer':
      head.add(box(0.28, 0.09, 0.28, p.hair, 0, 0.29, -0.01));         // side-part hair
      sunglasses(0.27, 0x30302a);                                       // reading glasses
      head.add(box(0.02, 0.02, 0.12, 0xe8c25a, 0.13, 0.24, 0.02));      // pencil behind ear
      torso.add(box(0.18, 0.24, 0.03, 0xf2ecd8, -torsoW / 2 - 0.1, 0.12, 0.08)); // notebook
      torso.add(box(0.13, 0.015, 0.035, 0x2e8b8b, -torsoW / 2 - 0.1, 0.18, 0.09)); // ruled line
      torso.add(box(0.34, 0.07, 0.30, 0x1f6f6f, 0, 0.56, 0));           // teal scarf
      break;
    case 'design_systems':
      head.add(box(0.27, 0.10, 0.27, p.hair, 0, 0.30, 0));              // cropped hair
      sunglasses(0.28, 0x141414);
      { const grid = box(0.30, 0.34, 0.04, 0x2a2e3a, 0, 0.30, 0.14);    // grid panel on chest
        torso.add(grid);
        for (const gx of [-0.09, 0, 0.09]) for (const gy of [0.22, 0.31, 0.40])
          torso.add(box(0.05, 0.05, 0.02, 0x8b86e6, gx, gy, 0.165)); }  // token swatches
      break;
    case 'mobile_dev':
      head.add(box(0.29, 0.14, 0.29, 0x3a5f8a, 0, 0.30, 0));            // beanie
      torso.add(box(0.10, 0.16, 0.02, 0x111111, -0.13, 0.34, 0.15));    // phone 1
      torso.add(box(0.10, 0.16, 0.02, 0x111111, 0.13, 0.30, 0.15));     // phone 2
      torso.add(box(0.09, 0.14, 0.06, 0x2a2a2a, torsoW / 2 + 0.02, 0.0, 0.02)); // battery pack on hip
      break;
    case 'data_engineer':
      head.add(box(0.28, 0.08, 0.26, p.hair, 0, 0.28, 0));              // hair
      { const arc = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.02, 6, 12, Math.PI), M(0x1a1a1a));
        arc.rotation.z = Math.PI; arc.position.set(0, 0.23, 0); head.add(arc);
        head.add(box(0.06, 0.1, 0.06, 0x1a1a1a, -0.15, 0.05, 0));       // ear cup L
        head.add(box(0.06, 0.1, 0.06, 0x1a1a1a, 0.15, 0.05, 0)); }      // ear cup R (big headphones)
      torso.add(box(0.36, 0.42, 0.16, 0x2e3d55, 0, 0.28, -0.22));       // pipeline backpack
      torso.add(box(0.05, 0.08, 0.05, 0xf2ecd8, -torsoW / 2 - 0.06, 0.32, 0.08)); // coffee cup
      break;
  }
}

// Procedural walk/idle. `phase` advances with movement, `moving` 0..1.
export function poseCharacter(parts, phase, moving, t) {
  const s = Math.sin(phase), c = Math.cos(phase);
  parts.legL.rotation.x = s * 0.6 * moving;
  parts.legR.rotation.x = -s * 0.6 * moving;
  const breathe = Math.sin(t * 2.2) * 0.012;
  parts.torso.position.y = 0.78 + Math.abs(c) * 0.045 * moving + breathe;
  parts.torso.rotation.y = s * 0.05 * moving;
  parts.head.rotation.z = Math.sin(t * 1.7) * 0.02;
  parts.head.rotation.x = Math.sin(t * 1.3) * 0.02;
}

