import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const $ = s => document.querySelector(s);
const canvas = $('#gl');
const isMobile = matchMedia('(max-width: 640px)').matches || matchMedia('(pointer: coarse)').matches;

/* ---------- UI bits (work even without WebGL) ---------- */
const hdr = $('#hdr');
$('#burger').addEventListener('click', () => { const o = document.body.classList.toggle('menu-open'); $('#burger').setAttribute('aria-expanded', o); });
document.querySelectorAll('.nav a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('menu-open')));
let bag = 0; const toast = $('#toast'); let tt;
const showToast = m => { toast.textContent = m; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 2200); };
document.querySelectorAll('.add').forEach(b => b.addEventListener('click', () => { bag++; $('#bagCount').textContent = bag; showToast(b.dataset.name + ' added to your bag'); }));
$('#cartBtn').addEventListener('click', () => showToast(bag ? bag + ' piece' + (bag > 1 ? 's' : '') + ' in your bag' : 'Your bag is empty'));
$('#book').addEventListener('submit', e => { e.preventDefault(); $('#bookOk').hidden = false; });

/* ---------- renderer ---------- */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) { $('#fallback').hidden = false; throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
camera.position.set(0, 0, 9);

const key = new THREE.DirectionalLight(0xfff1e6, 2.4); key.position.set(3, 4, 5); scene.add(key);
const rim = new THREE.DirectionalLight(0x9fe0c0, 1.4); rim.position.set(-4, 2, -3); scene.add(rim);
const fill = new THREE.PointLight(0xffc9a8, 12, 20); fill.position.set(-2, -2, 4); scene.add(fill);
scene.add(new THREE.AmbientLight(0x204a3a, 0.6));

/* ---------- materials ---------- */
const roseGold = new THREE.MeshStandardMaterial({ color: 0xe8a987, metalness: 1, roughness: 0.2 });
const roseBrushed = new THREE.MeshStandardMaterial({ color: 0xd99a78, metalness: 1, roughness: 0.42 });
const steel = new THREE.MeshStandardMaterial({ color: 0xc9ccd0, metalness: 1, roughness: 0.32 });
const brass = new THREE.MeshStandardMaterial({ color: 0xd7b46a, metalness: 1, roughness: 0.3 });
const ruby = new THREE.MeshStandardMaterial({ color: 0xb0102a, metalness: 0.1, roughness: 0.1, emissive: 0x300008 });
const rubber = new THREE.MeshStandardMaterial({ color: 0x163a2b, metalness: 0, roughness: 0.62 });
const crystalMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0, transparent: true, opacity: 0.16, clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 2.2 });
const lume = new THREE.MeshStandardMaterial({ color: 0xf4fff6, roughness: 0.4, emissive: 0x0d2a1c });

