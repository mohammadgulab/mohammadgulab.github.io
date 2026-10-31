import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const $ = s => document.querySelector(s);
const PHONE = Math.min(innerWidth, innerHeight) < 700 || matchMedia('(pointer:coarse)').matches;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- scenes ---------------- */
const SCENES = [
  { label: 'Fleet and hub', title: "Moving the Kingdom's cargo, from the Red Sea to every door.", text: 'One partner for road, sea, rail and air freight, run from our hub near Jeddah Islamic Port.', x: 1, y: 1, z: 1, r: 30 },
  { label: 'Warehousing', title: 'Inside the hub', text: 'Racked storage, pick and pack and cross-dock handling, with forklifts working every aisle.', x: -1, y: 1, z: -8, r: 16 },
  { label: 'Road freight', title: 'On the road, across the Kingdom', text: 'Full and part loads on scheduled routes. Service areas: Jeddah, Makkah, Madinah, Riyadh, Dammam.', x: 86, y: 1, z: -2, r: 31 },
  { label: 'Sea freight', title: 'At the Red Sea port', text: 'Import and export, clearance and container moves through Jeddah Islamic Port.', x: 159, y: 2, z: -7, r: 33 },
  { label: 'Rail freight', title: 'Rail links for containers', text: 'Container moves by rail where routes allow, with our gantry crew loading at the terminal. Routes on request.', x: 230, y: 2, z: 5, r: 29 },
  { label: 'Air cargo', title: 'When it has to fly', text: 'Urgent and high value shipments through King Abdulaziz International Airport, tracked door to door.', x: 309, y: 2, z: -3, r: 37 },
  { label: 'Head office', title: 'One team in Jeddah', text: 'One contact and one plan for every move, from first quote to final delivery.', x: 380, y: 9, z: 1, r: 26 }
];
const N = SCENES.length;

/* ---------------- renderer ---------------- */
const canvas = $('#gl');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  $('#nogl').hidden = false; $('#loader').classList.add('done');
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, PHONE ? 1.5 : 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping !== undefined ? THREE.NeutralToneMapping : THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const BG = new THREE.Color(0xeef0f1);
const scene = new THREE.Scene();
scene.background = BG;
scene.fog = new THREE.Fog(BG, 300, 500);

const cam = new THREE.OrthographicCamera(-10, 10, 10, -10, 1, 1400);
const DIST = 420;

const hemi = new THREE.HemisphereLight(0xffffff, 0xcdc6ba, 1.45);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff6ea, 2.3);
sun.castShadow = true;
sun.shadow.mapSize.set(PHONE ? 1024 : 2048, PHONE ? 1024 : 2048);
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.04;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 260;
scene.add(sun, sun.target);
const SUN_OFF = new THREE.Vector3(-38, 70, 30);

/* ---------------- materials ---------------- */
function std(hex, rough = 0.85, metal = 0, flat = false) {
  return new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal, flatShading: flat });
}
const M = {
  ground: std(0xefede8, 0.95),
  white: std(0xf6f6f4, 0.8),
  wall: std(0xeceae6, 0.9),
  grey: std(0xcfd3d8, 0.75),
  mid: std(0xa9aeb5, 0.7),
  dark: std(0x60656d, 0.8),
  black: std(0x2b2e33, 0.65),
  asphalt: std(0x8e9298, 0.95),
  line: std(0xffffff, 0.7),
  red: std(0xd8232a, 0.5),
  red2: std(0xb51d23, 0.55),
  glass: std(0x93aac0, 0.22, 0.2),
  green: std(0x83b866, 0.9, 0, true),
  green2: std(0x6aa556, 0.9, 0, true),
  trunk: std(0x9b7d5e, 0.9),
  sand: std(0xe7dbc4, 0.95, 0, true),
  rock: std(0xd9c9ad, 0.95, 0, true),
  concrete: std(0xdedcd7, 0.95),
  gravel: std(0xc8c4bd, 1),
  tan: std(0xcfa874, 0.9),
  box: std(0xe0be8c, 0.9),
  water: new THREE.MeshStandardMaterial({ color: 0x3f9bd6, roughness: 0.25, metalness: 0.05 })
};
for (const k in M) M[k].userData.key = k;

/* container texture: corrugation */
const corr = (() => {
  const c = document.createElement('canvas'); c.width = 128; c.height = 32;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 32);
  for (let i = 0; i < 128; i += 6) { g.fillStyle = 'rgba(0,0,0,0.13)'; g.fillRect(i, 0, 2, 32); }
  g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, 0, 128, 2); g.fillRect(0, 30, 128, 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
})();
const contMat = new THREE.MeshStandardMaterial({ map: corr, roughness: 0.7 });
const CONT_COLORS = [0xd8232a, 0xd8232a, 0xc41f26, 0xf2f2f0, 0xe9e9e6, 0xb9bec4, 0x8e949b, 0xd8232a, 0x6d737a, 0xf2f2f0];

function logoTexture(withWord) {
  const c = document.createElement('canvas'); c.width = withWord ? 512 : 256; c.height = 256;
  const g = c.getContext('2d');
  if (withWord) {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 512, 256);
    g.fillStyle = '#d8232a'; roundRect(g, 24, 48, 160, 160, 34); g.fill();
    g.fillStyle = '#fff'; g.font = '800 120px Manrope, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Q', 104, 134);
    g.fillStyle = '#15181d'; g.textAlign = 'left'; g.font = '800 70px Manrope, Arial, sans-serif'; g.fillText('QAFILA', 206, 134);
  } else {
    g.fillStyle = '#d8232a'; roundRect(g, 8, 8, 240, 240, 48); g.fill();
    g.fillStyle = '#fff'; g.font = '800 170px Manrope, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Q', 128, 140);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

/* ---------------- helpers ---------------- */
const UB = new THREE.BoxGeometry(1, 1, 1);
const UC = new THREE.CylinderGeometry(1, 1, 1, 16);
const UC8 = new THREE.CylinderGeometry(1, 1, 1, 8);
const UCone = new THREE.ConeGeometry(1, 1, 7);
const UCone16 = new THREE.ConeGeometry(1, 1, 16);
const USph = new THREE.SphereGeometry(1, 16, 10);
const UIco = new THREE.IcosahedronGeometry(1, 0);
const UIco1 = new THREE.IcosahedronGeometry(1, 1);

