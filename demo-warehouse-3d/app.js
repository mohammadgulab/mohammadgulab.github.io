import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const $ = s => document.querySelector(s);
const PHONE = Math.min(innerWidth, innerHeight) < 700 || matchMedia('(pointer:coarse)').matches;
const QA = /[?&]qa/.test(location.search);
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ldBar = $('.ld-bar i');
const setLoad = p => { if (ldBar) ldBar.style.width = (p * 100) + '%'; };
setLoad(0.15);

/* ---------------- renderer ---------------- */
const canvas = $('#gl');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  if (!renderer.getContext()) throw new Error('no gl');
} catch (e) {
  $('#nogl').hidden = false; $('#loader').classList.add('done');
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, PHONE ? 1.5 : 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping !== undefined ? THREE.NeutralToneMapping : THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;

const BG = new THREE.Color(0xe4edf8);
const scene = new THREE.Scene();
scene.background = BG;
scene.fog = new THREE.Fog(BG, 230, 520);
const cam = new THREE.PerspectiveCamera(30, 1, 1, 2000);
try {
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;
  pm.dispose();
} catch (e) {}
const hemi = new THREE.HemisphereLight(0xffffff, 0xc4d2e4, 1.25);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff8ee, 2.35);
sun.castShadow = true;
sun.shadow.mapSize.set(PHONE ? 1536 : 2048, PHONE ? 1536 : 2048);
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.05;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 420;
scene.add(sun, sun.target);
const SUN_DIR = new THREE.Vector3(-45, 80, 35).normalize();

/* ---------------- materials ---------------- */
const std = (hex, rough = 0.85, metal = 0, flat = false) => new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal, flatShading: flat });
function canvasTex(w, h, draw, rep = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const ribTex = canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 16) { const gr = g.createLinearGradient(x, 0, x + 16, 0); gr.addColorStop(0, '#d4d9e0'); gr.addColorStop(.35, '#ffffff'); gr.addColorStop(.7, '#eef1f5'); gr.addColorStop(1, '#c9d0d9'); g.fillStyle = gr; g.fillRect(x, 0, 16, h); } });
const doorTex = canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#eef2f7'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 8) { g.fillStyle = '#c9d2de'; g.fillRect(0, y, w, 1.5); g.fillStyle = '#ffffff'; g.fillRect(0, y + 2, w, 1); } });
const contTex = canvasTex(128, 64, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 8) { g.fillStyle = '#d9dde3'; g.fillRect(x, 0, 2, h); g.fillStyle = '#f7f8fa'; g.fillRect(x + 4, 0, 2, h); } g.fillStyle = '#c3c8cf'; g.fillRect(0, 0, w, 3); g.fillRect(0, h - 3, w, 3); });
function logoTex(dark) {
  return canvasTex(512, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const fg = dark ? '#ffffff' : '#2f6fed';
    g.strokeStyle = fg; g.lineWidth = 9; g.lineJoin = 'round';
    const cx = 64, cy = 64, s = 44;
    g.beginPath(); g.moveTo(cx, cy - s); g.lineTo(cx + s * .87, cy - s / 2); g.lineTo(cx + s * .87, cy + s / 2); g.lineTo(cx, cy + s); g.lineTo(cx - s * .87, cy + s / 2); g.lineTo(cx - s * .87, cy - s / 2); g.closePath(); g.stroke();
    g.beginPath(); g.moveTo(cx - s * .87, cy - s / 2); g.lineTo(cx, cy); g.lineTo(cx + s * .87, cy - s / 2); g.moveTo(cx, cy); g.lineTo(cx, cy + s); g.stroke();
    g.fillStyle = fg; g.font = '800 70px "Plus Jakarta Sans", Arial, sans-serif'; g.textBaseline = 'middle'; g.fillText('MUSTAWDA', 128, 68);
  }, false);
}
const M = {
  ground: std(0xe8eef5, 0.95), pad: std(0xf2f5f9, 0.92), pad2: std(0xe2e8f0, 0.92),
  asphalt: std(0xbfcad8, 0.9), line: std(0xffffff, 0.6), yellow: std(0xf3c33c, 0.6),
  wall: new THREE.MeshStandardMaterial({ color: 0x3f7ff0, roughness: 0.62, map: ribTex }),
  wall2: new THREE.MeshStandardMaterial({ color: 0x5d95f3, roughness: 0.62, map: ribTex }),
  wallW: new THREE.MeshStandardMaterial({ color: 0xf3f6fa, roughness: 0.7, map: ribTex }),
  door: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, map: doorTex }),
  roof: std(0xf4f7fb, 0.8), fascia: std(0xffffff, 0.6), blueD: std(0x2453b8, 0.55), blue: std(0x2f6fed, 0.5),
  grey: std(0xd3dbe5, 0.75), mid: std(0xa5b1c1, 0.7), dark: std(0x566173, 0.75), black: std(0x272d36, 0.6),
  tire: std(0x23272e, 0.9), chrome: std(0xdde3ea, 0.28, 0.85), steel: std(0x9aa7b8, 0.45, 0.5),
  win: std(0x2a3b56, 0.18, 0.4), glass: std(0x9cc0e8, 0.12, 0.3), sky: std(0x7fb0ee, 0.2, 0.2),
  orange: std(0xf59e2b, 0.5), orange2: std(0xe2711d, 0.55), white: std(0xf8fafc, 0.65),
  wood: std(0xcfa06a, 0.9), box: std(0xdcb787, 0.88), box2: std(0xc9a273, 0.88), wrap: std(0xb9d3f3, 0.35, 0.05), wrap2: std(0xe9eef5, 0.4),
  green: std(0x9ccf86, 0.9, 0, true), green2: std(0x7dbd6c, 0.9, 0, true), green3: std(0xb3db9e, 0.9, 0, true), grass: std(0xd9ebcf, 0.95),
  trunk: std(0xa08566, 0.9), sand: std(0xeee2c9, 0.97), sand2: std(0xe6d6b6, 0.97), palm: std(0x88b86b, 0.9, 0, true),
  water: new THREE.MeshStandardMaterial({ color: 0x7db8ee, roughness: 0.18, metalness: 0.1 }),
  solar: std(0x24406f, 0.25, 0.4), skin: std(0xc99b78, 0.8), vest: std(0xf7b733, 0.7), redL: std(0xe54848, 0.5),
  lamp: new THREE.MeshStandardMaterial({ color: 0xfffbe8, emissive: 0xfff3cf, emissiveIntensity: 0.7, roughness: 0.3 }),
  tail: new THREE.MeshStandardMaterial({ color: 0xff3a3a, emissive: 0xb00000, emissiveIntensity: 0.5, roughness: 0.4 }),
  cont: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.65, map: contTex }),
  trlogo: new THREE.MeshStandardMaterial({ map: logoTex(false), transparent: true, roughness: 0.7, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
  walllogo: new THREE.MeshStandardMaterial({ map: logoTex(true), transparent: true, roughness: 0.7, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })
};
for (const k in M) M[k].userData.key = k;
const mat = m => typeof m === 'string' ? M[m] : m;

/* ---------------- geometry helpers ---------------- */
const UB = new THREE.BoxGeometry(1, 1, 1);
const UC = new THREE.CylinderGeometry(1, 1, 1, 16);
const UC8 = new THREE.CylinderGeometry(1, 1, 1, 8);
const UCone = new THREE.ConeGeometry(1, 1, 8);
const UIco = new THREE.IcosahedronGeometry(1, 1);
const UPlane = new THREE.PlaneGeometry(1, 1);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
function P(parent, geo, m, sx, sy, sz, x, y, z, rx = 0, ry = 0, rz = 0) {
  const o = new THREE.Mesh(geo, mat(m)); o.scale.set(sx, sy, sz); o.position.set(x, y, z); o.rotation.set(rx, ry, rz);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
}
function B(parent, m, w, h, d, x, y0, z, ry = 0) { return P(parent, UB, m, w, h, d, x, y0 + h / 2, z, 0, ry, 0); }
// box with world-scaled UVs so ribbed textures tile evenly
function BU(parent, m, w, h, d, x, y0, z, tile = 1.6, ry = 0) {
  const g = new THREE.BoxGeometry(w, h, d); const uv = g.attributes.uv;
  const spans = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * spans[f][0] / tile, uv.getY(k) * spans[f][1] / tile); }
  const o = new THREE.Mesh(g, mat(m)); o.position.set(x, y0 + h / 2, z); o.rotation.y = ry; o.castShadow = o.receiveShadow = true; parent.add(o); return o;
}
const RBG = {};
function RB(parent, m, w, h, d, x, y0, z, r = 0.1, ry = 0) {
  const key = [w, h, d, r].join('|');
  const geo = RBG[key] || (RBG[key] = new RoundedBoxGeometry(w, h, d, 2, r));
  const o = new THREE.Mesh(geo, mat(m)); o.position.set(x, y0 + h / 2, z); o.rotation.y = ry;
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
}
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const R = rng(31102026);

function cleanGeo(geo) {
  if (geo.index) geo = geo.toNonIndexed();
  for (const n of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(n)) geo.deleteAttribute(n);
  if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
  geo.clearGroups(); return geo;
}
function mergeGroup(g, shadows = true) {
  g.updateMatrixWorld(true);
  const bins = new Map();
  g.traverse(o => {
    if (!o.isMesh) return;
    const geo = cleanGeo(o.geometry.clone().applyMatrix4(o.matrixWorld));
    if (!bins.has(o.material)) bins.set(o.material, []);
    bins.get(o.material).push(geo);
  });
  const out = new THREE.Group();
  for (const [m, list] of bins) {
    const mesh = new THREE.Mesh(mergeGeometries(list, false), m);
    const noShadow = m === M.trlogo || m === M.walllogo || m === M.line || m === M.water || m === M.ground;
    mesh.castShadow = shadows && !noShadow && m !== M.asphalt && m !== M.pad && m !== M.grass && m !== M.sand;
    mesh.receiveShadow = m !== M.trlogo && m !== M.walllogo;
    out.add(mesh);
  }
  return out;
}
const protoCache = {};
function proto(key, build) { if (!protoCache[key]) protoCache[key] = mergeGroup(build()); return protoCache[key].clone(); }

