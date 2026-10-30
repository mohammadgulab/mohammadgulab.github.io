import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const Q = new URLSearchParams(location.search);
const SNAP = Q.has('snap');
const coarse = matchMedia('(pointer:coarse)').matches;
const small = () => innerWidth <= 700;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- page UI (works with or without WebGL) ---------- */
const secs = [...document.querySelectorAll('.sec')];
let tops = [];
const measure = () => { tops = secs.map(e => ({ t: e.offsetTop, h: e.offsetHeight })); };
measure();
const rawS = () => {
  const c = scrollY + innerHeight / 2;
  for (let i = tops.length - 1; i >= 0; i--) if (c >= tops[i].t) return clamp(i + (c - tops[i].t) / tops[i].h - 0.5, 0, secs.length - 1);
  return 0;
};
const secNum = document.getElementById('secNum'), railFill = document.getElementById('railFill'), secLabel = document.getElementById('secLabel');
let lastSec = -1;
function updateRail(s) {
  const i = Math.round(s);
  railFill.style.width = (s / (secs.length - 1) * 100).toFixed(1) + '%';
  if (i !== lastSec) { lastSec = i; secNum.textContent = String(i + 1).padStart(3, '0'); secLabel.textContent = secs[i].dataset.label || ''; }
}
if (coarse) { const t = document.getElementById('typeTip'); if (t) t.remove(); }

if (window.gsap && window.ScrollTrigger && !reduce) {
  gsap.registerPlugin(ScrollTrigger);
  secs.forEach((sec, si) => {
    const items = sec.querySelectorAll('.copy > *, .parts li, .cards .card, .editions .ed, .foot');
    items.forEach(el => el.classList.add('reveal'));
    if (si === 0) { gsap.to(items, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.09, delay: 0.25 }); return; }
    ScrollTrigger.create({ trigger: sec, start: 'top 72%', once: true,
      onEnter: () => gsap.to(items, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07 }) });
  });
  ScrollTrigger.addEventListener('refresh', measure);
}
addEventListener('resize', measure);
addEventListener('load', () => { measure(); window.ScrollTrigger && ScrollTrigger.refresh(); });

/* ---------- WebGL ---------- */
let renderer = null;
try {
  const test = document.createElement('canvas');
  if (!(test.getContext('webgl2') || test.getContext('webgl'))) throw new Error('no webgl');
  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: !(coarse && devicePixelRatio > 2), alpha: true, powerPreference: 'high-performance' });
} catch (e) {
  document.documentElement.classList.add('no-webgl');
  let s0 = -1; const loop = () => { const s = rawS(); if (s !== s0) { s0 = s; updateRail(s); } requestAnimationFrame(loop); }; loop();
}

if (renderer) start();