function mat(m) { return typeof m === 'string' ? M[m] : m; }
function P(parent, geo, m, sx, sy, sz, x, y, z, rx = 0, ry = 0, rz = 0) {
  const o = new THREE.Mesh(geo, mat(m));
  o.scale.set(sx, sy, sz); o.position.set(x, y, z); o.rotation.set(rx, ry, rz);
  o.castShadow = true; o.receiveShadow = true; parent.add(o); return o;
}
function B(parent, m, w, h, d, x, y0, z, ry = 0) { return P(parent, UB, m, w, h, d, x, y0 + h / 2, z, 0, ry, 0); }
const _q = new THREE.Quaternion(), _z = new THREE.Vector3(0, 0, 1);
function beam(parent, m, a, b, t) {
  const d = new THREE.Vector3().subVectors(b, a); const len = d.length();
  const o = new THREE.Mesh(UB, mat(m)); o.scale.set(t, t, len);
  o.position.copy(a).add(b).multiplyScalar(0.5);
  o.quaternion.copy(_q.setFromUnitVectors(_z, d.normalize()));
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const R = rng(20261031);

/* static baking */
const bins = {};
function pushGeo(key, g) {
  if (g.index) g = g.toNonIndexed();
  for (const n of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(n)) g.deleteAttribute(n);
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  g.clearGroups();
  (bins[key] || (bins[key] = [])).push(g);
}
function bake(root) {
  root.updateMatrixWorld(true);
  root.traverse(o => {
    if (o.isMesh && o.material.userData.key) {
      const g = o.geometry.clone(); g.applyMatrix4(o.matrixWorld); pushGeo(o.material.userData.key, g);
    }
  });
}
const W = new THREE.Group(); // static world, baked at the end

/* container instancing */
const contList = [];
function cont(x, y0, z, ry = 0, color) { contList.push({ x, y: y0 + 1.3, z, ry, color: color ?? CONT_COLORS[(R() * CONT_COLORS.length) | 0] }); }
function contMesh(color) { const m = new THREE.Mesh(UB, contMat.clone()); m.material.color.setHex(color); m.scale.set(6, 2.6, 2.45); m.castShadow = m.receiveShadow = true; return m; }

/* ---------------- models ---------------- */
function makeTruck(cab = 'red') {
  const g = new THREE.Group();
  B(g, 'black', 9.0, 0.35, 1.9, 0, 0.55, 0);
  B(g, 'white', 6.9, 2.5, 2.4, -1.2, 0.9, 0);
  B(g, 'red', 6.92, 0.3, 2.42, -1.2, 1.3, 0);
  B(g, cab, 2.2, 2.25, 2.3, 3.55, 0.75, 0);
  B(g, 'glass', 0.06, 0.8, 2.0, 4.66, 1.95, 0);
  B(g, 'glass', 1.0, 0.6, 0.06, 3.65, 2.05, 1.16);
  B(g, 'glass', 1.0, 0.6, 0.06, 3.65, 2.05, -1.16);
  B(g, 'dark', 0.2, 0.35, 2.3, 4.7, 0.75, 0);
  for (const x of [-3.9, -2.8, 2.1, 3.9]) for (const s of [-1, 1]) P(g, UC, 'black', 0.48, 0.34, 0.48, x, 0.48, s * 1.0, Math.PI / 2, 0, 0);
  return g;
}
function makeForklift() {
  const g = new THREE.Group();
  B(g, 'red', 1.7, 0.85, 1.15, 0, 0.32, 0);
  B(g, 'dark', 0.45, 0.85, 1.15, -1.0, 0.32, 0);
  B(g, 'black', 0.5, 0.45, 0.55, -0.2, 1.17, 0);
  for (const x of [-0.6, 0.55]) for (const z of [-0.5, 0.5]) B(g, 'black', 0.07, 1.25, 0.07, x, 1.17, z);
  B(g, 'black', 1.35, 0.06, 1.1, 0, 2.42, 0);
  for (const z of [-0.36, 0.36]) B(g, 'dark', 0.1, 2.9, 0.1, 0.92, 0.2, z);
  const c = new THREE.Group(); c.position.set(0.98, 0.18, 0); g.add(c);
  B(c, 'dark', 0.1, 0.6, 0.9, 0.0, 0, 0);
  for (const z of [-0.3, 0.3]) B(c, 'dark', 1.25, 0.07, 0.14, 0.65, 0, z);
  B(c, 'tan', 1.15, 0.14, 1.0, 0.66, 0.07, 0);
  B(c, 'box', 0.95, 0.8, 0.9, 0.66, 0.21, 0);
  for (const x of [-0.6, 0.6]) for (const s of [-1, 1]) P(g, UC, 'black', 0.27, 0.2, 0.27, x, 0.27, s * 0.55, Math.PI / 2, 0, 0);
  g.userData.c = c; return g;
}
function hullGeo(L, Wd, depth) {
  const s = new THREE.Shape();
  s.moveTo(-L / 2, -Wd / 2); s.lineTo(L / 2 - Wd * 1.1, -Wd / 2);
  s.quadraticCurveTo(L / 2, -Wd * 0.3, L / 2, 0);
  s.quadraticCurveTo(L / 2, Wd * 0.3, L / 2 - Wd * 1.1, Wd / 2);
  s.lineTo(-L / 2 + 0.6, Wd / 2); s.quadraticCurveTo(-L / 2, Wd / 2, -L / 2, Wd / 2 - 0.6);
  s.lineTo(-L / 2, -Wd / 2);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 6 });
  g.rotateX(-Math.PI / 2); return g;
}
function makeShip(L, Wd = 7, loaded = true) {
  const g = new THREE.Group();
  const lo = new THREE.Mesh(hullGeo(L, Wd, 1.6), M.red); lo.position.y = -1.2; lo.castShadow = lo.receiveShadow = true; g.add(lo);
  const hi = new THREE.Mesh(hullGeo(L, Wd, 2.0), M.white); hi.position.y = 0.4; hi.castShadow = hi.receiveShadow = true; g.add(hi);
  B(g, 'grey', L - 3, 0.12, Wd - 0.8, -0.8, 2.4, 0);
  B(g, 'white', 4.2, 4.8, Wd - 0.6, -L / 2 + 3.2, 2.4, 0);
  B(g, 'white', 3.0, 1.2, Wd + 0.6, -L / 2 + 3.0, 7.2, 0);
  B(g, 'glass', 0.08, 0.6, Wd + 0.2, -L / 2 + 4.52, 7.5, 0);
  B(g, 'red', 1.4, 2.0, 1.6, -L / 2 + 1.8, 7.2, 0);
  B(g, 'black', 1.42, 0.4, 1.62, -L / 2 + 1.8, 8.9, 0);
  if (loaded) {
    const items = [];
    const cnt = Math.floor((L - 12) / 6.4);
    for (let i = 0; i < cnt; i++) for (const zz of [-1.35, 1.35]) {
      const h = 1 + ((R() * 2.4) | 0);
      for (let k = 0; k < h; k++) items.push([-L / 2 + 8.5 + i * 6.4, 2.5 + 1.3 + k * 2.6, zz]);
    }
    const im = new THREE.InstancedMesh(UB, contMat, items.length);
    const m4 = new THREE.Matrix4(), col = new THREE.Color();
    items.forEach((p, i) => { m4.compose(V(p[0], p[1], p[2]), new THREE.Quaternion(), V(6, 2.6, 2.45)); im.setMatrixAt(i, m4); im.setColorAt(i, col.setHex(CONT_COLORS[(R() * CONT_COLORS.length) | 0])); });
    im.castShadow = im.receiveShadow = true; g.add(im);
  }
  return g;
}
function makePlane() {
  const g = new THREE.Group();
  P(g, UC, 'white', 1.1, 12, 1.1, 0, 2.3, 0, 0, 0, Math.PI / 2);
  P(g, USph, 'white', 2.2, 1.1, 1.1, 6.0, 2.3, 0);
  P(g, UCone16, 'white', 1.1, 3.4, 1.1, -7.7, 2.45, 0, 0, 0, Math.PI / 2);
  B(g, 'glass', 0.9, 0.35, 1.9, 6.4, 2.55, 0);
  B(g, 'red', 11, 0.22, 2.24, 0, 1.75, 0);
  for (const s of [-1, 1]) {
    B(g, 'white', 3.0, 0.22, 8.6, -0.9, 1.7, s * 4.9, s * 0.38);
    P(g, UC, 'grey', 0.52, 2.1, 0.52, 0.9, 1.25, s * 3.6, 0, 0, Math.PI / 2);
    B(g, 'white', 1.4, 0.14, 2.8, -7.9, 2.55, s * 1.6, s * 0.4);
  }
  const fin = B(g, 'red', 2.6, 3.1, 0.24, -7.8, 2.6, 0); fin.rotation.z = 0.42;
  for (const x of [5, -0.5]) P(g, UC8, 'black', 0.3, 0.25, 0.3, x, 0.35, 0, Math.PI / 2, 0, 0);
  return g;
}
function makeCar(c) { const g = new THREE.Group(); B(g, c, 2.3, 0.7, 1.15, 0, 0.25, 0); B(g, 'glass', 1.2, 0.5, 1.05, -0.15, 0.95, 0); return g; }
function tree(x, z, s = 1) {
  B(W, 'trunk', 0.26 * s, 0.9 * s, 0.26 * s, x, 0, z);
  if (R() < 0.5) P(W, UCone, 'green', 1.15 * s, 2.7 * s, 1.15 * s, x, 0.75 * s + 1.35 * s, z, 0, R() * 3, 0);
  else P(W, UIco, R() < 0.5 ? 'green' : 'green2', 1.15 * s, 1.25 * s, 1.15 * s, x, 1.7 * s, z, 0, R() * 3, 0);
}