/* ---------------- models ---------------- */
function buildTruck(cab) {
  const g = new THREE.Group();
  B(g, 'black', 9.0, 0.35, 1.9, 0, 0.55, 0);
  RB(g, 'white', 6.9, 2.6, 2.44, -1.2, 0.95, 0, 0.1);
  B(g, 'blue', 6.94, 0.3, 2.48, -1.2, 1.25, 0);
  for (let x = -4.25; x <= 2.0; x += 0.62) for (const s of [-1, 1]) B(g, 'grey', 0.07, 2.25, 0.05, x, 1.12, s * 1.235);
  P(g, UPlane, 'trlogo', 3.6, 0.9, 1, -1.0, 2.75, 1.27); P(g, UPlane, 'trlogo', 3.6, 0.9, 1, -1.0, 2.75, -1.27, 0, Math.PI, 0);
  B(g, 'grey', 0.05, 2.4, 0.05, -4.67, 1.02, 0);
  for (const z of [-0.85, -0.4, 0.4, 0.85]) B(g, 'chrome', 0.06, 2.2, 0.05, -4.68, 1.1, z);
  B(g, 'dark', 0.18, 0.26, 2.2, -4.55, 0.55, 0);
  for (const s of [-1, 1]) { B(g, 'tail', 0.06, 0.16, 0.34, -4.66, 0.6, s * 0.86); B(g, 'grey', 3.0, 0.5, 0.05, -1.0, 0.42, s * 1.12); }
  RB(g, cab, 2.2, 2.3, 2.35, 3.55, 0.75, 0, 0.24);
  RB(g, cab, 1.5, 0.6, 2.2, 3.2, 3.0, 0, 0.22);
  B(g, 'win', 0.06, 0.85, 2.0, 4.66, 1.95, 0);
  B(g, 'black', 0.08, 0.12, 2.1, 4.66, 2.82, 0);
  for (const s of [-1, 1]) {
    B(g, 'win', 0.95, 0.66, 0.06, 3.9, 1.98, s * 1.18);
    B(g, 'lamp', 0.07, 0.22, 0.42, 4.67, 1.0, s * 0.82);
    B(g, 'black', 0.12, 0.5, 0.1, 4.35, 1.85, s * 1.42);
    B(g, 'black', 0.06, 0.06, 0.3, 4.35, 2.3, s * 1.28);
    P(g, UC, 'chrome', 0.3, 0.9, 0.3, 2.0, 0.78, s * 0.98, 0, 0, Math.PI / 2);
    B(g, 'dark', 0.5, 0.08, 0.28, 3.95, 0.5, s * 1.18);
    P(g, UC8, 'chrome', 0.08, 1.4, 0.08, 2.55, 2.6, s * 0.9);
  }
  B(g, 'dark', 0.06, 0.72, 1.25, 4.66, 0.95, 0);
  for (const y of [1.08, 1.3, 1.52]) B(g, 'chrome', 0.07, 0.05, 1.25, 4.68, y, 0);
  RB(g, 'dark', 0.36, 0.4, 2.4, 4.6, 0.42, 0, 0.08);
  for (const x of [-3.9, -2.8, 2.1, 3.9]) for (const s of [-1, 1]) {
    P(g, UC, 'tire', 0.5, 0.36, 0.5, x, 0.5, s * 1.0, Math.PI / 2, 0, 0);
    P(g, UC, 'chrome', 0.25, 0.04, 0.25, x, 0.5, s * 1.19, Math.PI / 2, 0, 0);
  }
  return g;
}
function makeTruck(cab) { return proto('truck-' + cab, () => buildTruck(cab)); }
function buildTrailer() { // parked trailer, no cab
  const g = new THREE.Group();
  B(g, 'black', 7.2, 0.3, 1.9, -1.2, 0.6, 0);
  RB(g, 'white', 6.9, 2.6, 2.44, -1.2, 0.95, 0, 0.1);
  B(g, 'blue', 6.94, 0.3, 2.48, -1.2, 1.25, 0);
  for (let x = -4.25; x <= 2.0; x += 0.62) for (const s of [-1, 1]) B(g, 'grey', 0.07, 2.25, 0.05, x, 1.12, s * 1.235);
  P(g, UPlane, 'trlogo', 3.6, 0.9, 1, -1.0, 2.75, 1.27); P(g, UPlane, 'trlogo', 3.6, 0.9, 1, -1.0, 2.75, -1.27, 0, Math.PI, 0);
  for (const s of [-1, 1]) B(g, 'dark', 0.12, 0.9, 0.12, 1.6, 0, s * 0.8);
  for (const x of [-3.9, -2.8]) for (const s of [-1, 1]) P(g, UC, 'tire', 0.5, 0.36, 0.5, x, 0.5, s * 1.0, Math.PI / 2, 0, 0);
  return g;
}
function pallet(g, x, y, z, ry = 0, load = 'box', h = 1) {
  const p = new THREE.Group(); p.position.set(x, y, z); p.rotation.y = ry; g.add(p);
  B(p, 'wood', 1.2, 0.08, 1.0, 0, 0.0, 0);
  for (const zz of [-0.42, 0, 0.42]) B(p, 'wood', 1.2, 0.08, 0.14, 0, 0.08, zz);
  B(p, 'wood', 1.2, 0.05, 1.0, 0, 0.16, 0);
  if (load === 'box') {
    const lv = h; for (let k = 0; k < lv; k++) for (const xx of [-0.3, 0.3]) for (const zz of [-0.24, 0.24]) B(p, (k + (xx > 0 ? 1 : 0)) % 2 ? 'box' : 'box2', 0.56, 0.42, 0.46, xx, 0.21 + k * 0.43, zz);
  } else if (load === 'wrap') {
    RB(p, R() > .5 ? 'wrap' : 'wrap2', 1.12, 0.45 + h * 0.4, 0.94, 0, 0.21, 0, 0.06);
  }
  return p;
}
function buildForkBody() {
  const g = new THREE.Group();
  RB(g, 'orange', 1.75, 0.85, 1.2, 0, 0.3, 0, 0.12);
  RB(g, 'dark', 0.5, 0.95, 1.2, -1.05, 0.3, 0, 0.1);
  B(g, 'black', 0.55, 0.45, 0.6, -0.2, 1.15, 0);
  B(g, 'black', 0.14, 0.6, 0.6, -0.5, 1.4, 0);
  P(g, UC, 'black', 0.2, 0.05, 0.2, 0.25, 1.65, 0, 0, 0, 0.5);
  B(g, 'lamp', 0.06, 0.12, 0.16, 0.88, 0.95, 0.45); B(g, 'lamp', 0.06, 0.12, 0.16, 0.88, 0.95, -0.45);
  for (const x of [-0.62, 0.55]) for (const z of [-0.52, 0.52]) B(g, 'black', 0.07, 1.3, 0.07, x, 1.15, z);
  B(g, 'orange2', 1.4, 0.07, 1.14, 0, 2.45, 0);
  P(g, UC8, 'orange', 0.09, 0.09, 0.09, -0.1, 2.56, 0);
  for (const z of [-0.38, 0.38]) B(g, 'dark', 0.1, 2.9, 0.1, 0.95, 0.2, z);
  B(g, 'dark', 0.1, 0.1, 0.86, 0.95, 3.0, 0);
  for (const x of [-0.62, 0.62]) for (const s of [-1, 1]) { P(g, UC, 'tire', 0.28, 0.22, 0.28, x, 0.28, s * 0.56, Math.PI / 2, 0, 0); P(g, UC, 'grey', 0.14, 0.03, 0.14, x, 0.28, s * 0.68, Math.PI / 2, 0, 0); }
  // operator
  P(g, UC8, 'vest', 0.2, 0.5, 0.2, -0.25, 1.75, 0); P(g, UIco, 'skin', 0.15, 0.15, 0.15, -0.25, 2.12, 0); P(g, UIco, 'white', 0.17, 0.09, 0.17, -0.25, 2.22, 0);
  return g;
}
function buildForkCarriage() {
  const c = new THREE.Group();
  B(c, 'dark', 0.1, 0.65, 0.95, 0.0, 0, 0);
  for (const z of [-0.3, 0.3]) B(c, 'chrome', 1.25, 0.07, 0.14, 0.65, 0, z);
  return c;
}
function buildForkLoad() { const c = new THREE.Group(); pallet(c, 0.66, 0.07, 0, 0, 'box', 2); return c; }
function makeForklift() {
  const g = new THREE.Group();
  g.add(proto('fbody', buildForkBody));
  const car = new THREE.Group(); car.position.set(1.02, 0.15, 0); g.add(car);
  car.add(proto('fcar', buildForkCarriage));
  const load = proto('fload', buildForkLoad); car.add(load);
  g.userData.car = car; g.userData.load = load; return g;
}
function buildWorker() {
  const g = new THREE.Group();
  P(g, UC8, 'dark', 0.09, 0.5, 0.09, 0, 0.25, -0.1); P(g, UC8, 'dark', 0.09, 0.5, 0.09, 0, 0.25, 0.1);
  P(g, UC8, 'vest', 0.2, 0.6, 0.2, 0, 0.8, 0); P(g, UIco, 'skin', 0.14, 0.15, 0.14, 0, 1.25, 0); P(g, UIco, 'white', 0.16, 0.08, 0.16, 0, 1.36, 0);
  return g;
}
function tree(g, x, z, s = 1, kind = 0) {
  P(g, UC8, 'trunk', 0.18 * s, 1.6 * s, 0.18 * s, x, 0.8 * s, z);
  const m = ['green', 'green2', 'green3'][kind % 3];
  P(g, UIco, m, 1.25 * s, 1.5 * s, 1.25 * s, x, 2.6 * s, z, R(), R(), 0);
  if (R() > 0.5) P(g, UIco, m, 0.85 * s, 1.0 * s, 0.85 * s, x + 0.5 * s, 3.5 * s, z - 0.2 * s, R(), R(), 0);
}
function palm(g, x, z, s = 1) {
  P(g, UC8, 'trunk', 0.16 * s, 5 * s, 0.16 * s, x, 2.5 * s, z, 0.05, 0, 0.06);
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; P(g, UB, 'palm', 2.4 * s, 0.06, 0.5 * s, x + Math.cos(a) * 1.0 * s, 4.8 * s, z + Math.sin(a) * 1.0 * s, 0, -a, -0.45); }
}
function lampPost(g, x, z) { P(g, UC8, 'mid', 0.09, 6, 0.09, x, 3, z); B(g, 'mid', 1.4, 0.12, 0.2, x + 0.6, 5.95, z); B(g, 'lamp', 0.5, 0.08, 0.3, x + 1.1, 5.88, z); }