function start() {
  let maxDpr = coarse ? 1.5 : 2;
  renderer.setPixelRatio(Math.min(devicePixelRatio, maxDpr));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 16);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(5, 9, 7); scene.add(key);
  const rim = new THREE.DirectionalLight(0xcfd8ff, 1.1); rim.position.set(-7, 3, -5); scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8c92, 0.6));

  const world = new THREE.Group(); scene.add(world);

  /* palettes */
  const PAL = {
    graphite: { alpha: 0x2b2c30, mod: 0x4a4c52, accent: 0xd8302a, legend: 0xf1f1f1, case: 0x3b3d42 },
    arctic:   { alpha: 0xeef0f3, mod: 0xc4cad3, accent: 0x4a7bd8, legend: 0x2c3038, case: 0xd5d8dd },
    sand:     { alpha: 0xeee5d5, mod: 0xcbb89b, accent: 0xe0782c, legend: 0x3d342a, case: 0xb7aa95 },
  };
  const capMat = (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.42, metalness: 0, clearcoat: 0.45, clearcoatRoughness: 0.3, envMapIntensity: 0.55 });
  const M = {
    alpha: capMat(PAL.graphite.alpha), mod: capMat(PAL.graphite.mod), accent: capMat(PAL.graphite.accent),
    case: new THREE.MeshStandardMaterial({ color: PAL.graphite.case, metalness: 0.75, roughness: 0.36 }),
    plate: new THREE.MeshStandardMaterial({ color: 0x141518, metalness: 0.4, roughness: 0.55 }),
    housing: new THREE.MeshStandardMaterial({ color: 0x0f1012, metalness: 0.1, roughness: 0.42 }),
    stem: new THREE.MeshPhysicalMaterial({ color: 0xd8302a, roughness: 0.28, clearcoat: 1 }),
    clear: new THREE.MeshPhysicalMaterial({ color: 0xdfe8f5, transparent: true, opacity: 0.55, roughness: 0.04, metalness: 0, clearcoat: 1, depthWrite: false }),
    gold: new THREE.MeshStandardMaterial({ color: 0xd9ab4f, metalness: 1, roughness: 0.22 }),
    spring: new THREE.MeshStandardMaterial({ color: 0xd4d8de, metalness: 1, roughness: 0.18 }),
  };

  /* legend atlas */
  const N = 16, CELL = 64;
  const atlasCanvas = document.createElement('canvas'); atlasCanvas.width = atlasCanvas.height = N * CELL;
  const atlas = new THREE.CanvasTexture(atlasCanvas); atlas.anisotropy = 4; atlas.colorSpace = THREE.SRGBColorSpace;
  const cellOf = new Map();
  function drawAtlas() {
    const g = atlasCanvas.getContext('2d'); g.clearRect(0, 0, atlasCanvas.width, atlasCanvas.height);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const [lab, i] of cellOf) {
      const fs = lab.length === 1 ? 40 : lab.length <= 3 ? 24 : 18;
      g.font = `600 ${fs}px "Space Grotesk", Inter, Arial, sans-serif`;
      g.fillText(lab, (i % N) * CELL + CELL / 2, Math.floor(i / N) * CELL + CELL / 2 + 1);
    }
    atlas.needsUpdate = true;
  }
  const legendMat = new THREE.MeshBasicMaterial({ map: atlas, transparent: true, depthWrite: false, color: PAL.graphite.legend, toneMapped: false });
  function legendGeo(lab) {
    if (!cellOf.has(lab)) cellOf.set(lab, cellOf.size);
    const i = cellOf.get(lab), col = i % N, row = Math.floor(i / N);
    const g = new THREE.PlaneGeometry(0.56, 0.56); g.rotateX(-Math.PI / 2);
    const uv = g.attributes.uv;
    for (let k = 0; k < uv.count; k++) uv.setXY(k, (col + uv.getX(k)) / N, (N - 1 - row + uv.getY(k)) / N);
    return g;
  }

  /* keycap geometry (tapered rounded box) */
  const GAP = 0.09, CAP_H = 0.42, CAP_Y = 0.58;
  const capCache = new Map();
  function capGeo(w) {
    if (capCache.has(w)) return capCache.get(w);
    const W = w - GAP, D = 1 - GAP;
    const g = new RoundedBoxGeometry(W, CAP_H, D, 3, 0.1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const t = (p.getY(i) + CAP_H / 2) / CAP_H, ins = 0.12 * t;
      p.setX(i, p.getX(i) * (1 - ins / (W / 2)));
      p.setZ(i, p.getZ(i) * (1 - ins / (D / 2)) - 0.03 * t);
    }
    capCache.set(w, g); return g;
  }
  function makeCap(w, lab, mat) {
    const grp = new THREE.Group();
    grp.add(new THREE.Mesh(capGeo(w), mat));
    if (lab) {
      const l = new THREE.Mesh(legendGeo(lab), legendMat);
      l.position.set(w > 1.3 ? -(w - GAP) / 2 + 0.4 : 0, CAP_H / 2 + 0.004, -0.03);
      grp.add(l);
    }
    return grp;
  }

  /* keyboard layout */
  const F = ['F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12'];
  const ROWS = [
    [['esc',1], ...F.map(f => [f,1]), ['del',1], ['home',1]],
    [['`',1], ...'1234567890-='.split('').map(c => [c,1]), ['⌫',2]],
    [['tab',1.5], ...'QWERTYUIOP[]'.split('').map(c => [c,1]), ['\\',1.5]],
    [['caps',1.75], ...'ASDFGHJKL;\''.split('').map(c => [c,1]), ['enter',2.25]],
    [['shift',2.25], ...'ZXCVBNM,./'.split('').map(c => [c,1]), ['shift',1.75], ['↑',1]],
    [['ctrl',1.25], ['fn',1.25], ['alt',1.25], ['',6.25], ['alt',1], ['ctrl',1], ['←',1], ['↓',1], ['→',1]],
  ];
  const kb = new THREE.Group(); world.add(kb);
  const keys = []; const byLabel = new Map();
  const isAlnum = (l) => /^[A-Z0-9`\-=\[\]\\;',./]$/.test(l) || l === '';
  ROWS.forEach((row, r) => {
    let x = -7.5;
    const z = r * 1 + (r > 0 ? 0.25 : 0) - 3.125 + 0.5;
    row.forEach(([lab, w]) => {
      const mat = (lab === 'esc' || lab === 'enter') ? M.accent : isAlnum(lab) ? M.alpha : M.mod;
      const cap = makeCap(w, lab, mat);
      const cx = x + w / 2;
      cap.position.set(cx, CAP_Y, z);
      kb.add(cap);
      const k = { cap, x: cx, z, w, r, nx: (cx + 7.5) / 15, press: 0, target: 0, rnd: Math.random(), lab };
      keys.push(k);
      const id = lab.toLowerCase();
      if (!byLabel.has(id)) byLabel.set(id, []);
      byLabel.get(id).push(k);
      x += w;
    });
  });
  drawAtlas();
  if (document.fonts) document.fonts.ready.then(() => document.fonts.load('600 28px "Space Grotesk"')).then(drawAtlas).catch(() => {});

  // switches (instanced)
  const housingGeo = new RoundedBoxGeometry(0.62, 0.26, 0.62, 2, 0.05);
  const topGeo = new RoundedBoxGeometry(0.6, 0.18, 0.6, 2, 0.06);
  const stemGeo = new THREE.BoxGeometry(0.07, 0.2, 0.26); const stemGeo2 = new THREE.BoxGeometry(0.26, 0.2, 0.07);
  const iH = new THREE.InstancedMesh(housingGeo, M.housing, keys.length);
  const iT = new THREE.InstancedMesh(topGeo, M.clear, keys.length);
  const iS1 = new THREE.InstancedMesh(stemGeo, M.stem, keys.length);
  const iS2 = new THREE.InstancedMesh(stemGeo2, M.stem, keys.length);
  const tmp = new THREE.Object3D();
  keys.forEach((k, i) => {
    tmp.position.set(k.x, 0.02, k.z); tmp.updateMatrix(); iH.setMatrixAt(i, tmp.matrix);
    tmp.position.set(k.x, 0.2, k.z); tmp.updateMatrix(); iT.setMatrixAt(i, tmp.matrix);
    tmp.position.set(k.x, 0.33, k.z); tmp.updateMatrix(); iS1.setMatrixAt(i, tmp.matrix); iS2.setMatrixAt(i, tmp.matrix);
  });
  kb.add(iH, iT, iS1, iS2);

  // case + plate + soft shadow
  const caseMesh = new THREE.Mesh(new RoundedBoxGeometry(15.75, 0.8, 6.95, 4, 0.26), M.case);
  caseMesh.position.y = -0.32; kb.add(caseMesh);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(15.15, 0.04, 6.4), M.plate); plate.position.y = 0.085; kb.add(plate);
  const sh = document.createElement('canvas'); sh.width = sh.height = 128;
  { const g = sh.getContext('2d'); const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(22, 11), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sh), transparent: true, depthWrite: false, opacity: 0.55 }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.95; kb.add(shadow);

  const esc = keys[0];

  /* hero switch (built in keyboard units) */
  const hero = new THREE.Group(); world.add(hero);
  const mk = (geo, mat) => new THREE.Mesh(geo, mat);
  const pins = new THREE.Group();
  [[-0.14, -0.1], [0.12, 0.12]].forEach(([x, z]) => { const m = mk(new THREE.CylinderGeometry(0.025, 0.025, 0.28, 10), M.gold); m.position.set(x, 0, z); pins.add(m); });
  const post = mk(new THREE.CylinderGeometry(0.07, 0.07, 0.22, 16), M.housing); post.position.y = 0.02; pins.add(post);
  const bottom = mk(housingGeo, M.housing);
  const helix = new THREE.Curve(); helix.getPoint = (t, o = new THREE.Vector3()) => o.set(Math.cos(t * Math.PI * 2 * 7) * 0.12, t * 0.36 - 0.18, Math.sin(t * Math.PI * 2 * 7) * 0.12);
  const spring = mk(new THREE.TubeGeometry(helix, 220, 0.014, 6, false), M.spring);
  const stem = new THREE.Group();
  { const base = mk(new RoundedBoxGeometry(0.34, 0.12, 0.34, 2, 0.03), M.stem); base.position.y = -0.08; stem.add(base); stem.add(mk(stemGeo, M.stem)); stem.add(mk(stemGeo2, M.stem)); }
  const topH = mk(topGeo, M.clear);
  const heroCap = makeCap(1, 'esc', M.accent);
  // [object, assembled y, exploded y, exploded rot x, rot z]
  const parts = [
    [pins, -0.2, -1.35, 0.2, 0.25],
    [bottom, 0.02, -0.85, 0.12, 0.18],
    [spring, 0.12, -0.3, 0.0, -0.1],
    [stem, 0.33, 0.35, -0.15, -0.28],
    [topH, 0.2, 0.95, 0.25, 0.22],
    [heroCap, CAP_Y, 1.68, -0.22, -0.16],
  ];
  parts.forEach(p => hero.add(p[0]));

  /* particles */
  const PN = coarse ? 160 : 320;
  const pg = new THREE.BufferGeometry(); const pp = new Float32Array(PN * 3);
  for (let i = 0; i < PN; i++) { pp[i * 3] = (Math.random() - 0.5) * 26; pp[i * 3 + 1] = (Math.random() - 0.5) * 18; pp[i * 3 + 2] = -10 + Math.random() * 12; }
  pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const dots = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, transparent: true, opacity: 0.75, depthWrite: false }));
  scene.add(dots);

  /* poses: [x,y,z, rx,ry,rz, scale] ; landscape (L) and portrait (P) */
  const HERO = {
    L: [[3.0, 0.0, 0, 0.42, -0.6, -0.22, 1.85], [-2.9, -0.2, 1.2, 0.55, 0.65, 0.08, 2.25]],
    P: [[0, 1.3, 0, 0.42, -0.6, -0.22, 1.04], [0, 1.55, 0, 0.55, 0.65, 0.08, 1.65]],
  };
  const KB = {
    L: [null, [3.4, -9.5, -2, 1.2, -0.9, 0.3, 0.6], [3.25, -0.7, 0, 0.78, -0.58, 0.14, 0.62], [-3.05, -0.35, 0, 0.62, 0.5, -0.08, 0.5], [3.7, -0.35, 0, 0.9, -0.32, 0.06, 0.4], [0, -1.25, -1, 1.0, 0, 0, 0.5]],
    P: [null, [0.6, -8, -2, 1.2, -0.9, 0.3, 0.34], [0.55, 1.5, 0, 0.85, -0.62, 0.16, 0.36], [0.15, 2.45, 0, 0.7, 0.5, -0.08, 0.27], [0, 2.7, 0, 0.92, -0.22, 0.04, 0.215], [0, 1.6, 0, 0.98, 0, 0, 0.24]],
  };
  let mode = 'L', fit = 1;
  const v3 = new THREE.Vector3(), e3 = new THREE.Euler(), q1 = new THREE.Quaternion();
  function applyPose(obj, A, B, t) {
    const P = A.map((a, i) => lerp(a, B[i], t));
    const xs = mode === 'L' ? fit : 1;
    obj.position.set(P[0] * xs, P[1], P[2]);
    obj.rotation.set(P[3], P[4], P[5]);
    obj.scale.setScalar(P[6] * fit);
  }

  /* resize */
  let lastW = 0, lastH = 0;
  function resize(force) {
    const w = innerWidth, h = renderer.domElement.clientHeight || innerHeight;
    if (!force && w === lastW && Math.abs(h - lastH) < 140) return;
    lastW = w; lastH = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const a = w / h;
    mode = a < 0.85 ? 'P' : 'L';
    fit = mode === 'P' ? clamp(a / 0.46, 0.85, 1.3) : clamp(a / 1.78, 0.62, 1.05);
  }
  resize(true);
  addEventListener('resize', () => resize(false));

  /* interaction */
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => { tilt.ty = (e.clientX / innerWidth - 0.5) * 0.32; tilt.tx = (e.clientY / innerHeight - 0.5) * 0.18; }, { passive: true });
  const codeMap = { escape: 'esc', backspace: '⌫', capslock: 'caps', ' ': '', control: 'ctrl', meta: 'alt', arrowup: '↑', arrowdown: '↓', arrowleft: '←', arrowright: '→', delete: 'del', '~': '`' };
  const findKeys = (e) => { const k = e.key.toLowerCase(); return byLabel.get(codeMap[k] ?? k) || []; };
  addEventListener('keydown', (e) => { if (e.target.closest && e.target.closest('input,textarea')) return; findKeys(e).forEach(k => { k.target = 1; k.hold = true; }); });
  addEventListener('keyup', (e) => findKeys(e).forEach(k => { k.target = 0; k.hold = false; }));
  document.querySelectorAll('.sw').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.sw').forEach(x => x.classList.toggle('active', x === b));
    const p = PAL[b.dataset.pal];
    const go = (mat, hex) => { const c = new THREE.Color(hex); if (window.gsap) gsap.to(mat.color, { r: c.r, g: c.g, b: c.b, duration: 0.6, ease: 'power2.out' }); else mat.color.copy(c); };
    go(M.alpha, p.alpha); go(M.mod, p.mod); go(M.accent, p.accent); go(M.case, p.case); go(legendMat, p.legend);
    keys.forEach((k, i) => setTimeout(() => { k.target = 1; setTimeout(() => k.target = 0, 140); }, k.nx * 420 + k.r * 30));
  }));

  /* loop */
  let s = SNAP ? rawS() : 0, t0 = performance.now(), last = t0, frames = 0, slow = 0, nextType = 0;
  const clock = { t: 0 };
  window.__k7 = { get s() { return s; }, frames: () => frames };
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; clock.t += dt; frames++;
    const raw = rawS();
    s = SNAP ? raw : s + (raw - s) * (1 - Math.exp(-dt * 5));
    if (Math.abs(raw - s) < 0.0005) s = raw;
    updateRail(s);
    const T = clock.t;

    // adaptive resolution
    if (frames > 30 && frames < 150) { if (dt > 0.034) slow++; if (slow > 40 && maxDpr > 1) { maxDpr = 1; renderer.setPixelRatio(1); resize(true); } }

    tilt.x += (tilt.tx - tilt.x) * 0.05; tilt.y += (tilt.ty - tilt.y) * 0.05;
    const sway = coarse ? Math.sin(T * 0.6) * 0.06 : 0;
    world.rotation.set(tilt.x, tilt.y + sway, 0);
    world.position.y = Math.sin(T * 0.9) * 0.07;

    // hero switch
    const H = HERO[mode];
    if (s < 1) {
      applyPose(hero, H[0], H[1], sstep(0, 1, s));
      hero.rotation.y += Math.sin(T * 0.5) * 0.55 * (1 - sstep(0.4, 1, s));
    } else {
      applyPose(hero, H[1], H[1], 0);
    }
    parts.forEach(([o, ay, ey, rx, rz], i) => {
      const a = sstep(0.12 + i * 0.05, 0.72 + i * 0.05, s);
      const bob = (1 - a) * Math.sin(T * 1.2 + i) * 0.05;
      o.position.y = lerp(ey, ay, a) + bob;
      o.rotation.set(rx * (1 - a), 0, rz * (1 - a));
    });

    // keyboard
    const K = KB[mode];
    kb.visible = s > 1.0;
    if (kb.visible) {
      const i = Math.min(4, Math.floor(s)), t = sstep(0, 1, s - i);
      applyPose(kb, K[i], K[Math.min(5, i + 1)], s >= 5 ? 0 : t);
      if (s >= 5) applyPose(kb, K[5], K[5], 0);
      kb.position.y += Math.sin(T * 0.7 + 1) * 0.05;
    }
    // hero flies into the esc slot
    const f = sstep(1.05, 1.92, s);
    if (s > 1.0) {
      kb.updateMatrix();
      const E = new THREE.Matrix4().makeTranslation(esc.x, 0, esc.z).premultiply(kb.matrix);
      const pE = new THREE.Vector3(), qE = new THREE.Quaternion(), sE = new THREE.Vector3();
      E.decompose(pE, qE, sE);
      hero.position.lerp(pE, f); hero.quaternion.slerp(qE, f); hero.scale.lerp(sE, f);
    }
    const docked = s >= 1.93;
    hero.visible = !docked; esc.cap.visible = docked;

    // keys: wave, lift, typing
    const lift = sstep(2.35, 2.95, s) * (1 - sstep(3.3, 3.85, s));
    const waveOn = s > 1.7 && s < 2.6;
    const wpos = (s - 1.75) * 1.4;
    if (!reduce && s > 1.9 && now > nextType) {
      const k = keys[(Math.random() * keys.length) | 0];
      if (!k.hold) { k.target = 1; setTimeout(() => { if (!k.hold) k.target = 0; }, 110); }
      nextType = now + 70 + Math.random() * 160;
    }
    for (const k of keys) {
      const w = waveOn ? Math.max(0, 1 - Math.abs(wpos - k.nx) * 7) : 0;
      k.press += (Math.max(k.target, w) - k.press) * Math.min(1, dt * 22);
      const li = clamp(lift * 1.35 - k.nx * 0.35);
      const h = li * (0.95 + Math.sin(k.nx * 9 + k.r * 1.7) * 0.25);
      k.cap.position.y = CAP_Y - k.press * 0.16 + h;
      k.cap.rotation.set(li * (k.rnd - 0.5) * 0.5, li * (k.rnd - 0.5) * 1.4, li * (k.r - 2.5) * 0.06);
    }

    dots.rotation.y = T * 0.015;
    dots.position.y = s * 0.9;

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