/* ================= WORLD ================= */
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 600), M.ground);
ground.rotation.x = -Math.PI / 2; ground.position.set(190, 0, 0); ground.receiveShadow = true; scene.add(ground);

/* highway along z=28 */
B(W, 'asphalt', 520, 0.06, 7, 190, 0, 28);
for (let x = -68; x < 448; x += 7) B(W, 'line', 3, 0.08, 0.22, x, 0, 28);
for (const z of [24.8, 31.2]) B(W, 'line', 520, 0.07, 0.16, 190, 0, z);

const anim = []; // functions (t, dt)
const highwayTrucks = [];
for (let i = 0; i < 6; i++) {
  const tr = makeTruck(i % 3 === 1 ? 'white' : 'red');
  const dir = i % 2 ? -1 : 1;
  tr.rotation.y = dir > 0 ? 0 : Math.PI; tr.position.set(-60 + i * 85, 0, dir > 0 ? 29.7 : 26.3);
  tr.userData.dir = dir; tr.userData.v = 7 + (i % 3);
  scene.add(tr); highwayTrucks.push(tr);
}
anim.push((t, dt) => { for (const tr of highwayTrucks) { tr.position.x += tr.userData.dir * tr.userData.v * dt; if (tr.position.x > 445) tr.position.x = -65; if (tr.position.x < -65) tr.position.x = 445; } });

/* ---------- S0/S1 warehouse hub ---------- */
const WH = { x0: -16, x1: 16, z0: -17, z1: 0, h: 8.5 };
B(W, 'asphalt', 40, 0.05, 22, 0, 0, 11);
B(W, 'asphalt', 8, 0.05, 6, 0, 0, 23);
for (let i = 0; i < 6; i++) B(W, 'line', 0.18, 0.07, 9, -12 + i * 4.8 - 2.4, 0, 6);
B(W, 'concrete', 33, 0.25, 18, 0, 0, -8.5);
// back + left walls (stay)
B(W, 'wall', 32, WH.h, 0.4, 0, 0, WH.z0 + 0.2);
B(W, 'wall', 0.4, WH.h, 17, WH.x0 + 0.2, 0, -8.5);
B(W, 'red', 32.2, 0.6, 0.5, 0, WH.h - 0.6, WH.z0 + 0.2);
B(W, 'red', 0.5, 0.6, 17.2, WH.x0 + 0.2, WH.h - 0.6, -8.5);
// office annex
B(W, 'white', 9, 6, 7, 22, 0, -12);
B(W, 'glass', 9.05, 1.2, 7.05, 22, 1.4, -12);
B(W, 'glass', 9.05, 1.2, 7.05, 22, 3.6, -12);
B(W, 'red', 9.2, 0.4, 7.2, 22, 6, -12);
// fading shell: roof + front + right walls
const fadeGroup = new THREE.Group(); scene.add(fadeGroup);
const fadeMats = [];
function fm(base) { const m = base.clone(); m.transparent = true; m.userData = {}; fadeMats.push(m); return m; }
const fWall = fm(M.wall), fRed = fm(M.red), fRoof = fm(M.grey), fDark = fm(M.dark);
B(fadeGroup, fRoof, 33, 0.5, 17.6, 0, WH.h, -8.5);
B(fadeGroup, fWall, 32, WH.h, 0.4, 0, 0, -0.2);
B(fadeGroup, fWall, 0.4, WH.h, 17, WH.x1 - 0.2, 0, -8.5);
B(fadeGroup, fRed, 32.2, 0.6, 0.5, 0, WH.h - 0.6, -0.2);
B(fadeGroup, fRed, 0.5, 0.6, 17.2, WH.x1 - 0.2, WH.h - 0.6, -8.5);
for (let i = 0; i < 6; i++) {
  const x = -12 + i * 4.8;
  B(fadeGroup, fDark, 3.4, 3.8, 0.12, x, 0.3, 0.05);
  B(fadeGroup, fRed, 3.8, 0.3, 0.2, x, 4.1, 0.1);
}
const logoMat = new THREE.MeshStandardMaterial({ map: logoTexture(true), roughness: 0.8, transparent: true });
fadeMats.push(logoMat);
const logo = new THREE.Mesh(new THREE.PlaneGeometry(18, 9), logoMat);
logo.rotation.x = -Math.PI / 2; logo.position.set(0, WH.h + 0.27, -8.5); logo.receiveShadow = true; fadeGroup.add(logo);
// roof units
for (const x of [-12, 12]) B(fadeGroup, fWall, 2.2, 1.0, 2.2, x, WH.h + 0.25, -13);
fadeGroup.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