/* ---------------- world ---------------- */
const S = new THREE.Group(); // static, baked into one mesh per material
const ground = new THREE.Mesh(new THREE.PlaneGeometry(2400, 1600), M.ground);
ground.rotation.x = -Math.PI / 2; ground.position.set(190, 0, -100); ground.receiveShadow = true; scene.add(ground);
const SITES = [
  { key: 'jed', name: 'Jeddah Port', full: 'Jeddah Port DC', x: 0, kind: 'port', addr: 'Gate 4, North Port Logistics Zone, Jeddah 22312', area: '38,500 m²' },
  { key: 'khu', name: 'Al Khumrah', full: 'Al Khumrah Fulfilment', x: 190, kind: 'solar', addr: 'Plot 17, Al Khumrah Logistics Park, Jeddah 22526', area: '41,200 m²' },
  { key: 'ryd', name: 'Riyadh Hub', full: 'Riyadh Cross-dock Hub', x: 380, kind: 'desert', addr: 'Unit 9, Al Sulay Industrial Area, Riyadh 14322', area: '29,800 m²' }
];
const HWZ = 52;
// highway
B(S, 'asphalt', 900, 0.06, 11, 190, 0, HWZ);
for (let x = -255; x < 640; x += 6) B(S, 'line', 3, 0.02, 0.22, x, 0.06, HWZ);
for (const s of [-1, 1]) B(S, 'line', 900, 0.02, 0.16, 190, 0.06, HWZ + s * 5.1);
for (let x = -250; x < 640; x += 16 + R() * 10) { if ([0, 190, 380].some(c => Math.abs(x - c) < 75)) continue; tree(S, x, HWZ + 9 + R() * 6, 0.9 + R() * 0.5, (R() * 3) | 0); if (R() > 0.4) tree(S, x + 5, HWZ - 9 - R() * 5, 0.8 + R() * 0.5, (R() * 3) | 0); }
// filler low buildings between sites
for (const cx of [95, 285]) {
  for (let i = 0; i < 4; i++) { const bx = cx - 26 + i * 17 + R() * 4, bz = -20 + R() * 30, w = 9 + R() * 6, d = 8 + R() * 8, h = 3 + R() * 4;
    BU(S, i % 2 ? 'wallW' : 'wall2', w, h, d, bx, 0, bz, 1.6); B(S, 'roof', w + 0.4, 0.35, d + 0.4, bx, h, bz); }
  for (let i = 0; i < 10; i++) tree(S, cx - 35 + R() * 70, -40 + R() * 80, 0.8 + R() * 0.6, i);
}

const ENT = [];
const anim = [];
const containers = [];
const CONT_COL = [0x2f6fed, 0x5d95f3, 0xf1f4f8, 0x3bb3a8, 0xa9b6c6, 0x2f6fed, 0xf1f4f8, 0xf59e2b, 0x1f55c9];
function cont(x, y0, z, ry = 0, color) { containers.push({ x, y: y0 + 1.3, z, ry, color: color ?? CONT_COL[(R() * CONT_COL.length) | 0] }); }

function warehouseClosed(G, x0, z0, w, d, h, docks, solar) {
  BU(G, 'wall', w, h - 0.6, d, x0 + w / 2, 0.6, z0 + d / 2, 1.6);
  B(G, 'grey', w + 0.1, 0.6, d + 0.1, x0 + w / 2, 0, z0 + d / 2);
  B(G, 'fascia', w + 0.5, 0.9, d + 0.5, x0 + w / 2, h - 0.6, z0 + d / 2);
  B(G, 'roof', w + 0.3, 0.2, d + 0.3, x0 + w / 2, h + 0.3, z0 + d / 2);
  for (let i = 0; i < 4; i++) B(G, 'sky', w - 6, 0.12, 1.4, x0 + w / 2, h + 0.5, z0 + 4 + i * (d - 8) / 3);
  if (solar) {
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) P(G, UB, 'solar', 5.2, 0.12, 2.4, x0 + 5 + c * (w - 10) / 5, h + 1.1, z0 + 6.5 + r * 6, -0.35, 0, 0);
  } else {
    for (let i = 0; i < 3; i++) { B(G, 'grey', 2.2, 1.2, 1.6, x0 + 6 + i * 4, h + 0.4, z0 + 2.5); B(G, 'mid', 1.6, 0.1, 1.0, x0 + 6 + i * 4, h + 1.6, z0 + 2.5); }
  }
  // office corner with windows on +x face
  BU(G, 'wallW', 0.3, h - 1.6, 9, x0 + w + 0.1, 0.6, z0 + d - 5.5, 1.6);
  for (let k = 0; k < 2; k++) B(G, 'win', 0.12, 1.3, 7.6, x0 + w + 0.3, 2 + k * 3.2, z0 + d - 5.5);
  B(G, 'glass', 0.12, 2.4, 1.6, x0 + w + 0.3, 0.6, z0 + d - 1.8);
  // dock wall at z0+d facing +z
  const fz = z0 + d;
  for (const x of docks) {
    B(G, 'black', 4.3, 4.7, 0.5, x, 0.5, fz + 0.2);
    B(G, 'door', 3.5, 3.9, 0.1, x, 0.9, fz + 0.48);
    B(G, 'dark', 0.45, 4.4, 0.9, x - 2.0, 0.5, fz + 0.5); B(G, 'dark', 0.45, 4.4, 0.9, x + 2.0, 0.5, fz + 0.5); B(G, 'dark', 4.4, 0.5, 0.9, x, 4.6, fz + 0.5);
    for (const s of [-1, 1]) B(G, 'black', 0.35, 0.45, 0.35, x + s * 1.3, 0.7, fz + 1.05);
    B(G, 'yellow', 3.6, 0.02, 0.25, x, 0.125, fz + 1.4);
    B(G, 'lamp', 0.3, 0.3, 0.2, x + 2.6, 4.2, fz + 0.4);
    for (const s of [-1, 1]) B(G, 'line', 0.18, 0.02, 9.5, x + s * 2.4, 0.125, fz + 5.5);
  }
  B(G, 'blueD', w - 2, 0.35, 3.4, x0 + w / 2, 5.6, fz + 1.7);
  B(G, 'blue', w - 2, 0.12, 0.2, x0 + w / 2, 5.4, fz + 3.35);
  P(G, UPlane, 'walllogo', 15, 3.75, 1, x0 + w / 2, 7.9, fz + 0.32);
  // logo on +x side too
  P(G, UPlane, 'walllogo', 12, 3, 1, x0 + w + 0.32, 7.2, z0 + d / 2 - 4, 0, Math.PI / 2, 0);
}
function warehouseOpen(G, x0, z0, w, d, h) {
  B(G, 'pad2', w, 0.16, d, x0 + w / 2, 0, z0 + d / 2);
  BU(G, 'wall', w, h, 0.4, x0 + w / 2, 0, z0 + 0.2, 1.6);            // back wall
  BU(G, 'wall', 0.4, h, d, x0 + 0.2, 0, z0 + d / 2, 1.6);            // left wall
  BU(G, 'wall2', 0.4, 1.3, d, x0 + w - 0.2, 0, z0 + d / 2, 1.6);     // right low wall (cutaway)
  BU(G, 'wall2', 10, 1.3, 0.4, x0 + 5, 0, z0 + d - 0.2, 1.6);        // front low walls with opening
  BU(G, 'wall2', w - 18, 1.3, 0.4, x0 + 18 + (w - 18) / 2, 0, z0 + d - 0.2, 1.6);
  B(G, 'fascia', w + 0.3, 0.5, 0.6, x0 + w / 2, h, z0 + 0.2); B(G, 'fascia', 0.6, 0.5, d + 0.3, x0 + 0.2, h, z0 + d / 2);
  // steel frame (cutaway roof)
  for (let i = 0; i <= 5; i++) { const x = x0 + 0.4 + i * (w - 0.8) / 5;
    P(G, UB, 'steel', 0.3, h, 0.3, x, h / 2, z0 + d - 0.3);
    P(G, UB, 'steel', 0.25, 0.4, d, x, h + 0.2, z0 + d / 2);
  }
  for (let j = 0; j <= 3; j++) { const z = z0 + 0.3 + j * (d - 0.6) / 3; P(G, UB, 'steel', 0.3, h, 0.3, x0 + w - 0.3, h / 2, z); }
  P(G, UB, 'steel', w, 0.35, 0.25, x0 + w / 2, h + 0.2, z0 + d - 0.3);
  P(G, UB, 'steel', 0.25, 0.35, d, x0 + w - 0.3, h + 0.2, z0 + d / 2);
  // racks
  for (const rz of [z0 + 4, z0 + 9, z0 + 14]) {
    for (let x = x0 + 3; x <= x0 + w - 4; x += 2.7) for (const s of [-0.7, 0.7]) B(G, 'blueD', 0.12, 5.4, 0.12, x, 0.1, rz + s);
    for (const y of [0.25, 2.0, 3.75]) for (const s of [-0.7, 0.7]) B(G, 'orange', w - 6.8, 0.14, 0.1, x0 + w / 2 - 0.5, y, rz + s);
    for (const y of [0.4, 2.15, 3.9]) for (let x = x0 + 4.35; x < x0 + w - 4; x += 1.35) if (R() > 0.22) pallet(G, x, y, rz, Math.PI / 2, R() > 0.35 ? 'box' : 'wrap', 1 + ((R() * 2) | 0));
  }
  // conveyor along x near the front
  const cz = z0 + d - 4.5;
  B(G, 'black', w - 8, 0.12, 1.2, x0 + w / 2, 0.85, cz);
  for (const s of [-1, 1]) B(G, 'steel', w - 8, 0.25, 0.1, x0 + w / 2, 0.75, cz + s * 0.65);
  for (let x = x0 + 5; x <= x0 + w - 5; x += 3) for (const s of [-1, 1]) B(G, 'steel', 0.12, 0.8, 0.12, x, 0, cz + s * 0.6);
  B(G, 'grey', 2.4, 1.8, 2.0, x0 + w - 4.4, 0, cz); B(G, 'sky', 2.0, 0.6, 0.1, x0 + w - 4.4, 1.0, cz + 1.02);
  return { cz, cx0: x0 + 4.2, cx1: x0 + w - 5.6 };
}
function fence(G, x0, z0, x1, z1, gap) {
  const L = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(L / 4), a = Math.atan2(-(z1 - z0), x1 - x0);
  for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; if (gap && Math.abs(x - gap[0]) < gap[1] && Math.abs(z - gap[2]) < gap[1]) continue; P(G, UB, 'mid', 0.1, 1.8, 0.1, x, 0.9, z); }
  const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
  if (!gap) { P(G, UB, 'grey', L, 0.06, 0.05, mx, 1.7, mz, 0, a, 0); P(G, UB, 'grey', L, 0.06, 0.05, mx, 0.9, mz, 0, a, 0); }
}
function car(G, x, z, ry, c) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; G.add(g); RB(g, c, 4.0, 0.8, 1.8, 0, 0.3, 0, 0.25); RB(g, 'win', 2.1, 0.62, 1.6, -0.2, 1.0, 0, 0.2); for (const xx of [-1.3, 1.3]) for (const s of [-1, 1]) P(g, UC, 'tire', 0.33, 0.25, 0.33, xx, 0.33, s * 0.85, Math.PI / 2, 0, 0); }

