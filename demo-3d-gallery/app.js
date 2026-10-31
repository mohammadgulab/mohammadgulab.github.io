import * as THREE from 'three';

const PHOTOS = window.PHOTOS || [];
const N = PHOTOS.length;
const $ = (s) => document.querySelector(s);
const stage = $('#stage'), canvas = $('#gl');
const MODES = {
  sphere: { name: 'Photo Sphere', speed: 0.22 },
  helix:  { name: 'Spiral Helix', speed: 0.32 },
  tunnel: { name: 'Card Tunnel',  speed: 0.55 },
  ring:   { name: 'Ring Carousel', speed: 0.20 },
  wall:   { name: 'Grid Wall',    speed: 0.35 },
};
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const params = new URLSearchParams(location.search);
let mode = MODES[params.get('mode')] ? params.get('mode') : 'sphere';
let speedMul = reduce ? 0.35 : 1, spacing = 1, tiltDeg = 0, paused = false;

/* ---------- renderer ---------- */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) {
  $('#fallback').hidden = false; $('#loading').classList.add('done');
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0b0d12, 14, 30);
const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
camera.position.set(0, 0, 13);
const camLook = new THREE.Vector3();
const world = new THREE.Group();
scene.add(world);

/* rounded-corner alpha mask shared by every card */
function roundedMask() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 160;
  const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 128, 160);
  g.fillStyle = '#fff'; g.beginPath(); g.roundRect(2, 2, 124, 156, 12); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t;
}
const mask = roundedMask();
const CW = 1, CH = 1.25;
const geo = new THREE.PlaneGeometry(CW, CH);
const cards = [];
const PLACE = new THREE.Color(0x1c212c);
for (let i = 0; i < N; i++) {
  const mat = new THREE.MeshBasicMaterial({ color: PLACE.clone(), alphaMap: mask, alphaTest: 0.5, side: THREE.DoubleSide });
  mat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>',
      '#include <map_fragment>\n if(!gl_FrontFacing) diffuseColor.rgb *= 0.28;');
  };
  const m = new THREE.Mesh(geo, mat);
  m.userData = { i, fade: 0, loaded: false, hover: 0, from: { p: new THREE.Vector3(), q: new THREE.Quaternion() } };
  m.position.set((Math.random() - .5) * 2, (Math.random() - .5) * 2, -20);
  world.add(m); cards.push(m);
}

/* ---------- lazy texture loading (6 at a time) ---------- */
const loader = new THREE.TextureLoader();
let loadedCount = 0, next = 0;
const maxAniso = Math.min(4, renderer.capabilities.getMaxAnisotropy());
function loadNext() {
  if (next >= N) return;
  const i = next++;
  loader.load(`img/t/${PHOTOS[i].id}.jpg`, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = maxAniso;
    const mat = cards[i].material; mat.map = tex; mat.needsUpdate = true; cards[i].userData.loaded = true;
    done();
  }, undefined, done);
  function done() {
    loadedCount++; $('#loadCount').textContent = loadedCount;
    if (loadedCount >= Math.min(N, 12)) $('#loading').classList.add('done');
    loadNext();
  }
}
for (let k = 0; k < 6; k++) loadNext();

/* ---------- layouts ---------- */
const tmpObj = new THREE.Object3D();
const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3(), mtx = new THREE.Matrix4();
const GOLD = Math.PI * (3 - Math.sqrt(5));
function faceOut(p, q) { tmpObj.position.copy(p); tmpObj.up.set(0, 1, 0); tmpObj.lookAt(p.x * 2, p.y * 2, p.z * 2); q.copy(tmpObj.quaternion); }
function faceFromAxisOut(p, q) { tmpObj.position.copy(p); tmpObj.up.set(0, 1, 0); tmpObj.lookAt(p.x * 2, p.y, p.z * 2); q.copy(tmpObj.quaternion); }