/* ---------- dial texture ---------- */
const DIALS = [
  { a: '#1c5a41', b: '#04170f', ink: '#f6e2d2', sub: '#0d3326', strap: 0x163a2b },
  { a: '#2a2a2a', b: '#050505', ink: '#f3dccb', sub: '#141414', strap: 0x111111 },
  { a: '#f3e6d2', b: '#cdb796', ink: '#4a2e1c', sub: '#e6d4ba', strap: 0x9a6a45 }
];
function dialTexture(v) {
  const S = 1024, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
  const cx = S / 2;
  const grd = g.createRadialGradient(cx, cx * 0.85, 20, cx, cx, cx); grd.addColorStop(0, v.a); grd.addColorStop(1, v.b);
  g.fillStyle = grd; g.fillRect(0, 0, S, S);
  // sunburst
  g.save(); g.translate(cx, cx);
  for (let i = 0; i < 360; i++) { g.rotate(Math.PI / 180); g.fillStyle = i % 2 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.05)'; g.fillRect(0, -1, cx, 2); }
  g.restore();
  // minute track
  g.save(); g.translate(cx, cx); g.strokeStyle = v.ink; g.globalAlpha = .8;
  for (let i = 0; i < 60; i++) { const r1 = cx * 0.94, r2 = i % 5 ? cx * 0.905 : cx * 0.88; const a = i / 60 * Math.PI * 2; g.lineWidth = i % 5 ? 2 : 4; g.beginPath(); g.moveTo(Math.sin(a) * r1, -Math.cos(a) * r1); g.lineTo(Math.sin(a) * r2, -Math.cos(a) * r2); g.stroke(); }
  g.restore();
  // subdials at 9, 3, 6
  [[-0.42, 0], [0.42, 0], [0, 0.44]].forEach(([x, y]) => {
    const sx = cx + x * cx, sy = cx + y * cx, r = cx * 0.17;
    g.fillStyle = v.sub; g.beginPath(); g.arc(sx, sy, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = v.ink; g.globalAlpha = .25; for (let k = 1; k < 6; k++) { g.lineWidth = 1; g.beginPath(); g.arc(sx, sy, r * k / 6, 0, Math.PI * 2); g.stroke(); }
    g.globalAlpha = .9; g.lineWidth = 3; g.beginPath(); g.arc(sx, sy, r, 0, Math.PI * 2); g.stroke();
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; g.lineWidth = 2; g.beginPath(); g.moveTo(sx + Math.sin(a) * r * .8, sy - Math.cos(a) * r * .8); g.lineTo(sx + Math.sin(a) * r * .95, sy - Math.cos(a) * r * .95); g.stroke(); }
    g.globalAlpha = 1;
  });
  // text
  g.fillStyle = v.ink; g.textAlign = 'center';
  g.font = '500 54px Georgia, serif'; g.fillText('VERDANE', cx, cx * 0.52);
  g.font = '300 22px Georgia, serif'; g.globalAlpha = .75; g.fillText('JEDDAH', cx, cx * 0.6);
  g.font = '300 20px sans-serif'; g.fillText('CHRONOGRAPH  AUTOMATIC', cx, cx * 1.3); g.globalAlpha = 1;
  // date window at 4:30
  g.save(); g.translate(cx + cx * 0.5, cx + cx * 0.5); g.rotate(-Math.PI / 4);
  g.fillStyle = '#f7f1ea'; g.fillRect(-34, -24, 68, 48); g.strokeStyle = '#e3a982'; g.lineWidth = 4; g.strokeRect(-34, -24, 68, 48);
  g.fillStyle = '#1b1b1b'; g.font = '600 34px Georgia, serif'; g.textBaseline = 'middle'; g.fillText('30', 0, 2); g.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const dialTex = DIALS.map(dialTexture);
const dialMat = new THREE.MeshStandardMaterial({ map: dialTex[0], metalness: 0.35, roughness: 0.38 });

/* ---------- geometry helpers ---------- */
function lathe(points, seg = 96) { return new THREE.LatheGeometry(points.map(p => new THREE.Vector2(p[0], p[1])), seg); }
function gearGeo(r, teeth, depth, hole = 0.08, spokes = 5) {
  const s = new THREE.Shape(); const th = r * 0.12; const n = teeth * 4;
  for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2; const k = i % 4; const rr = (k === 1 || k === 2) ? r + th : r; const x = Math.cos(a) * rr, y = Math.sin(a) * rr; i ? s.lineTo(x, y) : s.moveTo(x, y); }
  const hp = new THREE.Path(); hp.absarc(0, 0, hole, 0, Math.PI * 2, true); s.holes.push(hp);
  if (r > 0.3) for (let k = 0; k < spokes; k++) { const a0 = k / spokes * Math.PI * 2 + 0.25, a1 = a0 + Math.PI * 2 / spokes - 0.5; const p = new THREE.Path(); p.absarc(0, 0, r * 0.78, a0, a1, false); p.absarc(0, 0, r * 0.32, a1, a0, true); p.closePath(); s.holes.push(p); }
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 1, curveSegments: 6 });
  geo.translate(0, 0, -depth / 2); return geo;
}

/* ---------- build the watch: each part a group with its own explode offset ---------- */
const watch = new THREE.Group(); scene.add(watch);
const parts = [];
function part(name, sub, explode, anchor, side) { const g = new THREE.Group(); g.userData = { name, sub, explode, anchor, side }; watch.add(g); parts.push(g); return g; }

// case (z = 0 center)
const caseP = part('Rose gold case', '42 mm, hand polished', new THREE.Vector3(0, 0, 0), new THREE.Vector3(1.12, -0.25, 0), 'r');
const caseBody = new THREE.Mesh(lathe([[0, -0.2], [0.86, -0.2], [0.98, -0.16], [1.04, -0.05], [1.04, 0.12], [0.98, 0.2], [0.9, 0.2], [0.9, 0.05], [0, 0.05]]), roseGold); caseBody.rotation.x = Math.PI / 2; caseP.add(caseBody);
for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const lug = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.42, 0.26, 3, 0.06), roseGold); lug.position.set(sx * 0.58, sy * 1.02, -0.02); lug.rotation.z = sx * sy * -0.12; caseP.add(lug); }
const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.16, 24), roseBrushed); crown.rotation.z = Math.PI / 2; crown.position.set(1.12, 0, 0.02); caseP.add(crown);
for (const a of [0.55, -0.55]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 16), roseGold); p.rotation.z = Math.PI / 2; p.position.set(Math.cos(a) * 1.08, Math.sin(a) * 1.08, 0.02); p.rotation.z = Math.PI / 2 + a; caseP.add(p); }