/* ---------------- sites ---------------- */
const DEST = ['Makkah DC', 'Madinah store', 'Taif depot', 'Riyadh Hub', 'Yanbu plant', 'Dammam port', 'Abha hub', 'Tabuk store', 'Rabigh site'];
const DRIVERS = ['Faisal A.', 'Omar K.', 'Yousef S.', 'Imran Q.', 'Majed O.', 'Rashid A.', 'Tariq H.', 'Sami Z.', 'Naveed A.'];
const OPS = ['Bilal M.', 'Arif N.', 'Hassan R.', 'Zubair K.', 'Adnan S.', 'Khalid F.', 'Junaid P.', 'Waleed T.', 'Asif L.'];
const CARGO = ['FMCG, 22 pallets', 'Electronics, 16 pallets', 'Dates and food, 24 pallets', 'Spare parts, 12 pallets', 'Furniture, 18 pallets', 'Pharma (cool), 14 pallets', 'Textiles, 20 pallets', 'Building supplies, 26 pallets', 'Home appliances, 18 pallets'];
const conveyors = [];
const smooth = x => x * x * (3 - 2 * x);
const clamp01 = x => Math.max(0, Math.min(1, x));

function buildSite(si) {
  const site = SITES[si], o = site.x, G = new THREE.Group(); G.position.x = o; S.add(G);
  const port = site.kind === 'port', desert = site.kind === 'desert';
  const pz0 = port ? -46 : -34;
  B(G, 'pad', 126, 0.12, 38 - pz0, 3, 0, (38 + pz0) / 2);
  if (desert) { P(S, UC, 'sand', 150, 0.05, 150, o + 3, 0.0, 0); P(S, UC, 'sand2', 60, 0.06, 40, o - 90, 0, 60); }
  else { B(G, 'grass', 126, 0.04, 12, 3, 0, 44); }
  // yard roads
  B(G, 'asphalt', 122, 0.05, 7, 3, 0.12, 17); B(G, 'asphalt', 122, 0.05, 7, 3, 0.12, 32);
  B(G, 'asphalt', 7, 0.05, 22, -55, 0.12, 24.5); B(G, 'asphalt', 7, 0.05, 22, 61, 0.12, 24.5);
  B(G, 'asphalt', 7, 0.17, 15, 0, 0, 43);
  for (let x = -50; x <= 56; x += 5) { B(G, 'line', 2.2, 0.02, 0.18, x, 0.17, 17); B(G, 'line', 2.2, 0.02, 0.18, x, 0.17, 32); }
  for (let z = 37; z <= 49; z += 4) B(G, 'line', 0.18, 0.02, 2, 0, 0.17, z);
  const code = site.key[0].toUpperCase();
  warehouseClosed(G, -44, -28, 42, 28, 10, [-38, -31, -24, -17, -10], site.kind === 'solar');
  const wb = warehouseOpen(G, 8, -26, 30, 24, 7);
  // docked parked trailers
  for (const xd of [-38, -24]) { const tr = proto('trailer', buildTrailer); tr.position.set(xd, 0.12, 4.9); tr.rotation.y = -Math.PI / 2; G.add(tr); }
  // staging in front of hall B
  for (let x = 10; x <= 36; x += 1.6) for (const z of [4.5, 6.2, 8.4]) { if (Math.abs(x - 22) < 2.4 || R() < 0.25) continue; pallet(G, x, 0.12, z, 0, R() > 0.45 ? 'box' : 'wrap', 1 + ((R() * 2) | 0)); }
  // east yard
  if (port) {
    for (let x = 43; x <= 59; x += 2.7) for (let z = -26; z <= 2; z += 6.6) { if (Math.abs(x - 52) < 2.4) continue; const n = 1 + ((R() * 3) | 0); for (let k = 0; k < n; k++) cont(x, 0.12 + k * 2.6, z, Math.PI / 2); }
  } else {
    for (let x = 44; x <= 60; x += 1.5) for (let z = -27; z <= 6; z += 1.3) { if (Math.abs(x - 52) < 2.2 || R() < 0.3) continue; pallet(G, x, 0.12, z, 0, R() > 0.5 ? 'box' : 'wrap', 1 + ((R() * 3) | 0)); }
  }
  // west yard
  for (let x = -58; x <= -48; x += 1.5) for (let z = -27; z <= 8; z += 1.3) { if (Math.abs(x - -53) < 1.2 || R() < 0.35) continue; pallet(G, x, 0.12, z, 0, 'wrap', 1 + ((R() * 3) | 0)); }
  // loop interior: parked trailers, office, cars
  for (const x of [14, 24, 34, 44, 54]) { if (R() < 0.15) continue; const tr = proto('trailer', buildTrailer); tr.position.set(x, 0.12, 24.6); G.add(tr); }
  for (const x of [12, 22, 32, 42, 52]) B(G, 'line', 0.16, 0.02, 7, x - 3.5, 0.13, 24.6);
  BU(G, 'wallW', 15, 7, 7, -40, 0.12, 24.5, 1.6);
  for (const y of [1.2, 4.4]) B(G, 'win', 15.1, 1.5, 7.1, -40, y, 24.5);
  B(G, 'blue', 15.4, 0.5, 7.4, -40, 7.1, 24.5);
  P(G, UPlane, 'walllogo', 8, 2, 1, -40, 6.0, 28.06);
  const cc = ['white', 'grey', 'blue', 'dark', 'white', 'redL', 'grey'];
  for (let i = 0; i < 7; i++) if (R() > 0.2) car(G, -28 + i * 3.8, 24.5 + (R() - .5) * 0.6, Math.PI / 2, cc[i]);
  // guard house + barrier
  B(G, 'wallW', 3, 2.8, 3, 6, 0, 42); B(G, 'win', 3.1, 1.0, 3.1, 6, 1.4, 42); B(G, 'blue', 3.6, 0.35, 3.6, 6, 2.8, 42);
  B(G, 'redL', 6, 0.15, 0.15, 1.5, 1.0, 39.5);
  // fences + lamps + greenery
  fence(G, -60, 38, -3.8, 38); fence(G, 3.8, 38, 66, 38); fence(G, -60, pz0, -60, 38); fence(G, 66, pz0, 66, 38);
  if (!port) fence(G, -60, pz0, 66, pz0);
  for (let x = -50; x <= 60; x += 22) lampPost(G, x, 21.2);
  for (let x = -44; x <= 60; x += 26) lampPost(G, x, 36);
  const plant = (x, z, s) => desert ? palm(G, x, z, s * 0.85) : tree(G, x, z, s, (R() * 3) | 0);
  for (let x = -58; x <= 64; x += 6 + R() * 4) { if (Math.abs(x) < 7) continue; plant(x, 41 + R() * 6, 0.9 + R() * 0.4); }
  for (let z = -28; z <= 34; z += 7 + R() * 4) { plant(-66 - R() * 4, z, 1 + R() * 0.4); plant(72 + R() * 4, z, 1 + R() * 0.4); }
  if (!port) for (let x = -56; x <= 62; x += 7 + R() * 5) plant(x, -40 - R() * 5, 1 + R() * 0.5);
  if (port) {
    for (let x = -55; x <= 60; x += 6.5) for (const z of [-39.5, -42.2]) { if (R() < 0.2) continue; const n = 1 + ((R() * 3) | 0); for (let k = 0; k < n; k++) cont(x, 0.12 + k * 2.6, z, 0); }
    B(G, 'grey', 126, 1.2, 1.2, 3, -1.08, -46.4);
    // quay crane
    for (const s of [-1, 1]) { P(G, UB, 'blue', 0.8, 26, 0.8, 18 + s * 6, 13, -44.5); P(G, UB, 'blue', 0.8, 26, 0.8, 18 + s * 6, 13, -36.5); }
    P(G, UB, 'blue', 14, 1.2, 1.2, 18, 26, -44.5); P(G, UB, 'blue', 14, 1.2, 1.2, 18, 26, -36.5);
    P(G, UB, 'blueD', 1.6, 1.4, 46, 18, 27.4, -52); B(G, 'white', 3.4, 2.6, 3, 18, 24.4, -44);
    // water + ship
    const water = new THREE.Mesh(new THREE.PlaneGeometry(420, 360), M.water); water.rotation.x = -Math.PI / 2; water.position.set(o, 0.05, -228); water.receiveShadow = true; scene.add(water);
    B(G, 'grey', 420, 0.5, 2, 3, -0.4, -47.5);
  }
  // dynamic: trucks
  const docks = [-31, -17, -10];
  const trucks = docks.map((xd, k) => {
    const Ps = V(o + xd - 10, 0.17, 17), Pd = V(o + xd, 0.17, 4.9);
    const bez = new THREE.CubicBezierCurve3(Ps, V(o + xd - 1, 0.17, 17), V(o + xd, 0.17, 13.5), Pd);
    const pts = [Ps, V(Ps.x - 6, 0.17, 17), V(o - 51, 0.17, 17), V(o - 55, 0.17, 21), V(o - 55, 0.17, 28), V(o - 51, 0.17, 32), V(o + 57, 0.17, 32), V(o + 61, 0.17, 28), V(o + 61, 0.17, 21), V(o + 57, 0.17, 17), V(Ps.x + 12, 0.17, 17)];
    const route = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
    const obj = makeTruck(k === 1 ? 'white' : 'blue'); scene.add(obj);
    const D = { rev: 7, load: 13, out: 6, loop: route.getLength() / 8.5 }; D.cycle = D.rev + D.load + D.out + D.loop;
    const n = si * 3 + k;
    const e = { type: 'truck', site: si, obj, h: 4.2, r: 6.2, id: 'TRK-' + (1042 + n * 37), driver: DRIVERS[n], dock: 'D' + ([-38, -31, -24, -17, -10].indexOf(xd) + 1), off: D.cycle * (k / 3) + si * 5 + 4, D, bez, route, st: {} };
    e.update = t => truckUpdate(e, t); ENT.push(e); return e;
  });
  // forklifts
  const fdefs = [[V(22, 0.12, -3.6), V(22, 0.12, 7.4), 0.5], [V(52, 0.12, -22), V(52, 0.12, 8), 0.6], [V(12.5, 0.12, -14.5), V(33, 0.12, -14.5), 2.0]];
  fdefs.forEach(([A, Bp, lift], k) => {
    A.x += o; Bp.x += o;
    const obj = makeForklift(); scene.add(obj);
    const n = si * 3 + k, dist = A.distanceTo(Bp), tr = dist / 3.4;
    const e = { type: 'forklift', site: si, obj, h: 3.6, r: 2.6, id: 'FL-' + String(3 + n * 2).padStart(2, '0'), op: OPS[n], zone: ['Staging lane', 'East yard', 'Aisle 2, Hall B'][k], A, B: Bp, lift, D: { go: tr, drop: 2.2, back: tr, pick: 2.2 }, off: k * 3.1 + si, bat: 62 + ((n * 17) % 35), picks: 38 + n * 7, st: {} };
    e.D.cycle = e.D.go + e.D.drop + e.D.back + e.D.pick;
    e.update = t => forkUpdate(e, t); ENT.push(e);
  });
  // warehouses
  ENT.push({ type: 'warehouse', site: si, pos: V(o - 23, 0, -14), h: 12.5, r: 26, id: 'WH-' + code + '1', name: 'Main DC, 5 dock doors', cap: [86, 78, 91][si], inb: [146, 188, 121][si], outb: [173, 202, 139][si], temp: site.kind === 'desert' ? '24°C' : '22°C', staff: [48, 56, 39][si], area: ['11,800 m²', '12,400 m²', '9,600 m²'][si], sz: [42, 10, 28] });
  ENT.push({ type: 'warehouse', site: si, pos: V(o + 23, 0, -14), h: 9.5, r: 20, id: 'WH-' + code + '2', name: 'Pick and pack hall', cap: [72, 81, 66][si], inb: [64, 92, 51][si], outb: [98, 117, 74][si], temp: '21°C', staff: [31, 37, 24][si], area: ['7,200 m²', '7,200 m²', '6,100 m²'][si], sz: [30, 7, 24], open: true });
  // conveyor boxes (instanced)
  const cb = new THREE.InstancedMesh(UB, M.box, 12); cb.castShadow = cb.receiveShadow = true; scene.add(cb);
  conveyors.push({ mesh: cb, x0: o + wb.cx0, x1: o + wb.cx1, z: wb.cz, n: 12 });
  // workers
  const wk = [[V(13, 0.12, 2.6), V(33, 0.12, 2.6)], [V(20, 0.16, -8.6), V(31, 0.16, -8.6)], [V(-53, 0.12, -12), V(-53, 0.12, 8)], [V(-40, 0.12, 12.2), V(-14, 0.12, 12.2)]];
  wk.forEach(([a, b], k) => { a.x += o; b.x += o; const w = proto('worker', buildWorker); scene.add(w); const L = a.distanceTo(b), sp = 1.2; const off = k * 4.3 + si * 2;
    anim.push(t => { const c = 2 * L / sp; let ph = ((t + off) % c) / c; const fwd = ph < 0.5; const f = fwd ? ph * 2 : (1 - ph) * 2; w.position.lerpVectors(a, b, f); w.position.y += Math.abs(Math.sin(t * 7 + k)) * 0.06; const d = fwd ? b.clone().sub(a) : a.clone().sub(b); w.rotation.y = Math.atan2(-d.z, d.x); }); });
  return { trucks };
}