// parked fleet (4 of 6 docks)
[0, 1, 3, 5].forEach(i => { const tr = makeTruck(i === 3 ? 'white' : 'red'); tr.rotation.y = -Math.PI / 2; tr.position.set(-12 + i * 4.8, 0, 5.6); W.add(tr); });
// interior racks
for (const rz of [-14.6, -10.9, -7.2]) {
  for (let x = -12.5; x <= 12.5; x += 3.125) for (const dz of [-0.55, 0.55]) B(W, 'red', 0.14, 6.2, 0.14, x, 0.25, rz + dz);
  for (const y of [0.45, 2.3, 4.15, 6.0]) for (const dz of [-0.55, 0.55]) B(W, 'red2', 25.2, 0.14, 0.12, 0, y, rz + dz);
  for (const y of [0.52, 2.37, 4.22]) for (let x = -11; x <= 11; x += 3.125) {
    if (R() < 0.15) continue;
    B(W, 'tan', 2.5, 0.12, 1.0, x, y, rz);
    const h = 0.9 + R() * 0.6;
    B(W, R() < 0.18 ? 'white' : 'box', 2.2 + R() * 0.2, h, 0.92, x, y + 0.12, rz);
  }
}
// floor markings
for (const z of [-12.75, -9.05]) B(W, 'line', 26, 0.27, 0.1, 0, 0, z);
B(W, 'red', 26, 0.27, 0.12, 0, 0, -3.6);
// pallets near docks inside
for (let i = 0; i < 7; i++) { const x = -12 + i * 4; B(W, 'tan', 1.2, 0.14, 1.0, x, 0.25, -2.2); B(W, 'box', 1.0, 0.8 + (i % 3) * 0.3, 0.9, x, 0.39, -2.2); }

const forks = [];
[[-12.75, 0], [-9.05, 2.2], [-4.6, 4.1]].forEach(([z, ph]) => { const f = makeForklift(); f.position.set(0, 0.25, z); f.userData.ph = ph; scene.add(f); forks.push(f); });
anim.push(t => {
  for (const f of forks) {
    const s = t * 0.42 + f.userData.ph; const cyc = (Math.sin(s) + 1) / 2;
    f.position.x = -10 + 20 * cyc;
    const lift = Math.max(0, Math.cos(s * 2)) ;
    f.userData.c.position.y = 0.18 + lift * 2.0;
  }
});
// truck looping around the hub
const hubLoop = new THREE.CatmullRomCurve3([V(-21, 0, 16), V(0, 0, 18.5), V(21, 0, 16), V(28, 0, 6), V(29, 0, -6), V(28, 0, -19), V(16, 0, -23), V(-16, 0, -23), V(-24, 0, -18), V(-25, 0, 0), V(-24, 0, 10)], true, 'catmullrom', 0.5);
{
  const pts = hubLoop.getSpacedPoints(160);
  for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; const d = b.clone().sub(a); const len = d.length(); B(W, 'asphalt', 4.2, 0.04, len + 0.3, (a.x + b.x) / 2, 0.005, (a.z + b.z) / 2, Math.atan2(d.x, d.z)); }
}
const hubTruck = makeTruck('red'); scene.add(hubTruck);
function follow(obj, curve, u, y = 0) { const p = curve.getPointAt(u); const tg = curve.getTangentAt(u); obj.position.set(p.x, y + (p.y || 0), p.z); obj.rotation.set(0, Math.atan2(-tg.z, tg.x), 0); }
anim.push(t => follow(hubTruck, hubLoop, (t * 0.035) % 1, 0.02));

/* ---------- S2 road through the mountains ---------- */
const roadLoop = new THREE.CatmullRomCurve3([V(60, 0, 22), V(68, 0, 4), V(63, 0, -12), V(74, 0, -26), V(92, 0, -24), V(99, 0, -9), V(112, 0, -2), V(110, 0, 16), V(94, 0, 12), V(80, 0, 20)], true, 'catmullrom', 0.5);
{
  const SEG = 220, pts = roadLoop.getSpacedPoints(SEG);
  for (let i = 0; i < SEG; i++) {
    const a = pts[i], b = pts[i + 1]; const d = b.clone().sub(a); const len = d.length(); const ang = Math.atan2(d.x, d.z);
    B(W, 'asphalt', 4.6, 0.06, len + 0.35, (a.x + b.x) / 2, 0.01, (a.z + b.z) / 2, ang);
    if (i % 3 === 0) B(W, 'line', 0.18, 0.08, len * 1.2, (a.x + b.x) / 2, 0.01, (a.z + b.z) / 2, ang);
  }
  // mountains, keeping clear of the road
  const roadPts = roadLoop.getSpacedPoints(120);
  const near = (x, z, r) => roadPts.some(p => (p.x - x) ** 2 + (p.z - z) ** 2 < r * r);
  let placed = 0;
  for (let k = 0; k < 400 && placed < (PHONE ? 26 : 34); k++) {
    const x = 48 + R() * 78, z = -46 + R() * 62; const s = 3.5 + R() * 6.5;
    if (near(x, z, s * 1.05 + 3.2)) continue;
    if (z > 18) continue;
    P(W, UIco1, R() < 0.5 ? 'sand' : 'rock', s * (1 + R() * 0.5), s * (0.7 + R() * 0.7), s * (1 + R() * 0.4), x, 0, z, 0, R() * 6, 0);
    placed++;
  }
  // a few rocks and shrubs along the road
  for (let k = 0; k < 40; k++) { const p = roadPts[(R() * roadPts.length) | 0]; const a = R() * 6.28; const x = p.x + Math.cos(a) * 5, z = p.z + Math.sin(a) * 5; if (near(x, z, 3.4)) continue; P(W, UIco, 'rock', 0.6 + R(), 0.5 + R() * 0.6, 0.6 + R(), x, 0.1, z, 0, R() * 6, 0); }
  // sign gantry at road entrance
  B(W, 'red', 0.3, 5, 0.3, 57, 0, 18); B(W, 'red', 0.3, 5, 0.3, 64, 0, 18); B(W, 'white', 8, 1.6, 0.3, 60.5, 4.2, 18);
}
const roadTrucks = [0, 0.5].map((o, i) => { const tr = makeTruck(i ? 'white' : 'red'); tr.userData.o = o; scene.add(tr); return tr; });
anim.push(t => { for (const tr of roadTrucks) follow(tr, roadLoop, (t * 0.022 + tr.userData.o) % 1, 0.06); });