// caseback
const backP = part('Sapphire case back', 'see the calibre at work', new THREE.Vector3(0, 0, -1.9), new THREE.Vector3(0.95, 0, -0.24), 'r');
const back = new THREE.Mesh(lathe([[0, -0.3], [0.7, -0.3], [0.86, -0.24], [0.88, -0.2], [0, -0.2]]), roseBrushed); back.rotation.x = Math.PI / 2; backP.add(back);
const backWin = new THREE.Mesh(new THREE.CircleGeometry(0.55, 64), new THREE.MeshPhysicalMaterial({ color: 0x1d3a30, roughness: 0.05, metalness: 0.2, clearcoat: 1 })); backWin.position.z = -0.305; backWin.rotation.y = Math.PI; backP.add(backWin);

// movement plate + gears
const moveP = part('Calibre VD 01', 'self winding, 72 h reserve', new THREE.Vector3(0, 0, -1.15), new THREE.Vector3(-0.95, 0.1, -0.1), 'l');
const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.86, 0.06, 64), steel); plate.rotation.x = Math.PI / 2; plate.position.z = -0.12; moveP.add(plate);
const gearsP = part('Gear train', 'brass wheels, ruby jewels', new THREE.Vector3(0.0, 0, -0.62), new THREE.Vector3(0.95, 0.35, 0), 'r');
const gearDefs = [[0.42, 30, -0.25, 0.1, brass, 0.045], [0.26, 20, 0.36, -0.22, brass, 0.04], [0.2, 16, -0.05, -0.48, steel, 0.04], [0.16, 14, 0.42, 0.34, brass, 0.035], [0.12, 10, -0.55, -0.32, roseGold, 0.035]];
const gears = gearDefs.map(([r, t, x, y, m, d], i) => { const g = new THREE.Mesh(gearGeo(r, t, d, 0.04), m); g.position.set(x, y, -0.06 + (i % 2) * 0.03); gearsP.add(g); const j = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), ruby); j.position.set(x, y, -0.03 + (i % 2) * 0.03); gearsP.add(j); g.userData.speed = (i % 2 ? -1 : 1) * (0.6 / r); return g; });
const balance = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.018, 8, 48), roseGold); balance.position.set(0.25, 0.48, -0.03); gearsP.add(balance);

// dial + indices
const dialP = part('Sunburst dial', 'three subdials, date at half past four', new THREE.Vector3(0, 0, 0.55), new THREE.Vector3(-0.88, -0.2, 0.06), 'l');
const dial = new THREE.Mesh(new THREE.CircleGeometry(0.88, 96), dialMat); dial.position.z = 0.06; dialP.add(dial);
for (let h = 0; h < 12; h++) {
  if (h === 3 || h === 9 || h === 6) continue;
  const a = h / 12 * Math.PI * 2; const big = h === 0;
  const idx = new THREE.Mesh(new RoundedBoxGeometry(big ? 0.1 : 0.05, 0.16, 0.03, 2, 0.01), roseGold);
  idx.position.set(Math.sin(a) * 0.68, Math.cos(a) * 0.68, 0.08); idx.rotation.z = -a; dialP.add(idx);
  if (big) { const i2 = idx.clone(); idx.position.x -= 0.04; i2.position.x += 0.04; dialP.add(i2); }
}