let lScale = 1;
const smooth = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
function layout(md, i, t, s, p, q) {
  lScale = 1;
  if (md === 'sphere') {
    const R = 3.3 * s;
    const y = 1 - (i + 0.5) / N * 2, r = Math.sqrt(1 - y * y), a = i * GOLD + t;
    p.set(Math.cos(a) * r * R, y * R, Math.sin(a) * r * R);
    faceOut(p, q);
  } else if (md === 'helix') {
    const strand = i % 2, k = Math.floor(i / 2), per = Math.ceil(N / 2);
    const a = k * 0.55 + strand * Math.PI + t, r = 2.5 * s;
    p.set(Math.cos(a) * r, (k - (per - 1) / 2) * 0.42 * s, Math.sin(a) * r);
    faceFromAxisOut(p, q);
  } else if (md === 'tunnel') {
    const per = 8, rings = Math.ceil(N / per), ring = Math.floor(i / per), j = i % per;
    const D = 3.0 * s, L = rings * D;
    let zz = ((ring * D + t * 4) % L + L) % L;
    const z = -L + 5.2 + zz;
    lScale = smooth(0, D * 0.5, zz) * smooth(0, D * 0.6, L - zz);
    const a = j / per * Math.PI * 2 + ring * 0.39 + t * 0.12, r = 2.4 * s;
    p.set(Math.cos(a) * r, Math.sin(a) * r, z);
    // lean each card toward the viewer so the photo reads, kept upright
    vC.set(-Math.cos(a) * 0.55, -Math.sin(a) * 0.55, 0.85).add(p);
    tmpObj.position.copy(p); tmpObj.up.set(0, 1, 0); tmpObj.lookAt(vC); q.copy(tmpObj.quaternion);
  } else if (md === 'ring') {
    const per = Math.ceil(N / 2), row = i < per ? 0 : 1, k = row ? i - per : i;
    const R = per * 1.16 / (Math.PI * 2) * s;
    const a = k / per * Math.PI * 2 + (row ? -t * 0.8 + 0.16 : t);
    p.set(Math.cos(a) * R, row ? -0.72 * s : 0.72 * s, Math.sin(a) * R);
    faceFromAxisOut(p, q);
  } else { // wall
    const rows = wallRows(), cols = Math.ceil(N / rows), col = Math.floor(i / rows), row = i % rows;
    const cw = 1.14 * s, ch = 1.42 * s, Wd = cols * cw;
    let xx = ((col * cw + t * 1.3) % Wd + Wd) % Wd;
    const x = xx - Wd / 2 + cw / 2, y = ((rows - 1) / 2 - row) * ch;
    lScale = smooth(0, cw * 0.9, xx) * smooth(0, cw * 0.9, Wd - xx);
    // tilted wall: rotate the flat grid around Y and X
    const ay = -0.42, ax = 0.12;
    const x1 = x * Math.cos(ay), z1 = -x * Math.sin(ay);
    const y2 = y * Math.cos(ax) - z1 * Math.sin(ax), z2 = y * Math.sin(ax) + z1 * Math.cos(ax);
    p.set(x1, y2, z2);
    tmpObj.rotation.set(ax, ay, 0); q.setFromEuler(tmpObj.rotation);
  }
}
function wallRows() { return aspect() < 0.8 ? 5 : 4; }
function aspect() { return Math.max(0.2, stage.clientWidth / Math.max(1, stage.clientHeight)); }

/* camera per mode, fitted to the stage size */
function cameraFor(md, s, outPos, outLook) {
  const asp = aspect();
  const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const fit = (w, h, extra) => Math.max(w / (tanH * asp), h / tanH) + extra;
  if (md === 'sphere') { const R = 3.3 * s; outPos.set(0, 0, fit(R + 0.45, R + 0.6, 0.4)); outLook.set(0, 0, 0); }
  else if (md === 'helix') { outPos.set(0, 0.3, fit(3.4 * s, 4.7 * s, 2.0)); outLook.set(0, 0, 0); }
  else if (md === 'ring') { const R = Math.ceil(N / 2) * 1.16 / (Math.PI * 2) * s; const d = fit(asp < 1 ? R * 0.78 : R + 0.3, 2.6 * s, R * 0.9); outPos.set(0, d * 0.24, d); outLook.set(0, -0.2, 0); }
  else if (md === 'tunnel') { outPos.set(0, 0, 6.6); outLook.set(0, 0, -20); }
  else { const rows = wallRows(); outPos.set(0, 0, fit((asp < 1 ? 3.3 : 4.4) * s, rows * 0.72 * s + 0.5, 1.2)); outLook.set(asp < 1 ? 0.4 : 0.9, 0, 0); }
}
const FOG = { sphere: [12, 28], helix: [12, 26], tunnel: [7, 21], ring: [12, 28], wall: [10, 24] };

/* ---------- state + morph ---------- */
let t = 0, vel = 0, tiltDrag = 0, tiltDragVel = 0, morphStart = performance.now() - 5000;
const camPos = new THREE.Vector3(), lookTarget = new THREE.Vector3();
const tp = new THREE.Vector3(), tq = new THREE.Quaternion();
function startMorph() {
  morphStart = performance.now();
  for (const c of cards) { c.userData.from.p.copy(c.position); c.userData.from.q.copy(c.quaternion); }
}
startMorph();
const ease = (x) => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