/* ---------------- simulation ---------------- */
function truckUpdate(e, t) {
  const D = e.D, st = e.st, o = e.obj; const tt = t + e.off; const cyc = Math.floor(tt / D.cycle); let ph = tt - cyc * D.cycle;
  st.cyc = cyc; let tg;
  if (ph < D.rev) { const s = smooth(ph / D.rev); o.position.copy(e.bez.getPoint(s)); tg = e.bez.getTangent(s); st.phase = 'rev'; st.f = ph / D.rev; st.rem = D.rev - ph + D.load + D.out + D.loop * 0.85; }
  else if ((ph -= D.rev) < D.load) { o.position.copy(e.bez.v3); tg = e.bez.getTangent(1); st.phase = 'load'; st.f = ph / D.load; st.rem = D.load - ph + D.out + D.loop * 0.85; }
  else if ((ph -= D.load) < D.out) { const s = 1 - smooth(ph / D.out); o.position.copy(e.bez.getPoint(s)); tg = e.bez.getTangent(s); st.phase = 'out'; st.f = ph / D.out; st.rem = D.out - ph + D.loop * 0.85; }
  else {
    ph -= D.out; const x = ph / D.loop; const u = 0.78 * x + 0.22 * (0.5 - 0.5 * Math.cos(Math.PI * x));
    o.position.copy(e.route.getPointAt(u)); const t2 = e.route.getTangentAt(u); o.rotation.y = Math.atan2(-t2.z, t2.x);
    st.phase = 'loop'; st.f = x; st.rem = Math.max(0, D.loop * (0.85 - x)); return;
  }
  o.rotation.y = Math.atan2(tg.z, -tg.x);
}
function truckInfo(e) {
  const st = e.st, n = ENT.indexOf(e), c = st.cyc || 0;
  const dest = DEST[(n + c) % DEST.length], cargo = CARGO[(n * 2 + c) % CARGO.length];
  const shp = 'SHP-' + (58213 + n * 131 + c * 17);
  let stage, frac, chip, cls, status, pl, pv;
  if (st.phase === 'rev') { stage = 1; frac = st.f; chip = 'Reversing to ' + e.dock; cls = 'amber'; pl = 'Docking'; pv = st.f; }
  else if (st.phase === 'load') { stage = 2; frac = st.f; chip = 'Loading at ' + e.dock; cls = 'amber'; pl = 'Loaded'; pv = st.f; }
  else if (st.phase === 'out') { stage = 3; frac = 0.04 * st.f; chip = 'Departing ' + e.dock; cls = 'blue'; pl = 'Route progress'; pv = 0.02 * st.f; }
  else if (st.f < 0.85) { stage = 3; frac = st.f / 0.85; chip = 'In transit to ' + dest; cls = ''; pl = 'Route progress'; pv = st.f / 0.85; }
  else { stage = 4; frac = 1; chip = 'Delivered to ' + dest; cls = ''; pl = 'Route progress'; pv = 1; }
  const etaMin = Math.max(0, Math.round(st.rem * 1.6));
  const speed = st.phase === 'loop' ? (st.f < 0.85 ? 62 + Math.round(Math.sin(performance.now() / 900 + n) * 6) : 34) : st.phase === 'load' ? 0 : 7;
  const pallets = parseInt(cargo.match(/(\d+) pallets/)[1], 10);
  const loaded = st.phase === 'rev' ? 0 : st.phase === 'load' ? Math.round(pallets * st.f) : pallets;
  return { dest, cargo, shp, stage, frac, chip, cls, pl, pv, etaMin, speed, pallets, loaded, weight: (pallets * 0.82).toFixed(1) + ' t' };
}
function forkUpdate(e, t) {
  const D = e.D, st = e.st, o = e.obj, car = o.userData.car, load = o.userData.load;
  let ph = (t + e.off) % D.cycle; const dx = e.B.x - e.A.x, dz = e.B.z - e.A.z; o.rotation.y = Math.atan2(-dz, dx);
  const hiY = e.lift > 1 ? e.lift : 0.15, carry = 0.5;
  if (ph < D.go) { const f = smooth(ph / D.go); o.position.lerpVectors(e.A, e.B, f); car.position.y = carry; load.visible = true; st.phase = 'go'; st.f = ph / D.go; }
  else if ((ph -= D.go) < D.drop) { o.position.copy(e.B); const f = ph / D.drop; car.position.y = f < 0.5 ? carry + (hiY + 0.12 - carry) * smooth(f * 2) : (hiY + 0.12) + (0.3 - hiY - 0.12) * smooth((f - 0.5) * 2); load.visible = f < 0.55; st.phase = 'drop'; st.f = f; }
  else if ((ph -= D.drop) < D.back) { const f = smooth(ph / D.back); o.position.lerpVectors(e.B, e.A, f); car.position.y = 0.3; load.visible = false; st.phase = 'back'; st.f = ph / D.back; }
  else { ph -= D.back; o.position.copy(e.A); const f = ph / D.pick; car.position.y = 0.15 + (carry - 0.15) * smooth(clamp01((f - 0.35) / 0.65)); load.visible = f > 0.35; st.phase = 'pick'; st.f = f; }
}
function forkInfo(e) {
  const st = e.st, n = ENT.indexOf(e);
  const pal = 'P-' + (3381 + n * 29 + Math.floor((performance.now() / 1000 + e.off) / e.D.cycle) % 50);
  const dest = e.lift > 1 ? 'Rack B2, level 2' : e.zone === 'Staging lane' ? 'Staging lane 3' : 'Yard bay E4';
  const m = { go: ['Carrying ' + pal, '', 'Trip progress', st.f], drop: ['Placing ' + pal, 'amber', 'Placing', st.f], back: ['Returning empty', 'blue', 'Trip progress', st.f], pick: ['Picking up pallet', 'amber', 'Lifting', st.f] }[st.phase];
  return { chip: m[0], cls: m[1], pl: m[2], pv: m[3], pal, dest, speed: (st.phase === 'go' || st.phase === 'back') ? '9 km/h' : '0 km/h' };
}

/* highway traffic */
for (let i = 0; i < 8; i++) {
  const dir = i % 2 ? 1 : -1, tr = makeTruck(i % 3 ? 'blue' : 'white'); scene.add(tr);
  const z = HWZ + (dir > 0 ? 2.6 : -2.6), x0 = -230 + i * 109, sp = 12 + (i % 3) * 1.5;
  tr.rotation.y = dir > 0 ? 0 : Math.PI;
  anim.push(t => { let x = x0 + dir * sp * t; x = ((x + 240) % 880 + 880) % 880 - 240; tr.position.set(x, 0.06, z); });
}
for (let si = 0; si < 3; si++) SITES[si].sim = buildSite(si);