// hands
const handsP = part('Hand set', 'faceted, with luminous inlay', new THREE.Vector3(0, 0, 1.05), new THREE.Vector3(0.75, 0.32, 0.12), 'r');
function hand(len, w, mat) { const g = new THREE.Group(); const m = new THREE.Mesh(new RoundedBoxGeometry(w, len, 0.02, 2, 0.008), mat); m.position.y = len / 2 - 0.08; g.add(m); if (w > 0.03) { const l = new THREE.Mesh(new THREE.BoxGeometry(w * 0.4, len * 0.6, 0.024), lume); l.position.y = len * 0.55 - 0.08; g.add(l); } return g; }
const hourH = hand(0.5, 0.06, roseGold); hourH.position.z = 0.1; handsP.add(hourH);
const minH = hand(0.72, 0.045, roseGold); minH.position.z = 0.12; handsP.add(minH);
const secH = hand(0.82, 0.012, roseGold); secH.position.z = 0.14; handsP.add(secH);
const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.06, 20), roseGold); hub.rotation.x = Math.PI / 2; hub.position.z = 0.13; handsP.add(hub);
const subHands = [[-0.42 * 0.88, 0], [0.42 * 0.88, 0], [0, -0.44 * 0.88]].map(([x, y]) => { const h = hand(0.15, 0.012, roseGold); h.position.set(x, y, 0.1); handsP.add(h); return h; });
hourH.rotation.z = -(10 / 12) * Math.PI * 2 - (8 / 60) * (Math.PI * 2 / 12);
minH.rotation.z = -(8 / 60) * Math.PI * 2;

// bezel + screws
const bezelP = part('Rose gold bezel', 'eight polished screws', new THREE.Vector3(0, 0, 1.45), new THREE.Vector3(-1.02, 0.3, 0.22), 'l');
const bezel = new THREE.Mesh(lathe([[0.86, 0.18], [1.0, 0.18], [1.03, 0.22], [1.0, 0.29], [0.9, 0.31], [0.86, 0.28]]), roseGold); bezel.rotation.x = Math.PI / 2; bezelP.add(bezel);
for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + Math.PI / 8; const s = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 12), roseBrushed); s.rotation.x = Math.PI / 2; s.position.set(Math.cos(a) * 0.95, Math.sin(a) * 0.95, 0.305); bezelP.add(s); }

// crystal
const crystalP = part('Sapphire crystal', 'domed, anti glare', new THREE.Vector3(0, 0, 1.95), new THREE.Vector3(0.88, -0.1, 0.32), 'r');
const crystal = new THREE.Mesh(new THREE.SphereGeometry(1.6, 64, 16, 0, Math.PI * 2, 0, 0.58), crystalMat); crystal.rotation.x = Math.PI / 2; crystal.position.z = 0.32 - 1.6 * Math.cos(0.58) + 0.0; crystalP.add(crystal);
crystal.scale.set(1, 0.18 / (1.6 * (1 - Math.cos(0.58))), 1);
crystal.position.z = 0.27 - 1.6 * Math.cos(0.58) * crystal.scale.y;

// straps: two halves of curved segments
const strapMat = rubber;
function strap(dir) {
  const g = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const seg = new THREE.Mesh(new RoundedBoxGeometry(0.98 - i * 0.02, 0.36, 0.16, 3, 0.06), strapMat);
    const t = i * 0.34; const ang = Math.min(i * 0.2, 1.3);
    seg.position.set(0, dir * (1.32 + Math.sin(ang) * t * 0.9 + (i ? 0 : 0)), -Math.max(0, (1 - Math.cos(ang)) * t * 1.4) - 0.02);
    seg.position.y = dir * (1.32 + i * 0.33 * Math.cos(ang * 0.8));
    seg.position.z = -0.02 - (i * i) * 0.045;
    seg.rotation.x = dir * (i * 0.17);
    g.add(seg);
  }
  return g;
}
const strapTop = part('Rubber strap', 'soft, sweat proof', new THREE.Vector3(0, 1.0, -0.2), new THREE.Vector3(0.5, 2.1, -0.4), 'r'); strapTop.add(strap(1));
const strapBot = part('Folding clasp', 'rose gold, micro adjust', new THREE.Vector3(0, -1.0, -0.2), new THREE.Vector3(-0.5, -2.1, -0.4), 'l'); strapBot.add(strap(-1));
const clasp = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.3, 0.1, 2, 0.04), roseGold); clasp.position.set(0, -3.5, -1.5); clasp.rotation.x = -1.0; strapBot.add(clasp);

/* ---------- labels ---------- */
const labelsEl = $('#labels');
parts.forEach(p => {
  const el = document.createElement('div'); el.className = 'lbl ' + (p.userData.side === 'l' ? 'left' : '');
  el.innerHTML = `<i></i><s></s><span>${p.userData.name}<small>${p.userData.sub}</small></span>`;
  labelsEl.appendChild(el); p.userData.el = el;
});