/* ---------- S3 Red Sea port ---------- */
const water = new THREE.Mesh(new THREE.PlaneGeometry(92, 160), M.water);
water.rotation.x = -Math.PI / 2; water.position.set(160, 0.05, -80); water.receiveShadow = true; scene.add(water);
B(W, 'sand', 4, 0.4, 160, 113, 0, -80); B(W, 'sand', 4, 0.4, 160, 207, 0, -80);
B(W, 'concrete', 90, 0.8, 22, 160, 0, 11);
B(W, 'dark', 90, 0.85, 0.6, 160, 0, 0.1);
for (let x = 118; x < 204; x += 5) B(W, 'black', 0.5, 0.5, 0.5, x, 0.85, 0.7);
for (const z of [3.2, 8.2]) for (const s of [-0.75, 0.75]) B(W, 'dark', 86, 0.06, 0.12, 160, 0.8, z + s); // crane rails
B(W, 'asphalt', 8, 0.05, 6, 160, 0, 23.5);
// container yard
for (const z of [13.5, 16.2, 18.9]) for (let x = 120; x <= 198; x += 6.5) {
  if (Math.abs(x - 159) < 4) continue; const h = 1 + ((R() * 3) | 0);
  for (let k = 0; k < h; k++) cont(x, 0.8 + k * 2.6, z);
}
// port cranes
const cranes = [];
for (const cx of [140, 158, 176]) {
  const c = new THREE.Group(); c.position.set(cx, 0.8, 0); W.add(c);
  for (const lx of [-3.6, 3.6]) for (const lz of [3.2, 8.2]) B(c, 'red', 0.8, 15, 0.8, lx, 0, lz);
  for (const lz of [3.2, 8.2]) { B(c, 'red', 8.0, 0.8, 0.8, 0, 6, lz); B(c, 'red', 8.0, 1.0, 0.9, 0, 14.4, lz); }
  for (const lx of [-3.6, 3.6]) B(c, 'red', 0.8, 0.8, 6, lx, 6, 5.7);
  for (const lx of [-1.0, 1.0]) B(c, 'white', 0.7, 1.1, 34, lx, 15.4, -2);
  B(c, 'white', 3.4, 2.6, 4.2, 0, 16.5, 11.5);
  for (const lx of [-1.0, 1.0]) { B(c, 'red', 0.6, 7, 0.6, lx, 15.4, 6); beam(c, 'dark', V(lx, 22.2, 6), V(lx, 16.4, -18), 0.18); beam(c, 'dark', V(lx, 22.2, 6), V(lx, 16.4, 14), 0.18); }
  const tro = new THREE.Group(); tro.position.set(cx, 0.8 + 15.0, 0); scene.add(tro);
  B(tro, 'dark', 2.6, 0.8, 2.2, 0, 0, 0);
  const cable = B(tro, 'black', 0.08, 1, 0.08, 0, -1, 0);
  const box = contMesh(CONT_COLORS[(R() * 4) | 0]); tro.add(box);
  const spreader = B(tro, 'black', 6.2, 0.25, 2.6, 0, 0, 0);
  cranes.push({ tro, cable, box, spreader, ph: cx * 0.07 });
}
anim.push(t => {
  for (const c of cranes) {
    const u = ((t / 13) + c.ph) % 1; let z, L;
    const sm = x => x * x * (3 - 2 * x);
    const seg = (a, b) => sm(Math.min(1, Math.max(0, (u - a) / (b - a))));
    // zShip=-7 over the ship deck, zQuay=5.7 over trucks
    if (u < 0.15) { z = -7; L = 3 + 7.5 * seg(0, 0.15); }
    else if (u < 0.3) { z = -7; L = 10.5 - 7.5 * seg(0.15, 0.3); }
    else if (u < 0.5) { z = -7 + 12.7 * seg(0.3, 0.5); L = 3; }
    else if (u < 0.65) { z = 5.7; L = 3 + 8.6 * seg(0.5, 0.65); }
    else if (u < 0.8) { z = 5.7; L = 11.6 - 8.6 * seg(0.65, 0.8); }
    else { z = 5.7 - 12.7 * seg(0.8, 1); L = 3; }
    c.tro.position.z = z;
    c.cable.scale.y = L; c.cable.position.y = -L / 2;
    c.spreader.position.y = -L - 0.1; c.box.position.y = -L - 1.55;
  }
});
const ships = [];
[[143, -8.5, 40, 0], [181, -8.5, 30, 0], [162, -36, 34, 0.35]].forEach(([x, z, L, ry], i) => {
  const s = makeShip(L, i === 2 ? 6.5 : 7.5); s.position.set(x, 0.3, z); s.rotation.y = ry; s.userData = { x, z, ry, ph: i * 1.7 }; scene.add(s); ships.push(s);
});
anim.push(t => { for (const s of ships) { const p = s.userData.ph; s.position.y = 0.25 + Math.sin(t * 1.1 + p) * 0.22; s.rotation.z = Math.sin(t * 0.8 + p) * 0.018; s.rotation.x = Math.sin(t * 0.9 + p * 2) * 0.012; } ships[2].position.x = 162 + Math.sin(t * 0.05) * 10; });
// quay truck shuttling under the cranes
const quayTrucks = [0, 1].map(i => { const tr = makeTruck(i ? 'red' : 'white'); tr.position.set(150, 0.8, 5.7); scene.add(tr); tr.userData.ph = i * Math.PI; return tr; });
anim.push(t => { for (const tr of quayTrucks) { const s = Math.sin(t * 0.22 + tr.userData.ph); tr.position.x = 160 + s * 34; tr.rotation.y = Math.cos(t * 0.22 + tr.userData.ph) > 0 ? 0 : Math.PI; } });
// lighthouse on the breakwater
B(W, 'concrete', 3, 1, 26, 203, 0, -22);
P(W, UC, 'white', 1.1, 8, 1.1, 203, 4.5, -34); B(W, 'red', 2.6, 1.6, 2.6, 203, 8.5, -34);

/* ---------- S4 rail yard ---------- */
B(W, 'gravel', 92, 0.12, 22, 230, 0, 5);
B(W, 'asphalt', 8, 0.05, 8, 230, 0, 21);
const TRK = [0, 5, 10];
for (const tz of TRK) {
  for (let x = 186; x <= 274; x += 1.3) B(W, 'trunk', 0.45, 0.14, 2.6, x, 0.12, tz);
  for (const s of [-0.72, 0.72]) B(W, 'mid', 88, 0.2, 0.14, 230, 0.26, tz + s);
}
B(W, 'white', 28, 5, 6, 236, 0, 19.5); B(W, 'red', 28.2, 0.6, 6.2, 236, 5, 19.5); B(W, 'glass', 28.05, 1.2, 6.05, 236, 1.6, 19.5);
for (let x = 252; x <= 268; x += 6.5) for (let k = 0; k < 2; k++) cont(x, 0.12 + k * 2.6, 15.5);
function wagon(parent, x, z, withBox, color) {
  B(parent, 'dark', 6.6, 0.45, 2.3, x, 0.75, z);
  for (const dx of [-2.2, 2.2]) for (const s of [-0.75, 0.75]) P(parent, UC8, 'black', 0.4, 0.2, 0.4, x + dx, 0.6, z + s, Math.PI / 2, 0, 0);
  if (withBox) { const m = contMesh(color); m.position.set(x, 1.2 + 1.3, z); parent.add(m); }
}
function loco(parent, x, z) {
  B(parent, 'dark', 8.2, 0.5, 2.4, x, 0.75, z);
  B(parent, 'red', 7.6, 2.4, 2.4, x - 0.2, 1.25, z);
  B(parent, 'white', 7.62, 0.4, 2.42, x - 0.2, 2.2, z);
  B(parent, 'red', 2.0, 0.9, 2.4, x + 2.9, 3.65, z);
  B(parent, 'glass', 0.06, 0.7, 2.0, x + 3.92, 3.75, z);
  for (const dx of [-2.6, 2.6]) for (const s of [-0.75, 0.75]) P(parent, UC8, 'black', 0.45, 0.22, 0.45, x + dx, 0.62, z + s, Math.PI / 2, 0, 0);
}
// parked train on track 0
{ const pk = new THREE.Group(); W.add(pk); loco(pk, 262, 0); for (let i = 0; i < 6; i++) wagon(pk, 253.6 - i * 7, 0, i !== 2, CONT_COLORS[(R() * CONT_COLORS.length) | 0]); }
// moving train on track 5
const train = new THREE.Group(); scene.add(train);
loco(train, 0, 0); for (let i = 0; i < 6; i++) wagon(train, -8.4 - i * 7, 0, true, i % 2 ? 0xf2f2f0 : 0xd8232a);
train.position.set(230, 0, 5);
anim.push(t => { const s = Math.sin(t * 0.16); train.position.x = 245 + s * 22; });
// gantry crane
const gantry = new THREE.Group(); gantry.position.set(232, 0.12, 0); scene.add(gantry);
for (const gx of [-3.5, 3.5]) for (const gz of [-4.5, 14.5]) B(gantry, 'red', 0.8, 11.5, 0.8, gx, 0, gz);
for (const gz of [-4.5, 14.5]) B(gantry, 'red', 7.8, 0.9, 0.9, 0, 0, gz);
for (const gx of [-1.6, 1.6]) B(gantry, 'red', 0.9, 1.3, 20, gx, 11.2, 5);
for (const gz of [-4.5, 14.5]) B(gantry, 'red', 7.8, 1.0, 0.9, 0, 11.2, gz);
B(gantry, 'white', 2.6, 2.2, 2.6, 2.4, 12.5, 13.5);
const gTro = new THREE.Group(); gTro.position.set(0, 12.6, 5); gantry.add(gTro);
B(gTro, 'dark', 3.8, 0.7, 2.2, 0, 0, 0);
const gCable = B(gTro, 'black', 0.08, 1, 0.08, 0, -1, 0);
const gSpread = B(gTro, 'black', 6.2, 0.25, 2.6, 0, 0, 0);
const gBox = contMesh(0xd8232a); gBox.rotation.y = 0; gTro.add(gBox);
anim.push(t => {
  gantry.position.x = 232 + Math.sin(t * 0.12) * 9;
  const u = (t / 9) % 1; const sm = x => x * x * (3 - 2 * x);
  const L = 2.5 + 5.5 * sm(Math.abs(Math.sin(u * Math.PI)));
  gTro.position.z = 5 + Math.sin(t * 0.33) * 5;
  gCable.scale.y = L; gCable.position.y = -L / 2; gSpread.position.y = -L - 0.1; gBox.position.y = -L - 1.55;
});