/* port ship */
{
  const ship = new THREE.Group(); ship.position.set(-6, 0, -66); scene.add(ship);
  const hull = new THREE.Group();
  RB(hull, 'blueD', 70, 4.5, 12, 0, -1.5, 0, 0.8); B(hull, 'redL', 70.2, 0.8, 12.2, 0, -1.6, 0); B(hull, 'white', 70.4, 0.25, 12.4, 0, 2.9, 0);
  BU(hull, 'wallW', 7, 9, 10, -29, 3, 0, 1.6); B(hull, 'win', 7.1, 1.0, 10.1, -29, 10, 0); B(hull, 'blue', 2, 3, 2, -30, 12, 0);
  ship.add(mergeGroup(hull));
  const sc = new THREE.Group(); ship.add(sc);
  for (let x = -22; x <= 30; x += 6.4) for (const z of [-3.7, -1.2, 1.3, 3.8]) { const n = 1 + ((R() * 3) | 0); for (let k = 0; k < n; k++) containers.push({ x: x - 6, y: 4.3 + k * 2.6, z: z - 66, ry: Math.PI / 2 * 0, color: CONT_COL[(R() * CONT_COL.length) | 0], ship: true }); }
  
}
/* containers, instanced */
{
  const im = new THREE.InstancedMesh(UB, M.cont, containers.length); im.castShadow = im.receiveShadow = true;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = V(6, 2.6, 2.45), c = new THREE.Color(), e = new THREE.Euler();
  containers.forEach((k, i) => { q.setFromEuler(e.set(0, k.ry, 0)); m4.compose(V(k.x, k.y, k.z), q, s); im.setMatrixAt(i, m4); im.setColorAt(i, c.setHex(k.color)); });
  scene.add(im);
}
/* bake static world */
const world = mergeGroup(S); scene.add(world);
setLoad(0.7);

/* pick proxies for warehouses */
const proxyMat = new THREE.MeshBasicMaterial({ visible: false });
const pickables = [];
for (const e of ENT) {
  if (e.type === 'warehouse') { const m = new THREE.Mesh(UB, proxyMat); m.scale.set(e.sz[0], e.sz[1] + 1, e.sz[2]); m.position.set(e.pos.x, (e.sz[1] + 1) / 2, e.pos.z); m.userData.ent = e; scene.add(m); pickables.push(m); }
  else { e.obj.traverse(o => { o.userData.ent = e; }); pickables.push(e.obj); }
}
const ring = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 64), new THREE.MeshBasicMaterial({ color: 0x2f6fed, transparent: true, opacity: 0.85, depthWrite: false }));
ring.rotation.x = -Math.PI / 2; ring.renderOrder = 2; ring.visible = false; scene.add(ring);
const ring2 = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ color: 0x2f6fed, transparent: true, opacity: 0.12, depthWrite: false }));
ring2.rotation.x = -Math.PI / 2; ring2.renderOrder = 1; ring2.visible = false; scene.add(ring2);

/* ---------------- camera ---------------- */
const D2R = Math.PI / 180;
const camS = { tgt: V(20, 0, -10), dist: 330, az: 0.1, el: 1.1 };
const goal = { tgt: camS.tgt.clone(), dist: camS.dist, az: camS.az, el: camS.el };
let follow = null, fly = null, curSite = 0, selected = null, tracked = null;
let W = innerWidth, H = innerHeight, safe = { x: 0, y: 0, w: W, h: H };
const mqPhone = matchMedia('(max-width:899px)');
const _v = V(0, 0, 0), _v2 = V(0, 0, 0);
function aim(e, out) { if (e.obj) out.copy(e.obj.position); else out.copy(e.pos); out.y = e.type === 'warehouse' ? e.h * 0.3 : e.h * 0.32; return out; }
function fitDist(r) { const th = Math.tan(cam.fov * D2R / 2); return r / Math.min(th * Math.max(safe.h, H * 0.42) / H, th * Math.max(safe.w, W * 0.55) / H); }
function siteShot(i) { return { tgt: V(SITES[i].x + 4, 0, -2), dist: fitDist(mqPhone.matches ? 58 : 66), az: 0.62, el: 0.66 }; }
function entShot(e) {
  if (e.type === 'truck') return { ent: e, dist: fitDist(mqPhone.matches ? 7.5 : 8.5), el: 0.4, az: null };
  if (e.type === 'forklift') return { ent: e, dist: fitDist(mqPhone.matches ? 5.2 : 5.6), el: e.lift > 1 ? 0.95 : 0.6, az: null };
  return { ent: e, dist: fitDist(e.open ? 17 : 21), el: e.open ? 0.82 : 0.6, az: e.open ? 0.5 : 0.35 };
}
const easeIO = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const wrapA = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
let clockT = 0;
function flyTo(shot, dur = 1.6, bump = 0) {
  const az = shot.az == null ? camS.az + 0.35 : shot.az;
  fly = { t0: clockT, dur: REDUCED ? 0.01 : dur, f: { tgt: camS.tgt.clone(), dist: camS.dist, az: camS.az, el: camS.el }, shot: { ...shot, az: camS.az + wrapA(az - camS.az) }, bump };
  follow = null;
}
function camUpdate(dt, now) {
  if (fly) {
    const k = clamp01((clockT - fly.t0) / fly.dur), e = easeIO(k), s = fly.shot;
    const end = s.ent ? aim(s.ent, _v2) : s.tgt;
    camS.tgt.lerpVectors(fly.f.tgt, end, e);
    camS.dist = fly.f.dist + (s.dist - fly.f.dist) * e + fly.bump * Math.sin(Math.PI * e);
    camS.az = fly.f.az + (s.az - fly.f.az) * e;
    camS.el = fly.f.el + (s.el - fly.f.el) * e;
    if (k >= 1) { goal.tgt.copy(end); goal.dist = s.dist; goal.az = s.az; goal.el = s.el; follow = s.ent || null; fly = null; }
  } else {
    if (follow) aim(follow, goal.tgt);
    const userBusy = now - lastInteract < 2500;
    if (!userBusy && !REDUCED) goal.az += dt * (follow ? (follow.type === 'warehouse' ? 0.05 : 0.11) : 0.035);
    const kt = 1 - Math.exp(-dt * (follow ? 7 : 4)), k = 1 - Math.exp(-dt * 3.5);
    camS.tgt.lerp(goal.tgt, kt); camS.dist += (goal.dist - camS.dist) * k; camS.az += (goal.az - camS.az) * k; camS.el += (goal.el - camS.el) * k;
  }
  const ce = Math.cos(camS.el);
  cam.position.set(camS.tgt.x + camS.dist * Math.sin(camS.az) * ce, camS.tgt.y + camS.dist * Math.sin(camS.el), camS.tgt.z + camS.dist * Math.cos(camS.az) * ce);
  cam.lookAt(camS.tgt);
  scene.fog.near = camS.dist * 0.9 + 60; scene.fog.far = camS.dist * 1.6 + 300;
  // shadows follow the view
  const half = Math.max(16, Math.min(120, camS.dist * 0.5));
  sun.position.copy(camS.tgt).addScaledVector(SUN_DIR, 160); sun.target.position.copy(camS.tgt);
  const sc = sun.shadow.camera; if (Math.abs(sc.right - half) > half * 0.08) { sc.left = -half; sc.right = half; sc.top = half; sc.bottom = -half; sc.updateProjectionMatrix(); }
}
function computeSafe() {
  W = innerWidth; H = innerHeight;
  const tb = Math.max($('.top').getBoundingClientRect().bottom, $('.kpis').getBoundingClientRect().bottom) + 6;
  const pr = $('#panel').getBoundingClientRect();
  let l = 0, r = W, t = tb, b = H;
  if (mqPhone.matches) b = pr.top - 6;
  else { l = $('.rail').getBoundingClientRect().right + 8; r = pr.left - 8; b = $('#tl').getBoundingClientRect().top - 6; }
  safe = { x: l, y: t, w: Math.max(100, r - l), h: Math.max(100, b - t) };
  const dx = W / 2 - (safe.x + safe.w / 2), dy = H / 2 - (safe.y + safe.h / 2);
  cam.aspect = W / H; cam.setViewOffset(W, H, dx, dy, W, H); cam.updateProjectionMatrix();
}
function resize() {
  W = innerWidth; H = innerHeight; renderer.setSize(W, H, false);
  placeTimeline(); computeSafe();
  if (!fly) { if (selected) goal.dist = entShot(selected).dist; else goal.dist = siteShot(curSite).dist; }
}
function placeTimeline() { const tl = $('#tl'); if (mqPhone.matches) { if (tl.parentElement.id !== 'tlSlotPhone') $('#tlSlotPhone').appendChild(tl); } else if (tl.parentElement.id === 'tlSlotPhone') $('.ui').insertBefore(tl, $('.credit-dt')); }
addEventListener('resize', resize);
new ResizeObserver(() => computeSafe()).observe($('#panel'));