/* ---------- collection snapshots (rendered once from this model) ---------- */
function snapshots() {
  const size = isMobile ? 480 : 640;
  const r2 = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  r2.setSize(size, size, false); r2.outputColorSpace = THREE.SRGBColorSpace; r2.toneMapping = THREE.ACESFilmicToneMapping;
  const sc2 = new THREE.Scene(); const pm2 = new THREE.PMREMGenerator(r2); sc2.environment = pm2.fromScene(new RoomEnvironment(r2), 0.04).texture;
  sc2.add(key.clone(), rim.clone(), new THREE.AmbientLight(0x204a3a, 0.6));
  const cam2 = new THREE.PerspectiveCamera(30, 1, 0.1, 100); cam2.position.set(0, 0, 10.5);
  const saveRot = watch.rotation.clone(), savePos = watch.position.clone();
  watch.position.set(0, 0.25, 0); watch.rotation.set(-0.35, -0.5, 0.12); parts.forEach(p => p.position.set(0, 0, 0));
  sc2.add(watch);
  document.querySelectorAll('img[data-variant]').forEach(img => {
    const v = +img.dataset.variant; dialMat.map = dialTex[v]; rubber.color.setHex(DIALS[v].strap); dialMat.needsUpdate = true;
    r2.render(sc2, cam2); img.src = r2.domElement.toDataURL('image/png'); img.onload = () => img.classList.add('ready');
  });
  dialMat.map = dialTex[0]; rubber.color.setHex(DIALS[0].strap); dialMat.needsUpdate = true;
  scene.add(watch); watch.rotation.copy(saveRot); watch.position.copy(savePos);
  pm2.dispose(); r2.dispose(); r2.forceContextLoss();
}