/* ---------- S5 airport ---------- */
B(W, 'asphalt', 96, 0.06, 10, 310, 0, -20);
for (let x = 268; x < 352; x += 6) B(W, 'line', 3, 0.08, 0.3, x, 0, -20);
for (const ex of [264, 356]) for (let k = -3; k <= 3; k++) B(W, 'line', 2.4, 0.08, 0.5, ex, 0, -20 + k * 1.2);
B(W, 'asphalt', 80, 0.05, 4, 310, 0, -10.5);
for (const x of [278, 342]) B(W, 'asphalt', 4, 0.05, 7, x, 0, -14.5);
B(W, 'concrete', 62, 0.1, 15, 310, 0, -1);
// terminal
B(W, 'white', 52, 5, 7, 310, 0, 11);
B(W, 'glass', 52.05, 2.4, 7.05, 310, 1.2, 11);
P(W, UC, 'white', 3.8, 52, 3.8, 310, 5, 11, 0, 0, Math.PI / 2);
B(W, 'red', 52.4, 0.5, 0.4, 310, 5, 7.4);
for (const x of [292, 304, 316, 328]) B(W, 'grey', 1.4, 1.6, 6, x, 1.6, 4.5);
// tower
P(W, UC, 'white', 1.2, 16, 1.2, 345, 8, 9); P(W, UC, 'glass', 2.6, 2, 2.6, 345, 17, 9); P(W, UC, 'red', 2.9, 0.6, 2.9, 345, 18.3, 9);
// cargo hangar
B(W, 'white', 14, 7, 12, 274, 0, 4); P(W, UC, 'white', 6, 14, 6, 274, 7, 4, 0, 0, Math.PI / 2);
B(W, 'red', 10, 5.5, 0.2, 274, 0, 10.1);
// parked planes
[[292, 0], [304, 0], [316, 0], [328, 0]].forEach(([x, z], i) => { if (i === 2) return; const p = makePlane(); p.rotation.y = -Math.PI / 2; p.position.set(x, 0.1, z - 1); p.scale.setScalar(0.85); W.add(p); });
const takeoff = makePlane(); scene.add(takeoff);
const taxiPlane = makePlane(); taxiPlane.scale.setScalar(0.85); scene.add(taxiPlane);
anim.push(t => {
  const u = (t / 16) % 1; const p = takeoff;
  if (u < 0.12) { p.position.set(268, 0.06, -20); p.rotation.set(0, 0, 0); }
  else if (u < 0.62) { const s = (u - 0.12) / 0.5; const x = 268 + 62 * s * s; p.position.set(x, 0.06, -20); p.rotation.set(0, 0, 0); }
  else { const s = (u - 0.62) / 0.38; p.position.set(330 + 60 * s + 18 * s * s, 0.06 + 34 * s * s, -20); p.rotation.set(0, 0, Math.min(0.22, s * 0.9)); }
  p.visible = u < 0.98;
  // taxi plane loops slowly along the taxiway
  const v = (t * 0.025) % 1; const tx = 280 + v * 60; taxiPlane.position.set(tx, 0.06, -10.5); taxiPlane.rotation.set(0, 0, 0);
  taxiPlane.visible = v < 0.97 && v > 0.02;
});
const apronTruck = makeTruck('red'); apronTruck.scale.setScalar(0.6); scene.add(apronTruck);
const apronLoop = new THREE.CatmullRomCurve3([V(286, 0, 5), V(334, 0, 5), V(337, 0, -5), V(286, 0, -5)], true, 'catmullrom', 0.3);
anim.push(t => follow(apronTruck, apronLoop, (t * 0.03) % 1, 0.1));