function setMode(md) {
  if (md === mode || !MODES[md]) return;
  mode = md; startMorph();
  document.querySelectorAll('.mode').forEach(b => { const on = b.dataset.mode === md; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on); });
  const nm = $('#modeName'); nm.textContent = MODES[md].name;
  const u = new URL(location.href); u.searchParams.set('mode', md); history.replaceState(null, '', u);
}
document.querySelectorAll('.mode').forEach(b => {
  const on = b.dataset.mode === mode; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on);
  b.addEventListener('click', () => setMode(b.dataset.mode));
});
$('#modeName').textContent = MODES[mode].name;

/* ---------- controls ---------- */
const adjustBtn = $('#adjustBtn'), adjust = $('#adjust');
adjustBtn.addEventListener('click', () => { const open = adjust.hidden; adjust.hidden = !open; adjustBtn.setAttribute('aria-expanded', open); });
const sp = $('#speed'), spc = $('#space'), tl = $('#tilt');
sp.value = speedMul;
const syncOut = () => { $('#oSpeed').textContent = (+sp.value).toFixed(1) + 'x'; $('#oSpace').textContent = Math.round(spc.value * 100) + '%'; $('#oTilt').textContent = tl.value + '°'; };
sp.addEventListener('input', () => { speedMul = +sp.value; syncOut(); });
spc.addEventListener('input', () => { spacing = +spc.value; syncOut(); });
tl.addEventListener('input', () => { tiltDeg = +tl.value; syncOut(); });
syncOut();
$('#pauseBtn').addEventListener('click', (e) => { paused = !paused; e.currentTarget.setAttribute('aria-pressed', paused); e.currentTarget.textContent = paused ? 'Resume motion' : 'Pause motion'; });

/* ---------- drag / swipe / tap ---------- */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let down = null, hoverIdx = -1, lastMove = 0;
function pick(cx, cy) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(cards, false)[0];
  return hit ? hit.object.userData.i : -1;
}
const dragScale = () => (mode === 'tunnel' ? 0.004 : mode === 'wall' ? 0.006 : 0.0065) * (mode === 'sphere' || mode === 'helix' || mode === 'ring' ? 1 : 1);
stage.addEventListener('pointerdown', (e) => {
  if (e.button !== undefined && e.button > 0) return;
  down = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, time: performance.now(), moved: 0, type: e.pointerType };
  vel = 0; tiltDragVel = 0;
  stage.setPointerCapture?.(e.pointerId);
});
stage.addEventListener('pointermove', (e) => {
  if (!down) {
    if (e.pointerType === 'mouse') { hoverIdx = pick(e.clientX, e.clientY); stage.style.cursor = hoverIdx >= 0 ? 'pointer' : ''; }
    return;
  }
  const dx = e.clientX - down.lx, dy = e.clientY - down.ly;
  down.lx = e.clientX; down.ly = e.clientY;
  down.moved = Math.max(down.moved, Math.hypot(e.clientX - down.x, e.clientY - down.y));
  if (down.moved > 6) stage.classList.add('dragging');
  const now = performance.now(), dt = Math.max(8, now - lastMove) / 1000; lastMove = now;
  const d = dx * dragScale();
  t += d; vel = d / dt * 0.9;
  if (down.type === 'mouse') { tiltDrag = THREE.MathUtils.clamp(tiltDrag + dy * 0.004, -0.6, 0.6); tiltDragVel = 0; }
});
function endDrag(e, cancelled) {
  if (!down) return;
  const quick = performance.now() - down.time < 600;
  if (!cancelled && down.moved < 8 && quick) { const i = pick(e.clientX, e.clientY); if (i >= 0) openLB(i); vel = 0; }
  if (performance.now() - lastMove > 90) vel = 0;
  vel = THREE.MathUtils.clamp(vel, -4, 4);
  down = null; stage.classList.remove('dragging');
}
stage.addEventListener('pointerup', (e) => endDrag(e, false));
stage.addEventListener('pointercancel', (e) => endDrag(e, true));
stage.addEventListener('pointerleave', () => { if (!down) { hoverIdx = -1; stage.style.cursor = ''; } });

/* ---------- resize / visibility ---------- */
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage); resize();
let onScreen = true;
new IntersectionObserver((en) => { onScreen = en[0].isIntersecting; }, { threshold: 0.02 }).observe(stage);