/* ---------- scroll + layout ---------- */
const scrolly = $('#scrolly'), heroCopy = $('#heroCopy'), cap1 = $('#cap1'), cap2 = $('#cap2'), railDot = $('#railDot'), railNum = $('#railNum');
let W = 0, H = 0, portrait = false;
function resize() {
  W = canvas.clientWidth; H = canvas.clientHeight; portrait = W / H < 0.85; document.body.classList.toggle('portrait', portrait); parts.forEach(p => p.userData.el && (p.userData.el._w = 0));
  renderer.setSize(W, H, false); camera.aspect = W / H;
  camera.fov = portrait ? 44 : 32; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const params = new URLSearchParams(location.search);
const forced = params.has('p') ? parseFloat(params.get('p')) : null;
let target = 0, prog = forced ?? 0;
function readScroll() {
  const r = scrolly.getBoundingClientRect(); const total = r.height - innerHeight;
  target = forced ?? clamp(-r.top / total);
  hdr.classList.toggle('solid', scrollY > scrolly.offsetHeight - innerHeight * 1.05);
}
addEventListener('scroll', readScroll, { passive: true }); readScroll();

let px = 0, py = 0, tpx = 0, tpy = 0;
addEventListener('pointermove', e => { tpx = e.clientX / innerWidth - 0.5; tpy = e.clientY / innerHeight - 0.5; }, { passive: true });

const v3 = new THREE.Vector3();
const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  prog = forced ?? lerp(prog, target, 1 - Math.pow(0.0015, dt));
  px = lerp(px, tpx, 0.05); py = lerp(py, tpy, 0.05);
  const p = prog;

  // stages
  const toCenter = smooth(0.06, 0.2, p);      // hero -> center
  const ex = smooth(0.22, 0.48, p) * (1 - smooth(0.7, 0.88, p)); // explode then reassemble
  const lab = smooth(0.4, 0.48, p) * (1 - smooth(0.64, 0.7, p));
  const spin = smooth(0.7, 0.92, p);

  // watch placement
  const heroX = portrait ? 0 : 1.75, heroY = portrait ? -1.55 : -0.05, heroS = portrait ? 0.78 : 1.05;
  const midS = portrait ? 0.8 : 0.95;
  watch.position.x = lerp(heroX, portrait ? 0 : 0.1, toCenter);
  watch.position.y = lerp(heroY, portrait ? -0.25 : 0, toCenter) + Math.sin(t * 1.2) * 0.04 * (1 - ex);
  const endY = portrait ? 0.45 : 0.42; watch.position.y = lerp(watch.position.y, endY, smooth(0.88, 0.96, p));
  const s = lerp(heroS, midS, toCenter) * lerp(1, portrait ? (W < 500 ? 0.5 : 0.6) : 0.7, ex) * lerp(1, portrait ? 0.95 : 0.85, smooth(0.88, 0.96, p));
  watch.scale.setScalar(s);
  // rotation: hero slight 3/4, explode: tilted so layers stack upward, end: front with a full turn
  const rxHero = -0.28, ryHero = -0.55, rzHero = 0.16;
  const rxEx = -1.02, ryEx = 0.5, rzEx = 0.2;
  let rx = lerp(rxHero, rxEx, smooth(0.14, 0.34, p)), ry = lerp(ryHero, ryEx, smooth(0.14, 0.34, p)), rz = lerp(rzHero, rzEx, smooth(0.14, 0.34, p));
  rx = lerp(rx, -0.18, spin); ry = lerp(ry, Math.PI * 2 - 0.25, spin); rz = lerp(rz, 0.05, spin);
  watch.rotation.set(rx + py * 0.15, ry + px * 0.3 + Math.sin(t * 0.5) * 0.03, rz);

  parts.forEach(pt => pt.position.copy(pt.userData.explode).multiplyScalar(ex));
  gears.forEach(g => g.rotation.z += dt * g.userData.speed * (0.4 + ex * 2));
  balance.rotation.z = Math.sin(t * 9) * 0.9;
  secH.rotation.z = -(t % 60) / 60 * Math.PI * 2;
  subHands.forEach((h, i) => h.rotation.z = -t * (0.2 + i * 0.13));

  // copy
  heroCopy.style.opacity = 1 - smooth(0.04, 0.13, p);
  heroCopy.style.transform = (portrait ? '' : 'translateY(-46%) ') + `translateY(${-smooth(0.04, 0.13, p) * 60}px)`;
  heroCopy.style.visibility = p > 0.14 ? 'hidden' : 'visible';
  const c1 = smooth(0.24, 0.32, p) * (1 - smooth(0.6, 0.68, p));
  cap1.style.opacity = c1; cap1.style.transform = `translateY(${(1 - c1) * 30}px)`;
  const c2 = smooth(0.9, 0.97, p);
  cap2.style.opacity = c2; cap2.style.transform = `translate(-50%, ${(1 - c2) * 30}px)`; cap2.classList.toggle('on', c2 > 0.5);
  if (railDot) { railDot.style.top = (p * 173) + 'px'; railNum.textContent = '0' + (1 + Math.min(3, Math.floor(p * 3.999))); }

  renderer.render(scene, camera);

  // labels after render (matrices fresh), with per-side spacing so they never overlap
  const show = lab > 0.01;
  const items = [];
  parts.forEach((pt, i) => {
    const el = pt.userData.el;
    if (!el.isConnected) return;
    if (!show) { el.style.opacity = 0; return; }
    v3.copy(pt.userData.anchor); pt.localToWorld(v3); v3.project(camera);
    items.push({ el, i, left: pt.userData.side === 'l', x: (v3.x * 0.5 + 0.5) * W, y: (-v3.y * 0.5 + 0.5) * H });
  });
  const gap = portrait ? 40 : 48;
  for (const side of [true, false]) {
    const list = items.filter(o => o.left === side).sort((a, b) => a.y - b.y);
    let last = 70 - gap;
    list.forEach(o => { o.y = Math.max(o.y, last + gap); last = o.y; });
    const over = last - (H - 40); if (over > 0) list.forEach(o => o.y -= over);
  }
  const lw = portrait ? 16 : 56;
  items.forEach(o => {
    o.el.style.setProperty('--lw', lw + 'px');
    const ew = o.el._w || (o.el._w = o.el.offsetWidth);
    o.x = o.left ? Math.max(o.x, ew + 6) : Math.min(o.x, W - ew - 6);
    o.el.style.opacity = clamp((lab - o.i * 0.04) / 0.6);
    o.el.style.transform = o.left ? `translate(${o.x}px, ${o.y}px) translate(-100%, -50%) translateX(3.5px)` : `translate(${o.x}px, ${o.y}px) translate(-3.5px, -50%)`;
  });
  requestAnimationFrame(frame);
}

// hide labels that would collide on tiny screens
parts.forEach(pt => { if (pt.userData.name === 'Rubber strap' || (isMobile && ['Folding clasp', 'Gear train', 'Rose gold case'].includes(pt.userData.name))) { pt.userData.el.remove(); pt.userData.el = document.createElement('div'); } });
if (false) parts.forEach(pt => { if (['Folding clasp', 'Gear train', 'Rose gold case'].includes(pt.userData.name)) pt.userData.el.remove(), pt.userData.el = document.createElement('div'); });

try { snapshots(); } catch (e) { console.warn('snapshot skipped', e); }
requestAnimationFrame(frame);