/* ---------- S6 head office / city ---------- */
B(W, 'asphalt', 58, 0.04, 44, 380, 0, 0);
const blocks = [];
for (let bx = 0; bx < 5; bx++) for (let bz = 0; bz < 4; bz++) {
  const x = 357 + bx * 11.5, z = -16 + bz * 10.6; blocks.push([x, z]);
  B(W, 'concrete', 9, 0.25, 8, x, 0, z);
  if (bx === 2 && (bz === 1 || bz === 2)) continue;
  const n = R() < 0.5 ? 1 : 2;
  for (let k = 0; k < n; k++) {
    const w = n === 1 ? 7 : 3.2, h = 4 + R() * 11; const ox = n === 1 ? 0 : (k ? 1.9 : -1.9);
    B(W, R() < 0.25 ? 'grey' : 'white', w, h, 6.2, x + ox, 0.25, z);
    for (let y = 1.6; y < h - 0.5; y += 2.2) B(W, 'glass', w + 0.05, 0.8, 6.25, x + ox, 0.25 + y, z);
  }
  if (R() < 0.7) tree(x + 3.8, z + 3.4, 0.6);
}
// HQ tower on the merged middle block
{
  const x = 380, z = 0;
  B(W, 'concrete', 9, 0.3, 19, x, 0, z);
  B(W, 'glass', 8.4, 32, 8.4, x, 0.3, z - 1);
  for (let y = 0.3; y < 32; y += 3.2) B(W, 'white', 8.8, 0.35, 8.8, x, y, z - 1);
  for (const dx of [-4.3, 4.3]) for (const dz of [-5.3, 3.3]) B(W, 'white', 0.6, 32.6, 0.6, x + dx, 0.3, z + dz);
  B(W, 'red', 9.2, 1.6, 9.2, x, 32.3, z - 1);
  B(W, 'white', 3, 3, 3, x, 33.9, z - 1);
  B(W, 'white', 14, 4, 5, x, 0.3, z + 6.2);
  B(W, 'red', 14.2, 0.5, 5.2, x, 4.3, z + 6.2);
  for (const dx of [-3, 0, 3]) tree(x + dx + 5.5, z + 8.6, 0.7);
}
const hqLogoMat = new THREE.MeshStandardMaterial({ map: logoTexture(false), roughness: 0.6 });
for (const [px, pz, ry] of [[380, 3.23, 0], [384.23, -1, Math.PI / 2]]) { const lg = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), hqLogoMat); lg.position.set(px, 28.5, pz); lg.rotation.y = ry; scene.add(lg); }
const beacon = new THREE.Mesh(USph, new THREE.MeshBasicMaterial({ color: 0xff3b3b })); beacon.scale.setScalar(0.45); beacon.position.set(380, 37.6, -1); scene.add(beacon);
B(W, 'dark', 0.15, 0.8, 0.15, 380, 36.9, -1);
const cars = [];
[[0, -5.3, 1], [0, 5.3, -1], [1, 368.75, 1], [1, 391.75, -1], [0, -5.3, 1]].forEach(([axis, line, dir], i) => {
  const c = makeCar(i % 2 ? 'white' : 'red'); c.userData = { axis, line, dir, o: i * 0.37 }; scene.add(c); cars.push(c);
});
anim.push(t => {
  for (const c of cars) {
    const { axis, line, dir, o } = c.userData; const u = ((t * 0.06 + o) % 1); const s = dir > 0 ? u : 1 - u;
    if (axis === 0) { c.position.set(352 + s * 56, 0.05, line + (dir > 0 ? 1 : -1)); c.rotation.y = dir > 0 ? 0 : Math.PI; }
    else { c.position.set(line + (dir > 0 ? -1 : 1), 0.05, -21 + s * 42); c.rotation.y = dir > 0 ? -Math.PI / 2 : Math.PI / 2; }
  }
  beacon.material.color.setHSL(0, 1, 0.45 + 0.25 * (Math.sin(t * 4) > 0 ? 1 : 0));
});
// connector roads to highway
for (const x of [86, 230, 310, 380]) B(W, 'asphalt', 7, 0.05, 6, x, 0, 23);

/* ---------- trees ---------- */
const zones = [[-30, -28, 34, 24], [-70, 23, 450, 33], [110, -150, 210, 26], [182, -8, 280, 24], [262, -27, 358, 18], [350, -23, 410, 23], [54, 16, 68, 22]];
const roadPts2 = roadLoop.getSpacedPoints(100);
let tc = 0;
for (let k = 0; k < 3000 && tc < (PHONE ? 300 : 420); k++) {
  const x = -60 + R() * 500, z = -75 + R() * 140;
  if (zones.some(([a, b, c, d]) => x > a && x < c && z > b && z < d)) continue;
  if (roadPts2.some(p => (p.x - x) ** 2 + (p.z - z) ** 2 < 25)) continue;
  if (x > 48 && x < 126 && z < 16 && R() < 0.75) continue; // sparse in the mountains
  tree(x, z, 0.7 + R() * 0.6); tc++;
}
// rows of trees along the highway
for (let x = -50; x < 440; x += 9) { if (R() < 0.35) continue; tree(x + R() * 2, 34.5 + R() * 2, 0.8); }

/* ---------- bake ---------- */
bake(W);
for (const key in bins) {
  const g = mergeGeometries(bins[key], false);
  const m = new THREE.Mesh(g, M[key]);
  m.castShadow = !['asphalt', 'line', 'gravel'].includes(key); m.receiveShadow = true;
  scene.add(m);
}
{
  const im = new THREE.InstancedMesh(UB, contMat, contList.length);
  const m4 = new THREE.Matrix4(), col = new THREE.Color(), q = new THREE.Quaternion();
  contList.forEach((c, i) => { q.setFromAxisAngle(V(0, 1, 0), c.ry); m4.compose(V(c.x, c.y, c.z), q, V(6, 2.6, 2.45)); im.setMatrixAt(i, m4); im.setColorAt(i, col.setHex(c.color)); });
  im.castShadow = im.receiveShadow = true; scene.add(im);
}

/* ================= CAMERA ================= */
const tgt = new THREE.Vector3();
let halfW = 10, halfH = 10;
const smooth = x => x * x * (3 - 2 * x);
const clamp01 = x => Math.max(0, Math.min(1, x));
function camDirection(aspect) {
  const az = Math.PI / 4; const el = aspect < 0.85 ? 0.74 : 0.6;
  return V(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
}
let dir = camDirection(1);
function placeCamera(p) {
  const t = p * (N - 1); let i = Math.floor(t), f = t - i; if (i >= N - 1) { i = N - 2; f = 1; }
  const e = smooth(clamp01((f - 0.14) / 0.72));
  const A = SCENES[i], Bs = SCENES[i + 1];
  tgt.set(A.x + (Bs.x - A.x) * e, A.y + (Bs.y - A.y) * e, A.z + (Bs.z - A.z) * e);
  const jump = Math.abs(Bs.x - A.x) > 20 ? 0.32 : 0.08;
  const r = (A.r + (Bs.r - A.r) * e) * (1 + jump * Math.sin(Math.PI * e));
  const aspect = innerWidth / innerHeight;
  if (aspect < 0.85) { halfW = r * 0.8; halfH = halfW / aspect; }
  else { halfH = r * 0.86; halfW = halfH * aspect; if (halfW < r * 1.25) { halfW = r * 1.25; halfH = halfW / aspect; } }
  const shift = aspect < 0.85 ? 0.17 : (innerWidth < 900 ? 0.1 : 0.03);
  const sx = aspect < 0.85 ? 0 : (innerWidth < 900 ? 0.04 : 0.12);
  cam.left = -halfW * (1 + sx); cam.right = halfW * (1 - sx); cam.top = halfH * (1 - shift); cam.bottom = -halfH * (1 + shift);
  cam.position.copy(tgt).addScaledVector(dir, DIST); cam.lookAt(tgt); cam.updateProjectionMatrix();
  const tanEl = Math.tan(Math.asin(dir.y));
  scene.fog.near = DIST + halfH * 0.5 / tanEl; scene.fog.far = DIST + halfH * 3.4 / tanEl;
  // sun follows the view
  sun.position.copy(tgt).add(SUN_OFF); sun.target.position.copy(tgt);
  const sc = Math.min(95, Math.max(halfW, halfH) * 1.25);
  const sh = sun.shadow.camera; if (Math.abs(sh.right - sc) > 0.5) { sh.left = -sc; sh.right = sc; sh.top = sc; sh.bottom = -sc; sh.updateProjectionMatrix(); }
  // warehouse shell fades for the interior view
  const w = clamp01(1 - Math.abs(t - 1) * 1.35); const op = 1 - smooth(w) * 0.97;
  for (const m of fadeMats) { m.opacity = op; m.depthWrite = op > 0.6; }
  fadeGroup.traverse(o => { if (o.isMesh) o.castShadow = op > 0.5; });
  fadeGroup.visible = op > 0.04;
  return t;
}

/* ================= SIZE ================= */
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  dir = camDirection(w / h);
}
addEventListener('resize', resize); resize();