/* ---------------- input ---------------- */
let lastInteract = -1e9;
const ptrs = new Map(); let downT = 0, downXY = [0, 0], dragMoved = false, pinch0 = 0, mid0 = null;
function interacted() { lastInteract = performance.now(); tourPaused = true; }
canvas.addEventListener('pointerdown', e => {
  canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, b: e.button });
  if (ptrs.size === 1) { downT = performance.now(); downXY = [e.clientX, e.clientY]; dragMoved = false; }
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); mid0 = [(a.x + b.x) / 2, (a.y + b.y) / 2]; dragMoved = true; }
});
function pan(dx, dy) {
  if (follow) follow = null; if (fly) { fly = null; goal.tgt.copy(camS.tgt); }
  const s = camS.dist * 0.0017, ca = Math.cos(camS.az), sa = Math.sin(camS.az);
  goal.tgt.x += (-ca * dx - sa * dy) * s; goal.tgt.z += (sa * dx - ca * dy) * s;
  goal.tgt.x = Math.max(-120, Math.min(500, goal.tgt.x)); goal.tgt.z = Math.max(-110, Math.min(90, goal.tgt.z));
}
canvas.addEventListener('pointermove', e => {
  const p = ptrs.get(e.pointerId); if (!p) return;
  const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
  if (ptrs.size === 1) {
    if (!dragMoved && Math.hypot(e.clientX - downXY[0], e.clientY - downXY[1]) > 7) { dragMoved = true; interacted(); }
    if (!dragMoved) return;
    if (p.b === 2 || e.shiftKey) { pan(dx, dy); return; }
    if (fly) { fly = null; goal.tgt.copy(camS.tgt); }
    goal.az -= dx * 0.006; camS.az -= dx * 0.006;
    goal.el = Math.max(0.2, Math.min(1.25, goal.el + dy * 0.004)); camS.el = goal.el;
  } else if (ptrs.size === 2) {
    interacted();
    const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y), m = [(a.x + b.x) / 2, (a.y + b.y) / 2];
    if (pinch0 > 0) { const s = pinch0 / d; goal.dist = Math.max(8, Math.min(420, goal.dist * s)); camS.dist = goal.dist; }
    if (mid0) pan(m[0] - mid0[0], m[1] - mid0[1]);
    pinch0 = d; mid0 = m;
  }
});
function endPtr(e) {
  if (!ptrs.has(e.pointerId)) return;
  if (ptrs.size === 1 && !dragMoved && performance.now() - downT < 600) pickAt(e.clientX, e.clientY);
  ptrs.delete(e.pointerId); if (ptrs.size < 2) { pinch0 = 0; mid0 = null; }
}
canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); });
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('wheel', e => { e.preventDefault(); interacted(); if (fly) { fly = null; goal.tgt.copy(camS.tgt); } goal.dist = Math.max(8, Math.min(420, goal.dist * Math.exp(e.deltaY * 0.0012))); }, { passive: false });
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pickAt(x, y) {
  interacted();
  ndc.set(x / W * 2 - 1, -(y / H) * 2 + 1); ray.setFromCamera(ndc, cam);
  const hits = ray.intersectObjects(pickables, true);
  let ent = null;
  for (const h of hits) { if (h.object.userData.ent && h.object.userData.ent.type !== 'warehouse') { ent = h.object.userData.ent; break; } }
  if (!ent) { // generous screen-space fallback for small moving things
    let best = 44;
    for (const e of ENT) { if (e.type === 'warehouse' || e.site !== curSite) continue; aim(e, _v).project(cam); const sx = (_v.x + 1) / 2 * W, sy = (1 - _v.y) / 2 * H; const d = Math.hypot(sx - x, sy - y); if (_v.z < 1 && d < best) { best = d; ent = e; } }
  }
  if (!ent) for (const h of hits) if (h.object.userData.ent) { ent = h.object.userData.ent; break; }
  if (ent) select(ent);
}

/* ---------------- UI ---------------- */
const ICON = {
  truck: '<svg viewBox="0 0 24 24"><path d="M2 6h12v9H2zM14 9h4l3 3v3h-7z"/><circle cx="6" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>',
  forklift: '<svg viewBox="0 0 24 24"><path d="M4 8h6l2 6H4zM14 4v14h7M4 14v3"/><circle cx="6" cy="18" r="2"/><circle cx="11" cy="18" r="2"/></svg>',
  warehouse: '<svg viewBox="0 0 24 24"><path d="M3 9 12 4l9 5v11H3zM7 20v-7h10v7M7 16h10"/></svg>',
  site: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>'
};
const X = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>';
const pbody = $('#pbody');
const cellX = (k, label) => `<div class="cell x2"><small>${label}</small><b data-k="${k}">-</b></div>`;
const cell = (k, label) => `<div class="cell"><small>${label}</small><b data-k="${k}">-</b></div>`;
function head(type, sup, title, close = true) {
  return `<div class="p-head"><div class="p-ico">${ICON[type]}</div><div class="p-t"><small>${sup}</small><b>${title}</b></div>${close ? `<button class="close" data-act="close" aria-label="Close details">${X}</button>` : ''}</div>`;
}
const progHTML = `<div class="prog"><div class="row"><span data-k="pl">Progress</span><b data-k="pv">0%</b></div><div class="bar"><i data-k="pb"></i></div></div>`;
function renderPanel() {
  const e = selected, si = curSite, site = SITES[si];
  if (!e) {
    const ents = ENT.filter(x => x.site === si);
    pbody.innerHTML = head('site', 'Location', site.full, false) + `<span class="chip" data-k="chip">Operational</span>` + progHTML.replace('Progress', 'Capacity used') +
      `<div class="grid hide-min site-grid">${cell('a', 'Warehouses')}${cell('b', 'Trucks + trailers')}${cell('c', 'Docks busy')}${cell('d', 'Forklifts')}</div>` +
      `<div class="p-sec hide-min">Tap to inspect</div><div class="picks hide-min">${ents.map(x => `<button class="pick" data-id="${x.id}"><i class="${x.type === 'forklift' ? 'f' : x.type === 'warehouse' ? 'w' : ''}"></i>${x.id}</button>`).join('')}</div>` +
      `<p class="addr hide-min">${site.addr}<br>Site area ${site.area}. Mustawda is a fictional company and every figure here is demo data.</p>`;
  } else if (e.type === 'truck') {
    pbody.innerHTML = head('truck', 'Truck · ' + site.name, e.id) + `<span class="chip" data-k="chip"></span>` + progHTML +
      `<div class="grid hide-min">${cell('shp', 'Shipment')}${cell('dest', 'Destination')}${cell('eta', 'ETA')}${cell('load', 'Load')}${cellX('drv', 'Driver')}${cellX('spd', 'Speed')}${cellX('dock', 'Dock')}${cellX('wt', 'Weight')}</div>`;
  } else if (e.type === 'forklift') {
    pbody.innerHTML = head('forklift', 'Forklift · ' + site.name, e.id) + `<span class="chip" data-k="chip"></span>` + progHTML +
      `<div class="grid hide-min">${cell('op', 'Operator')}${cell('bat', 'Battery')}${cell('task', 'Pallet')}${cell('to', 'Destination')}${cellX('zone', 'Zone')}${cellX('pk', 'Moves today')}${cellX('spd', 'Speed')}${cellX('cap', 'Capacity')}</div>`;
  } else {
    pbody.innerHTML = head('warehouse', 'Warehouse · ' + site.name, e.id + ' ' + e.name.split(',')[0]) + `<span class="chip" data-k="chip">Operational</span>` + progHTML.replace('Progress', 'Capacity used') +
      `<div class="grid hide-min">${cell('inb', 'Inbound')}${cell('outb', 'Outbound')}${cell('dk', 'Docks busy')}${cell('st', 'Staff on shift')}${cellX('tp', 'Temperature')}${cellX('ar', 'Floor area')}${cellX('rate', 'Picks / hour')}${cellX('acc', 'Pick accuracy')}</div>`;
  }
  updatePanel();
}
function setK(k, v) { const el = pbody.querySelector(`[data-k="${k}"]`); if (el && el.textContent !== String(v)) el.textContent = v; }
function setProg(label, f) { setK('pl', label); setK('pv', Math.round(f * 100) + '%'); const b = pbody.querySelector('[data-k="pb"]'); if (b) b.style.width = (f * 100).toFixed(1) + '%'; }
function setChip(t, cls) { const c = pbody.querySelector('[data-k="chip"]'); if (!c) return; if (c.textContent !== t) c.textContent = t; c.className = 'chip ' + (cls || ''); }
function dockedCount(si) { return SITES[si].sim.trucks.filter(t => t.st.phase === 'rev' || t.st.phase === 'load').length; }
const fmtEta = m => m <= 0 ? 'Arrived' : m >= 60 ? Math.floor(m / 60) + ' h ' + (m % 60) + ' min' : m + ' min';
function updatePanel() {
  const e = selected, si = curSite;
  if (!e) {
    const dk = dockedCount(si) + 2;
    setChip('Operational · ' + dk + ' of 5 doors busy', ''); setProg('Capacity used', [0.84, 0.79, 0.88][si] + Math.sin(clockT / 9) * 0.01);
    setK('a', '2'); setK('b', '8'); setK('c', dk + ' / 5'); setK('d', '3 active');
  } else if (e.type === 'truck') {
    const i = truckInfo(e);
    setChip(i.chip, i.cls); setProg(i.pl, i.pv);
    setK('shp', i.shp); setK('dest', i.dest); setK('eta', i.stage >= 4 ? 'Delivered' : fmtEta(i.etaMin)); setK('load', i.loaded + ' / ' + i.pallets + ' pal'); setK('drv', e.driver); setK('spd', i.speed + ' km/h'); setK('dock', e.dock); setK('wt', i.weight);
  } else if (e.type === 'forklift') {
    const i = forkInfo(e);
    setChip(i.chip, i.cls); setProg(i.pl, i.pv);
    setK('op', e.op); setK('bat', Math.round(e.bat - (clockT / 60) % 5) + '%'); setK('task', i.pal); setK('to', i.dest); setK('zone', e.zone); setK('pk', String(e.picks + Math.floor(clockT / 14))); setK('spd', i.speed); setK('cap', '2.5 t');
  } else {
    const dk = dockedCount(e.site) + 2;
    setChip(e.open ? 'Picking · conveyor running' : 'Operational · ' + dk + ' of 5 doors busy', e.open ? 'blue' : ''); setProg('Capacity used', e.cap / 100 + Math.sin(clockT / 7) * 0.005);
    setK('inb', String(e.inb + Math.floor(clockT / 11))); setK('outb', String(e.outb + Math.floor(clockT / 9))); setK('dk', e.open ? 'n/a' : dk + ' / 5'); setK('st', String(e.staff)); setK('tp', e.temp); setK('ar', e.area); setK('rate', String(e.open ? 412 + Math.round(Math.sin(clockT / 5) * 9) : 268 + Math.round(Math.sin(clockT / 6) * 7))); setK('acc', '99.6%');
  }
}
pbody.addEventListener('click', ev => {
  const b = ev.target.closest('button'); if (!b) return; interacted();
  if (b.dataset.act === 'close') deselect();
  else if (b.dataset.id) { const e = ENT.find(x => x.id === b.dataset.id); if (e) select(e); }
});
$('#grab').addEventListener('click', () => { const p = $('#panel'); const m = p.classList.toggle('min'); $('#grab').setAttribute('aria-expanded', String(!m)); $('#grab').setAttribute('aria-label', m ? 'Expand details' : 'Collapse details'); setTimeout(() => { computeSafe(); if (!fly) goal.dist = selected ? entShot(selected).dist : siteShot(curSite).dist; }, 380); });