/* ---------- loop ---------- */
let last = performance.now();
cameraFor(mode, spacing, camPos, lookTarget); camera.position.copy(camPos); camLook.copy(lookTarget);
const WHITE = new THREE.Color(1, 1, 1);
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!onScreen || document.hidden) return;
  const lbOpen = !lb.hidden;
  if (!down) {
    if (!paused && !lbOpen) t += dt * MODES[mode].speed * speedMul;
    t += vel * dt; vel *= Math.pow(0.04, dt);
    if (Math.abs(vel) < 0.002) vel = 0;
    tiltDrag *= Math.pow(0.35, dt);
  }
  // camera + fog ease
  cameraFor(mode, spacing, camPos, lookTarget);
  const k = 1 - Math.pow(0.02, dt);
  camera.position.lerp(camPos, k); camLook.lerp(lookTarget, k); camera.lookAt(camLook);
  const f = FOG[mode]; scene.fog.near += (f[0] - scene.fog.near) * k; scene.fog.far += (f[1] - scene.fog.far) * k;
  // group tilt: slider + mouse drag + gentle sway on the sphere
  const sway = mode === 'sphere' ? Math.sin(now / 2600) * 0.12 : 0;
  const tiltTarget = THREE.MathUtils.degToRad(tiltDeg) + tiltDrag + sway;
  world.rotation.x += (tiltTarget - world.rotation.x) * k;
  // cards
  const el = now - morphStart;
  for (let i = 0; i < N; i++) {
    const c = cards[i], u = c.userData;
    layout(mode, i, t, spacing, tp, tq);
    const ls = lScale;
    const mi = THREE.MathUtils.clamp((el - i * 14) / 950, 0, 1);
    if (mi >= 1) { c.position.copy(tp); c.quaternion.copy(tq); }
    else {
      const e = ease(mi);
      c.position.lerpVectors(u.from.p, tp, e);
      c.position.z += Math.sin(e * Math.PI) * 1.2; // lift during the morph
      c.quaternion.slerpQuaternions(u.from.q, tq, e);
    }
    u.hover += ((i === hoverIdx ? 1 : 0) - u.hover) * k * 1.4;
    c.scale.setScalar((1 + u.hover * 0.1) * (mi >= 1 ? ls : 1 + (ls - 1) * ease(mi)));
    if (u.loaded && u.fade < 1) { u.fade = Math.min(1, u.fade + dt * 2.2); c.material.color.copy(PLACE).lerp(WHITE, u.fade); }
  }
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);
window.__gallery = { get t() { return t; }, setMode, get mode() { return mode; }, get loaded() { return loadedCount; } };

/* ---------- lightbox ---------- */
const lb = $('#lb'), lbImg = $('#lbImg');
let lbIdx = 0, lastFocus = null;
function showLB(i) {
  lbIdx = (i + N) % N; const p = PHOTOS[lbIdx];
  lbImg.src = `img/l/${p.id}.jpg`; lbImg.alt = p.t;
  $('#lbTitle').textContent = p.t; $('#lbCat').textContent = p.c;
  [1, -1].forEach(d => { const im = new Image(); im.src = `img/l/${PHOTOS[(lbIdx + d + N) % N].id}.jpg`; });
}
function openLB(i) {
  lastFocus = document.activeElement; showLB(i); lb.hidden = false;
  requestAnimationFrame(() => lb.classList.add('show')); $('#lbClose').focus({ preventScroll: true });
  document.body.style.overflow = 'hidden';
}
function closeLB() {
  lb.classList.remove('show'); document.body.style.overflow = '';
  setTimeout(() => { lb.hidden = true; }, 260); lastFocus?.focus?.({ preventScroll: true });
}
$('#lbClose').addEventListener('click', closeLB);
$('#lbPrev').addEventListener('click', () => showLB(lbIdx - 1));
$('#lbNext').addEventListener('click', () => showLB(lbIdx + 1));
lb.addEventListener('click', (e) => { if (e.target === lb) closeLB(); });
addEventListener('keydown', (e) => {
  if (lb.hidden) return;
  if (e.key === 'Escape') closeLB(); else if (e.key === 'ArrowLeft') showLB(lbIdx - 1); else if (e.key === 'ArrowRight') showLB(lbIdx + 1);
});
let sx = null;
lb.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
lb.addEventListener('touchend', (e) => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) showLB(lbIdx + (dx < 0 ? 1 : -1)); sx = null; });

/* ---------- categories below ---------- */
const cats = {};
PHOTOS.forEach((p, i) => { (cats[p.c] ||= []).push(i); });
const covers = { 'Coast': 34744917, 'Old Town': 35890930, 'Desert': 11118464, 'Portraits': 30627674 };
$('#cats').innerHTML = Object.entries(cats).map(([c, list]) => {
  const cover = covers[c] || PHOTOS[list[0]].id;
  return `<button class="cat" data-i="${PHOTOS.findIndex(p => p.id === cover)}"><img src="img/t/${cover}.jpg" alt="${c} photography" loading="lazy" width="384" height="480"><span>${c}<small>${list.length} photos</small></span></button>`;
}).join('');
document.querySelectorAll('.cat').forEach(b => b.addEventListener('click', () => openLB(+b.dataset.i)));

/* ---------- booking toast ---------- */
const toast = $('#toast');
$('#bookBtn').addEventListener('click', () => { toast.textContent = 'This is a concept demo, so booking is not live.'; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2600); });