/* ================= UI ================= */
const dotsEl = $('#dots');
SCENES.forEach((s, i) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', `Scene ${i + 1}: ${s.label}`); b.innerHTML = '<i></i>'; b.addEventListener('click', () => goScene(i)); dotsEl.appendChild(b); });
const dotBtns = [...dotsEl.children];
function goScene(i) {
  const j = $('#journey'); const top = j.getBoundingClientRect().top + scrollY; const span = j.offsetHeight - innerHeight;
  window.scrollTo({ top: top + span * i / (N - 1), behavior: REDUCED ? 'auto' : 'smooth' });
}
let curIdx = -1;
function setCard(i) {
  if (i === curIdx) return; const first = curIdx === -1; curIdx = i; const s = SCENES[i];
  dotBtns.forEach((b, k) => { b.classList.toggle('on', k === i); b.setAttribute('aria-current', k === i ? 'step' : 'false'); });
  const apply = () => { $('#cStep').textContent = `${String(i + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}`; $('#cLabel').textContent = s.label; $('#cTitle').textContent = s.title; $('#cText').textContent = s.text; };
  if (first || !window.gsap) { apply(); return; }
  const els = ['#cTitle', '#cText', '.card-step'];
  gsap.killTweensOf(els);
  gsap.to(els, { opacity: 0, y: -8, duration: 0.18, ease: 'power2.in', onComplete: () => { apply(); gsap.fromTo(els, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', stagger: 0.04 }); } });
}

let pTarget = 0, pNow = 0, journeyVisible = true;
if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  ScrollTrigger.create({
    trigger: '#journey', start: 'top top', end: 'bottom bottom',
    onUpdate: s => { pTarget = s.progress; if (s.progress > 0.01) $('#hint').classList.add('gone'); },
  });
  ScrollTrigger.create({ trigger: '#services', start: 'top 75%', onEnter: () => document.body.classList.remove('in-journey'), onLeaveBack: () => document.body.classList.add('in-journey') });
  ScrollTrigger.create({ trigger: '#services', start: 'top bottom', end: 'max', onToggle: s => { journeyVisible = !s.isActive || s.progress < 1; } });
  gsap.utils.toArray('.svc, .facts div, .two > *').forEach((el, i) => {
    gsap.from(el, { y: 36, opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
  });
} else {
  addEventListener('scroll', () => { const j = $('#journey'); const span = j.offsetHeight - innerHeight; pTarget = clamp01(scrollY / span); document.body.classList.toggle('in-journey', scrollY < span); }, { passive: true });
}
new IntersectionObserver(es => { journeyVisible = es[0].isIntersecting; }, { rootMargin: '0px 0px 0px 0px' }).observe($('#journey'));

$('#form').addEventListener('submit', e => { e.preventDefault(); $('#sent').hidden = false; $('#sent').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });

/* ================= LOOP ================= */
const clock = new THREE.Clock();
let started = false, simT = 0;
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (!journeyVisible && started) return;
  simT += REDUCED ? dt * 0.3 : dt;
  pNow += (pTarget - pNow) * Math.min(1, dt * 3.2);
  if (Math.abs(pTarget - pNow) < 0.0002) pNow = pTarget;
  const t = placeCamera(pNow);
  setCard(Math.min(N - 1, Math.max(0, Math.round(t))));
  for (const a of anim) a(simT, dt);
  renderer.render(scene, cam);
  if (!started) { started = true; setTimeout(() => $('#loader').classList.add('done'), 150); setTimeout(makeIcons, 700); }
}
// expose for QA
window.__demo = { setP: p => { pTarget = pNow = p; }, get p() { return pNow; }, scenes: N, renderer };
requestAnimationFrame(frame);

/* ================= service icons rendered from the same models ================= */
function makeIcons() {
  let r2;
  try { r2 = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); } catch (e) { return; }
  r2.setPixelRatio(1); r2.setSize(240, 240, false); r2.outputColorSpace = THREE.SRGBColorSpace; r2.toneMapping = renderer.toneMapping;
  r2.shadowMap.enabled = true; r2.shadowMap.type = THREE.PCFSoftShadowMap;
  const builders = {
    truck: () => makeTruck('red'),
    forklift: () => makeForklift(),
    ship: () => { const s = makeShip(26, 7); s.position.y = 1.2; return s; },
    train: () => { const g = new THREE.Group(); loco(g, 4, 0); wagon(g, -3.6, 0, true, 0xd8232a); return g; },
    plane: () => makePlane(),
    crane: () => { const g = new THREE.Group(); for (const gx of [-3.5, 3.5]) for (const gz of [-4.5, 4.5]) B(g, 'red', 0.8, 9, 0.8, gx, 0, gz); for (const gz of [-4.5, 4.5]) B(g, 'red', 7.8, 0.9, 0.9, 0, 9, gz); for (const gx of [-1.6, 1.6]) B(g, 'red', 0.9, 1.1, 10, gx, 9, 0); B(g, 'dark', 3.8, 0.6, 2.2, 0, 8.4, 0); const c = contMesh(0xf2f2f0); c.position.set(0, 4.3, 0); g.add(c); B(g, 'black', 0.08, 2.6, 0.08, 0, 5.6, 0); return g; }
  };
  const d = V(Math.sin(Math.PI / 4) * Math.cos(0.55), Math.sin(0.55), Math.cos(Math.PI / 4) * Math.cos(0.55));
  document.querySelectorAll('img[data-icon]').forEach(img => {
    const b = builders[img.dataset.icon]; if (!b) return;
    const s = new THREE.Scene();
    s.add(new THREE.HemisphereLight(0xffffff, 0xcdc6ba, 1.5));
    const L = new THREE.DirectionalLight(0xfff6ea, 2.2); L.position.set(-20, 40, 18); L.castShadow = true; L.shadow.mapSize.set(512, 512);
    const obj = b(); s.add(obj);
    const box = new THREE.Box3().setFromObject(obj); const c = box.getCenter(new THREE.Vector3()); const sz = box.getSize(new THREE.Vector3());
    const rad = sz.length() / 2;
    const fl = new THREE.Mesh(new THREE.CircleGeometry(rad * 0.95, 40), new THREE.ShadowMaterial({ opacity: 0.16 })); fl.rotation.x = -Math.PI / 2; fl.position.set(c.x, box.min.y + 0.01, c.z); fl.receiveShadow = true; s.add(fl);
    L.target.position.copy(c); L.position.copy(c).add(V(-20, 40, 18)); const sc = L.shadow.camera; sc.left = sc.bottom = -rad * 1.2; sc.right = sc.top = rad * 1.2; s.add(L, L.target);
    const k = rad * 0.86; const oc = new THREE.OrthographicCamera(-k, k, k, -k, 0.1, 500);
    oc.position.copy(c).addScaledVector(d, 200); oc.lookAt(c);
    r2.render(s, oc);
    img.src = r2.domElement.toDataURL('image/png'); img.classList.add('ok');
  });
  r2.dispose(); r2.forceContextLoss();
}