/* timeline */
const stepsEl = [...document.querySelectorAll('#steps li')];
const hhmm = d => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Riyadh' });
let lastTlKey = '';
function updateTimeline() {
  const e = tracked; if (!e) return;
  const i = truckInfo(e);
  const key = i.shp + '|' + e.id;
  if (key !== lastTlKey) { lastTlKey = key; $('#tlTitle').textContent = i.shp + ' · ' + e.id + ' to ' + i.dest; }
  const now = Date.now();
  stepsEl.forEach((li, k) => {
    li.classList.toggle('done', k < i.stage || (i.stage === 4 && k === 4));
    li.classList.toggle('now', k === i.stage && i.stage < 4);
    const tm = li.querySelector('time');
    const txt = k < i.stage || (i.stage === 4 && k === 4) ? hhmm(new Date(now - (i.stage - k) * 11 * 60000)) : k === i.stage ? 'now' : k === 4 ? hhmm(new Date(now + i.etaMin * 60000)) : '';
    if (tm.textContent !== txt) tm.textContent = txt;
  });
  $('#tlFill').style.width = (Math.min(4, i.stage + (i.stage < 4 ? i.frac : 0)) / 4 * 100).toFixed(1) + '%';
  $('#tlEtaL').textContent = i.stage >= 4 ? 'Delivered' : 'ETA';
  $('#tlEta').textContent = i.stage >= 4 ? hhmm(new Date(now)) : fmtEta(i.etaMin);
}

/* selection */
const tagEl = $('#tag');
function setRail(type) { document.querySelectorAll('.rb').forEach(b => b.classList.toggle('on', b.dataset.view === type)); }
function select(e, fromTour = false) {
  const far = e.site !== curSite;
  if (far) setSite(e.site, true);
  selected = e; if (e.type === 'truck') tracked = e;
  flyTo(entShot(e), far ? 2.6 : 1.7, e.type === 'warehouse' ? 6 : 10);
  renderPanel(); setRail(e.type);
  tagEl.querySelector('b').textContent = e.id;
  ring.visible = ring2.visible = true; ring.scale.setScalar(e.r); ring2.scale.setScalar(e.r);
  if (!fromTour) $('#panel').classList.remove('min');
}
function deselect() { selected = null; ring.visible = ring2.visible = false; flyTo(siteShot(curSite), 1.8, 8); renderPanel(); setRail('site'); }
function setSite(i, keepSel = false) {
  const changed = i !== curSite; curSite = i;
  document.querySelectorAll('.site').forEach(b => { const on = +b.dataset.site === i; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
  tracked = SITES[i].sim.trucks[0];
  if (!keepSel) { selected = null; ring.visible = ring2.visible = false; flyTo(siteShot(i), changed ? 2.8 : 1.6, changed ? 70 : 6); renderPanel(); setRail('site'); }
  kpiSite(i);
}
document.querySelectorAll('.site').forEach(b => b.addEventListener('click', () => { interacted(); setSite(+b.dataset.site); }));
document.querySelectorAll('.rb').forEach(b => b.addEventListener('click', () => {
  interacted(); const v = b.dataset.view;
  if (v === 'site') { deselect(); return; }
  const list = ENT.filter(x => x.site === curSite && x.type === v); const idx = selected && selected.type === v ? (list.indexOf(selected) + 1) % list.length : 0; select(list[idx]);
}));

/* KPIs */
const K = { ship: [1284, 1532, 967], ot: [97.6, 96.9, 98.2], fleet: [24, 31, 17] };
const spark = [0, 1, 2, 3].map(k => Array.from({ length: 14 }, (_, i) => 0.5 + Math.sin(i * 0.9 + k * 2) * 0.22 + (i / 14) * 0.2 * (k === 2 ? -0.3 : 1)));
function drawSpark(k) { const a = spark[k], mn = Math.min(...a), mx = Math.max(...a); const d = a.map((v, i) => (i ? 'L' : 'M') + (i / (a.length - 1) * 60).toFixed(1) + ' ' + (18 - (v - mn) / ((mx - mn) || 1) * 16).toFixed(1)).join(' '); $('#sp' + k).setAttribute('d', d); }
function tickEl(id, v) { const el = $(id); if (el.textContent !== v) { el.textContent = v; el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); } }
function kpiSite(i) { renderKpis(i); }
function renderKpis(i = curSite) {
  tickEl('#k0', K.ship[i].toLocaleString('en-US'));
  tickEl('#k1', K.ot[i].toFixed(1) + '%');
  tickEl('#k2', String(K.fleet[i]));
  $('#k2d').textContent = '3 in yard';
  const dk = dockedCount(i) + 2; tickEl('#k3', Math.round(dk / 5 * 100) + '%'); $('#k3d').textContent = dk + ' of 5 doors';
  for (let k = 0; k < 4; k++) drawSpark(k);
}
let kpiAcc = 0;
const prevPhase = new Map();
function kpiTick(dt) {
  // departures add shipments
  for (const e of ENT) if (e.type === 'truck') { const p = e.st.phase; if (prevPhase.get(e) === 'load' && p === 'out') { K.ship[e.site] += 1; } prevPhase.set(e, p); }
  kpiAcc += dt; if (kpiAcc < 1.2) return; kpiAcc = 0;
  for (let s = 0; s < 3; s++) { if (Math.random() < 0.35) K.ship[s] += 1; if (Math.random() < 0.15) K.ot[s] = Math.max(95.5, Math.min(99.2, K.ot[s] + (Math.random() - 0.48) * 0.2)); if (Math.random() < 0.1) K.fleet[s] = Math.max(12, K.fleet[s] + (Math.random() < 0.5 ? -1 : 1)); }
  if (Math.random() < 0.5) for (const a of spark) { a.shift(); a.push(a[a.length - 1] + (Math.random() - 0.45) * 0.12); }
  renderKpis();
  $('#clock').textContent = hhmm(new Date());
}

/* tour */
let tourOn = !/[?&]notour/.test(location.search), tourPaused = false, tourIdx = 0, tourNext = 0;
const tourBtn = $('#tourBtn');
function setTourBtn() { tourBtn.classList.toggle('on', tourOn); tourBtn.setAttribute('aria-pressed', String(tourOn)); tourBtn.setAttribute('aria-label', tourOn ? 'Auto tour on. Tap to pause' : 'Auto tour paused. Tap to play'); }
tourBtn.addEventListener('click', () => { tourOn = !tourOn; tourPaused = false; lastInteract = -1e9; tourNext = clockT + 0.3; setTourBtn(); });
setTourBtn();
const TOUR = [['site', 6], ['truck', 9, 'move'], ['forklift', 6, 2], ['warehouse', 6.5, 1], ['truck', 7.5, 'dock'], ['forklift', 5.5, 0], ['warehouse', 5.5, 0], ['next', 0]];
function tourStep() {
  const [k, d, arg] = TOUR[tourIdx % TOUR.length]; tourIdx++;
  if (k === 'site') { if (selected) deselect(); else flyTo(siteShot(curSite), 1.8, 6); }
  else if (k === 'next') { setSite((curSite + 1) % 3); tourIdx = 1; tourNext = clockT + 6.5; return; }
  else {
    const list = ENT.filter(x => x.site === curSite && x.type === k); let e;
    if (k === 'truck') { e = list.find(x => arg === 'move' ? (x.st.phase === 'loop' && x.st.f < 0.6) : (x.st.phase === 'rev' || x.st.phase === 'load')) || list[arg === 'move' ? 0 : 1]; }
    else e = list[arg] || list[0];
    select(e, true);
  }
  tourNext = clockT + d;
}

/* ---------------- loop ---------------- */
const m4 = new THREE.Matrix4(), q0 = new THREE.Quaternion(), bs = V(0.7, 0.55, 0.6);
let simT = 0, lastNow = performance.now(), panelAcc = 0, started = false;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(QA ? 0.5 : 0.05, (now - lastNow) / 1000); lastNow = now;
  simT += dt; clockT += dt;
  for (const e of ENT) if (e.update) e.update(simT);
  for (const f of anim) f(simT);
  for (const c of conveyors) { const L = c.x1 - c.x0; for (let i = 0; i < c.n; i++) { const x = c.x0 + ((simT * 1.3 + i * L / c.n) % L); m4.compose(V(x, 1.22, c.z), q0, bs); c.mesh.setMatrixAt(i, m4); } c.mesh.instanceMatrix.needsUpdate = true; }
  // tour
  if (started && tourOn) {
    if (tourPaused && now - lastInteract > 14000) { tourPaused = false; tourNext = clockT + 0.5; }
    if (!tourPaused && clockT >= tourNext) tourStep();
  }
  camUpdate(dt, now);
  // ring + tag
  if (selected) {
    aim(selected, _v); ring.position.set(_v.x, (selected.obj ? selected.obj.position.y : 0.12) + 0.14, _v.z); ring2.position.copy(ring.position); ring2.position.y -= 0.01;
    ring.material.opacity = 0.55 + Math.sin(clockT * 4) * 0.3;
    _v.y = selected.h + (selected.obj ? selected.obj.position.y : 0); _v.project(cam);
    const x = (_v.x + 1) / 2 * W, y = (1 - _v.y) / 2 * H, inside = _v.z < 1 && x > 10 && x < W - 10 && y > safe.y + 30 && y < safe.y + safe.h;
    tagEl.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-100%)`; tagEl.classList.toggle('show', inside && !fly);
  } else tagEl.classList.remove('show');
  panelAcc += dt; if (panelAcc > 0.25) { panelAcc = 0; updatePanel(); updateTimeline();
    if (selected) { const s = selected.type === 'truck' ? truckInfo(selected).chip : selected.type === 'forklift' ? forkInfo(selected).chip : selected.name.split(',')[0]; const sp = tagEl.querySelector('span'); if (sp.textContent !== s) sp.textContent = s; } }
  kpiTick(dt);
  renderer.render(scene, cam);
}
resize();
setSite(0, true);
renderPanel(); renderKpis(); updateTimeline();
$('#clock').textContent = hhmm(new Date());
setLoad(1);
// warm up: compile shaders before revealing
try { renderer.compile(scene, cam); } catch (e) {}
requestAnimationFrame(t => { lastNow = t; frame(t); });
setTimeout(() => {
  $('#loader').classList.add('done');
  flyTo(siteShot(0), REDUCED ? 0.01 : 3.4, 0);
  started = true; tourNext = clockT + 5;
}, 250);
// small hook for automated checks
window.__wh = {
  select: id => { const e = ENT.find(x => x.id === id); if (e) { interacted(); select(e); } return !!e; },
  site: i => { interacted(); setSite(i); },
  ids: () => ENT.map(e => e.id + ':' + e.type + ':' + e.site + ':' + (e.st ? e.st.phase : '')),
  pause: () => { tourOn = false; setTourBtn(); },
  t: () => simT
};
