(() => {
'use strict';
const $ = s => document.querySelector(s);
const cv = $('#city'), ctx = cv.getContext('2d', { alpha: false });
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t * t * (3 - 2 * t);
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };

/* ---------------- world ---------------- */
const SEG = 200, ROAD_W = 1200, DRAW = 160, CAM_DEPTH = 0.84, N = 1600, L = N * SEG;
const VMAX = 15000, ACC = 9000;
const STOPS = [
  { id: 'about', label: 'ABOUT', name: 'Origin Avenue', short: 'A', gate: 250, c: '#ff3fa4', t: 't-about' },
  { id: 'skills', label: 'SKILLS', name: 'Skill Row', short: 'S', gate: 560, c: '#2ef2ff', t: 't-skills' },
  { id: 'projects', label: 'PROJECTS', name: 'Demo District', short: 'P', gate: 870, c: '#b46bff', t: 't-projects' },
  { id: 'achievements', label: 'ACHIEVEMENTS', name: 'Trophy Heights', short: '\u2605', gate: 1180, c: '#ffd23f', t: 't-achievements' },
  { id: 'contact', label: 'CONTACT', name: 'Signal Bay', short: 'C', gate: 1470, c: '#4dff9a', t: 't-contact' },
];
const STOP_BACK = 17;
STOPS.forEach((s, i) => { s.i = i; s.pos = (s.gate - STOP_BACK) * SEG; });
const WELCOME_SEG = 46;
const ZONE_TEXT = [
  ['JEDDAH', 'DOC CONTROL', 'KAISH', 'OPEN FOR WORK'],
  ['EXCEL', 'HTML CSS JS', 'PHOTOSHOP', 'ACONEX', 'REACT', 'SHAREPOINT', 'ILLUSTRATOR', 'NODE.JS'],
  ['SUMAC GRILL', 'LUMINA', 'SOUQLY', 'KEYFORGE K7', 'SAHN ATELIER', 'QAHWA HOUSE', 'BAZARO'],
  ['B.SC PHYSICS', 'REACT JS', '100% EXAM', 'ROSHN AL AROUS'],
  ['WHATSAPP', 'FIVERR', 'FREELANCER', 'GITHUB'],
];
const BRANDS = ['ZEPHYR COLA', 'PIXEL MART', 'VOLTA MOTORS', 'NEON NOODLE', 'SOUQ 24/7', 'CHAI CORNER', 'NOVA FM', 'ORBIT GYM'];
function zoneOf(seg) { // district index nearest to this segment (for colour)
  let best = 0, bd = 1e9;
  STOPS.forEach((s, i) => { let d = Math.abs(seg - s.gate); d = Math.min(d, N - d); if (d < bd) { bd = d; best = i; } });
  return best;
}
function flatMask(i) {
  let m = 1;
  const pts = STOPS.map(s => s.gate).concat([WELCOME_SEG, 0, N]);
  for (const g of pts) { const d = i - g; const from = -48, to = 14; if (d > from - 30 && d < to + 30) { let k; if (d < from) k = (from - d) / 30; else if (d > to) k = (d - to) / 30; else k = 0; m = Math.min(m, ease(clamp(k, 0, 1))); } }
  return m;
}
const segs = [];
for (let i = 0; i < N; i++) {
  const a = 2 * Math.PI * i / N, m = flatMask(i);
  const curve = m * (3.2 * Math.sin(a * 5 + 0.7) + 2.2 * Math.sin(a * 9 + 2.1));
  const y = m * (900 * Math.sin(a * 4 + 1.2) + 420 * Math.sin(a * 11 + 0.3));
  segs.push({ i, curve, y, sprites: [], z: i * SEG, band: Math.floor(i / 3) % 2, zone: zoneOf(i) });
}
segs.forEach((s, i) => { s.y1 = s.y; s.y2 = segs[(i + 1) % N].y; });

/* ---------------- sprite art (procedural) ---------------- */
const art = { bld: [], palm: null, lampL: null, lampR: null, bb: {}, gates: [], welcome: null, car: null, npcBack: null, npcFront: null, skyFar: null, skyMid: null, sky: null, sun: null };
const FONT_T = '"Anton", Impact, "Arial Black", sans-serif', FONT_S = '"Yellowtail", "Brush Script MT", cursive', FONT_H = '"Chakra Petch", system-ui, sans-serif';
const ACCENTS = ['#ff3fa4', '#2ef2ff', '#b46bff', '#ffd23f', '#4dff9a', '#ff8a3d'];

function drawBuilding(c, r, acc) {
  const g = c.getContext('2d'), w = c.width, h = c.height;
  const top = Math.round(h * (0.02 + r() * 0.06));
  const grd = g.createLinearGradient(0, 0, w, 0);
  grd.addColorStop(0, '#2a1846'); grd.addColorStop(0.55, '#1b1035'); grd.addColorStop(1, '#120a26');
  g.fillStyle = grd; g.fillRect(0, top, w, h - top);
  // sunset rim light
  const rim = g.createLinearGradient(0, 0, w * 0.25, 0); rim.addColorStop(0, 'rgba(255,140,90,.45)'); rim.addColorStop(1, 'rgba(255,140,90,0)');
  g.fillStyle = rim; g.fillRect(0, top, w * 0.25, h - top);
  // windows
  const cols = 4 + Math.floor(r() * 5), rows = Math.floor((h - top) / (w / cols) * 0.9);
  const cw = w / cols, rh = (h - top - 30) / Math.max(rows, 1);
  const pal = ['#ffd27a', '#ffe9b0', '#7ff6ff', '#ff9ad2', '#ffc46b'];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const lit = r() < 0.42;
    g.fillStyle = lit ? pal[Math.floor(r() * pal.length)] : 'rgba(80,60,130,.35)';
    g.globalAlpha = lit ? 0.6 + r() * 0.4 : 1;
    g.fillRect(x * cw + cw * 0.22, top + 18 + y * rh + rh * 0.2, cw * 0.56, rh * 0.5);
  }
  g.globalAlpha = 1;
  // neon outline on roof + one vertical strip
  g.shadowColor = acc; g.shadowBlur = 14; g.strokeStyle = acc; g.lineWidth = 4;
  g.beginPath(); g.moveTo(2, top + 3); g.lineTo(w - 2, top + 3); g.stroke();
  if (r() < 0.6) { const sx = Math.round(w * (0.1 + r() * 0.8)); g.beginPath(); g.moveTo(sx, top + 10); g.lineTo(sx, h * (0.35 + r() * 0.4)); g.stroke(); }
  g.shadowBlur = 0;
  // antenna
  if (r() < 0.5) { g.fillStyle = '#1b1035'; const ax = w * (0.3 + r() * 0.4); g.fillRect(ax, 0, 4, top + 2); }
}
function drawPalm(c) {
  const g = c.getContext('2d'), w = c.width, h = c.height;
  g.strokeStyle = '#140a24'; g.lineCap = 'round';
  g.lineWidth = w * 0.07; g.beginPath(); g.moveTo(w * 0.5, h); g.quadraticCurveTo(w * 0.62, h * 0.55, w * 0.5, h * 0.16); g.stroke();
  g.lineWidth = w * 0.025; g.strokeStyle = 'rgba(255,90,160,.55)'; g.beginPath(); g.moveTo(w * 0.47, h); g.quadraticCurveTo(w * 0.59, h * 0.55, w * 0.47, h * 0.17); g.stroke();
  g.fillStyle = '#140a24';
  for (let k = 0; k < 9; k++) {
    const ang = -Math.PI / 2 + (k - 4) * 0.42 + (k % 2 ? 0.1 : -0.1);
    g.save(); g.translate(w * 0.5, h * 0.16); g.rotate(ang);
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(w * 0.3, -h * 0.05, w * 0.5, h * 0.09); g.quadraticCurveTo(w * 0.25, h * 0.0, 0, h * 0.02); g.fill();
    g.restore();
  }
}
function drawLamp(c, flip) {
  const g = c.getContext('2d'), w = c.width, h = c.height;
  g.save(); if (flip) { g.translate(w, 0); g.scale(-1, 1); }
  g.fillStyle = '#251840'; g.fillRect(w * 0.12, h * 0.08, w * 0.07, h * 0.92);
  g.fillRect(w * 0.12, h * 0.08, w * 0.6, h * 0.025);
  const rg = g.createRadialGradient(w * 0.7, h * 0.12, 1, w * 0.7, h * 0.12, w * 0.32);
  rg.addColorStop(0, 'rgba(255,240,200,1)'); rg.addColorStop(0.25, 'rgba(255,190,120,.8)'); rg.addColorStop(1, 'rgba(255,150,90,0)');
  g.fillStyle = rg; g.fillRect(w * 0.3, 0, w * 0.7, h * 0.3);
  g.restore();
}
function drawBillboard(c, text, acc) {
  const g = c.getContext('2d'), w = c.width, h = c.height;
  g.clearRect(0, 0, w, h);
  const ph = h * 0.62;
  g.fillStyle = '#1d1233'; g.fillRect(w * 0.47, ph, w * 0.06, h - ph);
  g.fillStyle = '#0e0820'; g.fillRect(6, 6, w - 12, ph - 12);
  const bg = g.createLinearGradient(0, 0, 0, ph); bg.addColorStop(0, 'rgba(255,255,255,.06)'); bg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = bg; g.fillRect(6, 6, w - 12, ph - 12);
  g.shadowColor = acc; g.shadowBlur = 16; g.strokeStyle = acc; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, ph - 20);
  let fs = ph * 0.5; g.font = `${fs}px ${FONT_T}`;
  while (g.measureText(text).width > w - 50 && fs > 10) { fs -= 2; g.font = `${fs}px ${FONT_T}`; }
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowBlur = 20;
  g.fillText(text, w / 2, ph / 2 + 2); g.shadowBlur = 0;
}
function drawGate(c, big, small, acc, script) {
  const g = c.getContext('2d'), w = c.width, h = c.height;
  g.clearRect(0, 0, w, h);
  const pw = w * 0.035, bh = h * 0.3;
  g.fillStyle = '#1c1131';
  g.fillRect(0, bh * 0.5, pw, h - bh * 0.5); g.fillRect(w - pw, bh * 0.5, pw, h - bh * 0.5);
  g.fillStyle = '#120a22'; g.fillRect(pw * 0.5, 0, w - pw, bh);
  g.shadowColor = acc; g.shadowBlur = 22; g.strokeStyle = acc; g.lineWidth = 7;
  g.strokeRect(pw * 0.5 + 8, 8, w - pw - 16, bh - 16);
  // pillar neon strips
  g.lineWidth = 5; g.beginPath(); g.moveTo(pw * 0.5, bh); g.lineTo(pw * 0.5, h); g.moveTo(w - pw * 0.5, bh); g.lineTo(w - pw * 0.5, h); g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
  if (script) {
    g.font = `${bh * 0.36}px ${FONT_S}`; g.shadowBlur = 24; g.fillText(script, w / 2, bh * 0.3);
    let fs = bh * 0.46; g.font = `${fs}px ${FONT_T}`; while (g.measureText(big).width > w * 0.8) { fs -= 2; g.font = `${fs}px ${FONT_T}`; }
    g.fillStyle = '#ffd27a'; g.shadowColor = '#ff8a3d'; g.fillText(big, w / 2, bh * 0.68);
  } else {
    let fs = bh * 0.5; g.font = `${fs}px ${FONT_T}`; while (g.measureText(big).width > w * 0.8) { fs -= 2; g.font = `${fs}px ${FONT_T}`; }
    g.shadowBlur = 24; g.fillText(big, w / 2, bh * 0.43);
    g.font = `700 ${bh * 0.16}px ${FONT_H}`; g.fillStyle = acc; g.shadowBlur = 10;
    g.fillText(small.toUpperCase().split('').join(' '), w / 2, bh * 0.8);
  }
  g.shadowBlur = 0;
}
function drawCarBack(c, body, lights) {
  const g = c.getContext('2d'), w = c.width, h = c.height;
  g.clearRect(0, 0, w, h);
  // shadow
  const sh = g.createRadialGradient(w / 2, h * 0.93, 4, w / 2, h * 0.93, w * 0.55);
  sh.addColorStop(0, 'rgba(0,0,0,.75)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sh; g.fillRect(0, h * 0.75, w, h * 0.25);
  // tyres
  g.fillStyle = '#07050c';
  g.beginPath(); g.roundRect(w * 0.05, h * 0.62, w * 0.17, h * 0.33, 10); g.fill();
  g.beginPath(); g.roundRect(w * 0.78, h * 0.62, w * 0.17, h * 0.33, 10); g.fill();
  // lower body
  g.beginPath();
  g.moveTo(w * 0.04, h * 0.5); g.quadraticCurveTo(w * 0.02, h * 0.78, w * 0.08, h * 0.86);
  g.lineTo(w * 0.92, h * 0.86); g.quadraticCurveTo(w * 0.98, h * 0.78, w * 0.96, h * 0.5);
  g.quadraticCurveTo(w * 0.9, h * 0.36, w * 0.78, h * 0.33); g.lineTo(w * 0.22, h * 0.33); g.quadraticCurveTo(w * 0.1, h * 0.36, w * 0.04, h * 0.5); g.closePath();
  const bg = g.createLinearGradient(0, h * 0.3, 0, h * 0.9); bg.addColorStop(0, body[0]); bg.addColorStop(0.45, body[1]); bg.addColorStop(1, body[2]);
  g.fillStyle = bg; g.fill();
  // cabin / rear glass
  g.beginPath(); g.moveTo(w * 0.22, h * 0.34); g.quadraticCurveTo(w * 0.27, h * 0.06, w * 0.5, h * 0.05); g.quadraticCurveTo(w * 0.73, h * 0.06, w * 0.78, h * 0.34); g.closePath();
  const cg = g.createLinearGradient(0, h * 0.05, 0, h * 0.34); cg.addColorStop(0, body[0]); cg.addColorStop(1, body[1]); g.fillStyle = cg; g.fill();
  g.beginPath(); g.moveTo(w * 0.28, h * 0.31); g.quadraticCurveTo(w * 0.32, h * 0.11, w * 0.5, h * 0.1); g.quadraticCurveTo(w * 0.68, h * 0.11, w * 0.72, h * 0.31); g.closePath();
  const gg = g.createLinearGradient(w * 0.3, h * 0.1, w * 0.7, h * 0.31); gg.addColorStop(0, '#4a2a6e'); gg.addColorStop(0.45, '#170d2a'); gg.addColorStop(0.55, '#ff7aa8'); gg.addColorStop(0.6, '#2a1546'); gg.addColorStop(1, '#0c0716');
  g.fillStyle = gg; g.fill();
  // spoiler
  g.fillStyle = body[2]; g.beginPath(); g.roundRect(w * 0.14, h * 0.31, w * 0.72, h * 0.045, 6); g.fill();
  g.fillStyle = 'rgba(255,140,190,.5)'; g.fillRect(w * 0.16, h * 0.312, w * 0.68, h * 0.008);
  // shoulder reflection
  g.strokeStyle = 'rgba(255,150,200,.55)'; g.lineWidth = Math.max(2, h * 0.012);
  g.beginPath(); g.moveTo(w * 0.07, h * 0.5); g.quadraticCurveTo(w * 0.5, h * 0.44, w * 0.93, h * 0.5); g.stroke();
  // tail light bar
  if (lights) {
    g.shadowColor = '#ff1e3c'; g.shadowBlur = h * 0.08;
    g.fillStyle = '#ff2b45'; g.beginPath(); g.roundRect(w * 0.08, h * 0.47, w * 0.84, h * 0.04, 4); g.fill();
    g.fillStyle = '#ff5a6a'; g.beginPath(); g.roundRect(w * 0.07, h * 0.45, w * 0.17, h * 0.08, 6); g.fill(); g.beginPath(); g.roundRect(w * 0.76, h * 0.45, w * 0.17, h * 0.08, 6); g.fill();
    g.shadowBlur = 0; g.fillStyle = '#ffd0d6'; g.fillRect(w * 0.1, h * 0.483, w * 0.8, h * 0.008);
  }
  // plate
  g.fillStyle = '#e9e6f2'; g.beginPath(); g.roundRect(w * 0.4, h * 0.58, w * 0.2, h * 0.09, 4); g.fill();
  g.fillStyle = '#1a1030'; g.font = `700 ${h * 0.065}px ${FONT_H}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('KAISH', w * 0.5, h * 0.628);
  // diffuser + exhausts
  g.fillStyle = '#07050c'; g.beginPath(); g.roundRect(w * 0.2, h * 0.76, w * 0.6, h * 0.09, 6); g.fill();
  g.strokeStyle = '#2b2140'; g.lineWidth = 3; for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(w * (0.2 + k * 0.1), h * 0.77); g.lineTo(w * (0.2 + k * 0.1), h * 0.85); g.stroke(); }
  for (const ex of [0.27, 0.73]) { g.fillStyle = '#9a96a8'; g.beginPath(); g.ellipse(w * ex, h * 0.8, w * 0.035, h * 0.035, 0, 0, 7); g.fill(); g.fillStyle = '#0a0710'; g.beginPath(); g.ellipse(w * ex, h * 0.8, w * 0.024, h * 0.024, 0, 0, 7); g.fill(); }
}
function drawNpcFront(c) {
  const g = c.getContext('2d'), w = c.width, h = c.height;
  g.fillStyle = '#0b0714'; g.beginPath(); g.roundRect(w * 0.06, h * 0.35, w * 0.88, h * 0.55, 14); g.fill();
  g.beginPath(); g.roundRect(w * 0.2, h * 0.08, w * 0.6, h * 0.32, 14); g.fill();
  g.fillStyle = '#5c4b85'; g.beginPath(); g.roundRect(w * 0.25, h * 0.13, w * 0.5, h * 0.22, 8); g.fill();
  g.shadowColor = '#fff'; g.shadowBlur = 20; g.fillStyle = '#fffbe8';
  g.beginPath(); g.ellipse(w * 0.2, h * 0.55, w * 0.09, h * 0.07, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(w * 0.8, h * 0.55, w * 0.09, h * 0.07, 0, 0, 7); g.fill();
}
function buildArt() {
  const r = rng(7);
  art.bld = [];
  for (let k = 0; k < 14; k++) { const w = 200, h = 230 + Math.floor(r() * 360); const c = mk(w, h); drawBuilding(c, r, ACCENTS[k % ACCENTS.length]); art.bld.push(c); }
  art.palm = mk(220, 440); drawPalm(art.palm);
  art.lampL = mk(160, 460); drawLamp(art.lampL, false); art.lampR = mk(160, 460); drawLamp(art.lampR, true);
  buildText();
  art.car = mk(520, 240); drawCarBack(art.car, ['#2a2140', '#110c1c', '#050308'], true);
  const pal = [['#3b3f63', '#1a1b2e', '#08080f'], ['#5b1530', '#2a0a18', '#0b0306'], ['#e8e4f0', '#8f8aa6', '#2a2638'], ['#1d4e63', '#0d2430', '#040b10']];
  art.npcBack = pal.map(p => { const c = mk(260, 120); drawCarBack(c, p, true); return c; });
  art.npcFront = mk(240, 130); drawNpcFront(art.npcFront);
}
function buildText() {
  art.bb = {};
  const all = new Set(BRANDS); ZONE_TEXT.forEach(z => z.forEach(t => all.add(t)));
  all.forEach(t => { const c = mk(480, 400); art.bb[t] = c; });
  ZONE_TEXT.forEach((z, zi) => z.forEach(t => drawBillboard(art.bb[t], t, STOPS[zi].c)));
  BRANDS.forEach((t, i) => drawBillboard(art.bb[t], t, ACCENTS[(i + 2) % ACCENTS.length]));
  art.gates = STOPS.map(s => { const c = mk(1200, 620); drawGate(c, s.label, s.name, s.c); return c; });
  art.welcome = mk(1200, 620); drawGate(art.welcome, 'KAISH CITY', '', '#ff8a3d', 'Welcome to');
}

/* place sprites */
function place() {
  const r = rng(42);
  for (const s of segs) s.sprites = [];
  const add = (i, sp) => segs[((i % N) + N) % N].sprites.push(sp);
  for (let i = 0; i < N; i++) {
    const nearGate = STOPS.some(s => Math.abs(i - s.gate) < 3) || Math.abs(i - WELCOME_SEG) < 3;
    if (i % 5 === 0) for (const side of [-1, 1]) {
      if (r() < 0.7) { const b = art.bld[Math.floor(r() * art.bld.length)]; const ww = 2000 + r() * 1800; add(i, { img: b, ww, wh: ww * b.height / b.width, off: side * (2.4 + r() * 2.4), fog: true }); }
    }
    if (i % 10 === 3 && !nearGate) for (const side of [-1, 1]) add(i, { img: art.palm, ww: 900, wh: 1800, off: side * 1.22 });
    if (i % 10 === 8 && !nearGate) { add(i, { img: art.lampL, ww: 520, wh: 1500, off: -1.08, lamp: 1 }); add(i, { img: art.lampR, ww: 520, wh: 1500, off: 1.08, lamp: 1 }); }
  }
  // billboards
  let bi = 0;
  for (let i = 30; i < N; i += 34) {
    if (STOPS.some(s => Math.abs(i - s.gate) < 8) || Math.abs(i - WELCOME_SEG) < 8) continue;
    const z = segs[i].zone, near = STOPS.some(s => Math.abs(i - s.gate) < 120);
    const list = near ? ZONE_TEXT[z] : BRANDS; const t = list[(bi++) % list.length];
    add(i, { img: art.bb[t], key: t, ww: 2000, wh: 1666, off: (bi % 2 ? -1 : 1) * 1.45, bb: 1 });
  }
  STOPS.forEach((s, k) => add(s.gate, { img: art.gates[k], ww: ROAD_W * 2.5, wh: ROAD_W * 2.5 * 620 / 1200, center: 1, gate: k }));
  add(WELCOME_SEG, { img: art.welcome, ww: ROAD_W * 2.5, wh: ROAD_W * 2.5 * 620 / 1200, center: 1, gate: -1 });
}

/* traffic */
const traffic = [];
{
  const r = rng(99);
  for (let k = 0; k < 9; k++) traffic.push({ z: r() * L, x: 0.72, v: 3500 + r() * 3500, img: k % 4, dir: 1 });
  for (let k = 0; k < 12; k++) traffic.push({ z: r() * L, x: k % 2 ? -0.3 : -0.74, v: -(5000 + r() * 4000), dir: -1 });
}

/* ---------------- background layers ---------------- */
function buildSky() {
  const h = Math.ceil(H * 0.5 + 4);
  art.sky = mk(W, h); const g = art.sky.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#120830'); gr.addColorStop(0.35, '#3a1260'); gr.addColorStop(0.62, '#a3286f'); gr.addColorStop(0.85, '#ff6a5c'); gr.addColorStop(1, '#ffb36b');
  g.fillStyle = gr; g.fillRect(0, 0, W, h);
  // skyline far (tile)
  const r = rng(3), tw = 1400;
  art.skyFar = mk(tw, 260); const f = art.skyFar.getContext('2d');
  f.fillStyle = '#6a2a7e';
  let x = 0; while (x < tw) { const bw = 20 + r() * 60, bh = 40 + r() * 190; f.fillRect(x, 260 - bh, bw, bh); if (r() < 0.25) f.fillRect(x + bw / 2 - 2, 260 - bh - 30, 4, 30); x += bw + r() * 6; }
  art.skyMid = mk(tw, 320); const m = art.skyMid.getContext('2d');
  x = 0; const r2 = rng(5);
  while (x < tw) {
    const bw = 34 + r2() * 80, bh = 60 + r2() * 250;
    m.fillStyle = '#2b0f45'; m.fillRect(x, 320 - bh, bw, bh);
    for (let yy = 320 - bh + 8; yy < 316; yy += 9) for (let xx = x + 4; xx < x + bw - 5; xx += 8) if (r2() < 0.18) { m.fillStyle = r2() < 0.7 ? 'rgba(255,214,140,.85)' : 'rgba(120,240,255,.8)'; m.fillRect(xx, yy, 3, 4); }
    if (r2() < 0.2) { m.fillStyle = '#2b0f45'; m.fillRect(x + bw * 0.5 - 2, 320 - bh - 50, 4, 50); }
    x += bw + 2 + r2() * 10;
  }
  // sun
  const sr = Math.min(W, h * 1.6) * 0.22;
  art.sun = mk(sr * 2 + 4, sr * 2 + 4); const s = art.sun.getContext('2d');
  const sg = s.createLinearGradient(0, 0, 0, sr * 2); sg.addColorStop(0, '#ffe56b'); sg.addColorStop(0.5, '#ff9a4a'); sg.addColorStop(1, '#ff3f8a');
  s.fillStyle = sg; s.beginPath(); s.arc(sr + 2, sr + 2, sr, 0, 7); s.fill();
  s.globalCompositeOperation = 'destination-out';
  for (let k = 0; k < 7; k++) { const yy = sr * (1.05 + k * 0.14); s.fillRect(0, yy, sr * 2 + 4, 2 + k * 1.6); }
  art.sunR = sr;
}
const stars = (() => { const r = rng(11); return Array.from({ length: 70 }, () => ({ x: r(), y: r() * 0.45, p: r() * 6.28, s: 0.6 + r() * 1.3 })); })();
const beacons = (() => { const r = rng(12); return Array.from({ length: 14 }, () => ({ x: r(), h: 0.25 + r() * 0.6, p: r() * 6.28 })); })();

/* ---------------- state ---------------- */
let W = 0, H = 0, DPR = 1, horizon = 0, K = 0, camH = 1000, portrait = true, horizonFrac = 0.36, hfTarget = 0.36;
let pos = 0, vel = 0, target = 0, mode = 'attract', lastInput = -1e9, inputDir = 1, keyHold = 0, steer = 0, steerT = 0, playerX = 0.24;
let skyOffset = 0, time = 0, cardStop = -1, seen = new Set(), approachShown = -1, autoTo = null;
const wrapD = d => { d %= L; if (d > L / 2) d -= L; if (d < -L / 2) d += L; return d; };
const segAt = z => segs[Math.floor((((z % L) + L) % L) / SEG) % N];

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  W = window.innerWidth; H = window.innerHeight;
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  portrait = H > W * 1.05;
  camH = portrait ? 1450 : 1050;
  computeProj();
  buildSky();
}
function computeProj() {
  horizon = H * horizonFrac;
  const carBottom = H * (portrait ? 0.86 : 0.88);
  K = carBottom - horizon;
}

/* ---------------- rendering ---------------- */
const pj = { x: 0, y: 0, w: 0, s: 0 };
function project(wx, wy, wz, camX, camY, camZ, out) {
  const dz = wz - camZ; const sc = CAM_DEPTH / dz;
  out.s = sc; out.x = W / 2 + sc * (wx - camX) * K; out.y = horizon - sc * (wy - camY) * K; out.w = sc * ROAD_W * K;
}
const FOG = [24, 12, 48];
function mixc(c, f) { return `rgb(${c[0] + (FOG[0] - c[0]) * f | 0},${c[1] + (FOG[1] - c[1]) * f | 0},${c[2] + (FOG[2] - c[2]) * f | 0})`; }
const COL = { road: [[30, 22, 50], [36, 27, 58]], ground: [[18, 11, 34], [22, 14, 40]], walk: [[52, 36, 78], [44, 30, 68]], lane: [230, 220, 255] };
function poly(x1, y1, w1, x2, y2, w2, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x1 - w1, y1); ctx.lineTo(x2 - w2, y2); ctx.lineTo(x2 + w2, y2); ctx.lineTo(x1 + w1, y1); ctx.closePath(); ctx.fill(); }

function drawBackground() {
  ctx.drawImage(art.sky, 0, 0, W, horizon + 4);
  // stars
  for (const s of stars) { const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * 2 * s.s + s.p)); ctx.fillStyle = `rgba(255,255,255,${a * 0.8})`; ctx.fillRect(s.x * W, s.y * horizon, s.s, s.s); }
  // sun
  const sr = art.sunR, sx = W * 0.5 + clamp(-skyOffset * 0.04, -W * 0.3, W * 0.3);
  ctx.globalAlpha = 0.9 + 0.1 * Math.sin(time * 0.8);
  ctx.drawImage(art.sun, sx - sr - 2, horizon - sr * 1.55 - 2);
  ctx.globalAlpha = 1;
  // searchlights
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 3; k++) {
    const bx = W * (0.18 + k * 0.33) - (skyOffset * 0.2 % W), ang = -Math.PI / 2 + Math.sin(time * (0.35 + k * 0.12) + k * 2) * 0.55;
    const len = horizon * 1.3, sp = 0.05;
    const gx = ((bx % W) + W) % W;
    const gr = ctx.createLinearGradient(gx, horizon, gx + Math.cos(ang) * len, horizon + Math.sin(ang) * len);
    gr.addColorStop(0, 'rgba(180,220,255,.22)'); gr.addColorStop(1, 'rgba(180,220,255,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(gx, horizon - 20);
    ctx.lineTo(gx + Math.cos(ang - sp) * len, horizon + Math.sin(ang - sp) * len); ctx.lineTo(gx + Math.cos(ang + sp) * len, horizon + Math.sin(ang + sp) * len); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  // plane with blinking light
  const pt = (time * 0.025) % 1.3 - 0.15, px = pt * W, py = horizon * 0.22 + Math.sin(time * 0.3) * 6;
  ctx.fillStyle = '#1a0b30'; ctx.fillRect(px - 9, py - 1, 18, 3); ctx.fillRect(px - 2, py - 5, 4, 10);
  if (Math.sin(time * 9) > 0.3) { ctx.fillStyle = '#ff4060'; ctx.fillRect(px + 8, py, 3, 3); }
  // skylines
  const fsc = Math.max(0.55, horizon / 460), far = art.skyFar, mid = art.skyMid;
  const fw = far.width * fsc, fh = far.height * fsc;
  let ox = -(((skyOffset * 0.12) % fw) + fw) % fw;
  for (let x = ox; x < W; x += fw) ctx.drawImage(far, x, horizon - fh + 2, fw, fh);
  // haze
  const hz = ctx.createLinearGradient(0, horizon - fh * 0.6, 0, horizon); hz.addColorStop(0, 'rgba(255,120,120,0)'); hz.addColorStop(1, 'rgba(255,130,110,.35)'); ctx.fillStyle = hz; ctx.fillRect(0, horizon - fh * 0.6, W, fh * 0.6);
  const mw = mid.width * fsc, mh = mid.height * fsc;
  ox = -(((skyOffset * 0.3) % mw) + mw) % mw;
  for (let x = ox; x < W; x += mw) ctx.drawImage(mid, x, horizon - mh + 2, mw, mh);
  // beacons on mid skyline
  for (const b of beacons) { const a = Math.sin(time * 3 + b.p); if (a > 0.5) { const bx = ((b.x * W + ox) % W + W) % W; ctx.fillStyle = 'rgba(255,60,90,.95)'; ctx.fillRect(bx, horizon - mh * b.h, 3, 3); } }
}

const P1 = { x: 0, y: 0, w: 0, s: 0 }, P2 = { x: 0, y: 0, w: 0, s: 0 };
const buckets = []; for (let n = 0; n < DRAW; n++) buckets.push([]);
function render() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  drawBackground();
  ctx.fillStyle = 'rgb(24,12,48)'; ctx.fillRect(0, horizon, W, H - horizon + 1);
  const zc = ((pos % L) + L) % L;
  const base = segAt(zc), bi = base.i, bp = (zc % SEG) / SEG;
  const playerZ = camH * CAM_DEPTH;
  const pseg = segAt(zc + playerZ), pp = ((zc + playerZ) % SEG) / SEG;
  const playerY = lerp(pseg.y1, pseg.y2, pp);
  const camY = playerY + camH, camX = playerX * ROAD_W + steer * ROAD_W * 0.2;
  let x = 0, dx = -(base.curve * bp);
  // project all segments (near to far), remember
  const proj = [];
  for (let n = 0; n < DRAW; n++) {
    const s = segs[(bi + n) % N]; const looped = s.i < bi;
    const cz = zc - (looped ? L : 0);
    project(0, s.y1, s.z, camX - x, camY, cz, P1); const a = { x: P1.x, y: P1.y, w: P1.w, s: P1.s };
    project(0, s.y2, s.z + SEG, camX - x - dx, camY, cz, P2); const b = { x: P2.x, y: P2.y, w: P2.w, s: P2.s };
    proj.push({ s, a, b, n, clipX: x });
    x += dx; dx += s.curve;
    buckets[n].length = 0;
  }
  // traffic into buckets
  for (const c of traffic) {
    let d = c.z - zc; if (d < 0) d += L; const n = Math.floor(d / SEG) + (bp > (d % SEG) / SEG ? 0 : 0);
    if (d > SEG * 2 && n < DRAW) buckets[n].push(c);
  }
  // draw far to near
  for (let k = proj.length - 1; k >= 0; k--) {
    const { s, a, b, n } = proj[k];
    if (a.s <= 0 || b.y >= a.y + 0.5 && n > 0) { /* back-facing on hill */ }
    const f = Math.min(1, n / DRAW) ** 1.6;
    if (a.s <= 0 || b.s <= 0) continue;
    if (a.y > b.y - 0.5) {
      const ya = a.y, yb = b.y;
      ctx.fillStyle = mixc(COL.ground[s.band], f); ctx.fillRect(0, yb, W, ya - yb + 1);
      poly(a.x, ya, a.w * 1.18, b.x, yb, b.w * 1.18, mixc(COL.walk[s.band], f));
      poly(a.x, ya, a.w, b.x, yb, b.w, mixc(COL.road[s.band], f));
      // neon edge lines
      const zc2 = STOPS[s.zone].c;
      ctx.globalAlpha = 1 - f * 0.6;
      poly(a.x - a.w * 0.97, ya, a.w * 0.025, b.x - b.w * 0.97, yb, b.w * 0.025, s.band ? zc2 : '#ff3fa4');
      poly(a.x + a.w * 0.97, ya, a.w * 0.025, b.x + b.w * 0.97, yb, b.w * 0.025, s.band ? zc2 : '#2ef2ff');
      if (s.band) { poly(a.x, ya, a.w * 0.012, b.x, yb, b.w * 0.012, '#ffd23f'); poly(a.x - a.w * 0.5, ya, a.w * 0.01, b.x - b.w * 0.5, yb, b.w * 0.01, mixc(COL.lane, f)); poly(a.x + a.w * 0.5, ya, a.w * 0.01, b.x + b.w * 0.5, yb, b.w * 0.01, mixc(COL.lane, f)); }
      ctx.globalAlpha = 1;
    }
    // sprites on this segment
    const sa = 1 - clamp((n / DRAW - 0.6) / 0.4, 0, 1);
    if (sa <= 0.02) continue;
    for (const sp of s.sprites) {
      const sc = a.s, w = sp.ww * sc * K, h = sp.wh * sc * K;
      if (h < 1.2) continue;
      let dxp;
      if (sp.center) dxp = a.x - w / 2; else dxp = sp.off < 0 ? a.x + sp.off * a.w - w : a.x + sp.off * a.w;
      if (dxp > W || dxp + w < 0) continue;
      ctx.globalAlpha = sa;
      if (sp.gate !== undefined) {
        const fl = sp.gate >= 0 && (Math.sin(time * 17 + sp.gate) > 0.93 || Math.sin(time * 1.3 + sp.gate * 2) > 0.985) ? 0.72 : 1;
        ctx.globalAlpha = sa * fl;
      }
      ctx.drawImage(sp.img, dxp, a.y - h, w, h);
      if (sp.lamp && n < DRAW * 0.6) { // light pool
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.12 * sa;
        ctx.fillStyle = '#ff9d5c'; ctx.beginPath(); ctx.ellipse(a.x + sp.off * a.w * 0.82, a.y, w * 0.9, w * 0.18, 0, 0, 7); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
    }
    ctx.globalAlpha = 1;
    for (const c of buckets[n]) {
      const sc = a.s, w = (c.dir > 0 ? 1000 : 950) * sc * K, h = w * (c.dir > 0 ? 120 / 260 : 130 / 240);
      const cx = a.x + c.x * a.w - w / 2;
      ctx.globalAlpha = sa;
      ctx.drawImage(c.dir > 0 ? art.npcBack[c.img] : art.npcFront, cx, a.y - h, w, h);
      if (c.dir < 0) { // headlight beams on road
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.18 * sa; ctx.fillStyle = '#fff3c4';
        ctx.beginPath(); ctx.ellipse(cx + w / 2, a.y + h * 0.15, w * 0.9, h * 0.35, 0, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
      }
      ctx.globalAlpha = 1;
    }
  }
  // wet road sunset reflection
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const rg = ctx.createLinearGradient(0, horizon, 0, H);
  rg.addColorStop(0, 'rgba(255,140,90,.24)'); rg.addColorStop(0.5, 'rgba(255,80,140,.07)'); rg.addColorStop(1, 'rgba(255,80,140,0)');
  ctx.fillStyle = rg; const rw = W * 0.12;
  const topX = W * 0.5 + clamp(-skyOffset * 0.04, -W * 0.3, W * 0.3);
  ctx.beginPath(); ctx.moveTo(topX - rw * 0.4, horizon); ctx.lineTo(topX + rw * 0.4, horizon); ctx.lineTo(W / 2 + rw * 1.6, H); ctx.lineTo(W / 2 - rw * 1.6, H); ctx.closePath(); ctx.fill();
  ctx.restore();
  drawCar(playerY);
  drawSpeedFx();
}

function drawCar() {
  const spd = Math.abs(vel) / VMAX;
  const cw = portrait ? Math.min(W * 0.5, 280) : clamp(W * 0.22, 240, 400);
  const ch = cw * art.car.height / art.car.width;
  const bob = Math.sin(time * (spd > 0.05 ? 22 : 30)) * (spd > 0.05 ? 1.2 * spd + 0.3 : 0.6);
  const cx = W / 2 + steer * cw * 0.08;
  const by = H * (portrait ? 0.86 : 0.88) + 4 + bob;
  const seg = segAt(pos + camH * CAM_DEPTH);
  const tilt = clamp(-seg.curve * spd * 0.012 + steer * 0.04, -0.07, 0.07);
  // underglow
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const ug = ctx.createRadialGradient(cx, by - ch * 0.05, 4, cx, by - ch * 0.05, cw * 0.7);
  ug.addColorStop(0, 'rgba(46,242,255,.45)'); ug.addColorStop(1, 'rgba(46,242,255,0)');
  ctx.fillStyle = ug; ctx.beginPath(); ctx.ellipse(cx, by - ch * 0.04, cw * 0.72, ch * 0.22, 0, 0, 7); ctx.fill();
  // tail light reflection on wet road
  const braking = (vel > 0 && target - pos < vel * 0.6) || keyHold < 0;
  const tl = ctx.createLinearGradient(0, by - ch * 0.1, 0, by + ch * 0.6);
  tl.addColorStop(0, `rgba(255,40,70,${braking ? 0.55 : 0.32})`); tl.addColorStop(1, 'rgba(255,40,70,0)');
  ctx.fillStyle = tl; ctx.fillRect(cx - cw * 0.45, by - ch * 0.05, cw * 0.9, ch * 0.6);
  ctx.restore();
  ctx.save(); ctx.translate(cx, by); ctx.rotate(tilt);
  ctx.drawImage(art.car, -cw / 2, -ch, cw, ch);
  // tail light glow pulse
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = braking ? 0.85 : 0.35 + 0.1 * Math.sin(time * 4);
  const gl = ctx.createRadialGradient(0, -ch * 0.52, 2, 0, -ch * 0.52, cw * 0.55);
  gl.addColorStop(0, 'rgba(255,50,80,.9)'); gl.addColorStop(1, 'rgba(255,50,80,0)');
  ctx.fillStyle = gl; ctx.fillRect(-cw * 0.6, -ch * 0.85, cw * 1.2, ch * 0.7);
  ctx.restore();
  // exhaust puffs
  for (const p of puffs) { ctx.fillStyle = `rgba(200,180,230,${p.a * 0.35})`; ctx.beginPath(); ctx.arc(cx + p.x * cw, by - ch * 0.2 + p.y, p.r, 0, 7); ctx.fill(); }
}
const puffs = [];
function updatePuffs(dt) {
  const spd = Math.abs(vel) / VMAX;
  if (Math.random() < dt * (spd < 0.1 ? 7 : 3)) puffs.push({ x: Math.random() < 0.5 ? -0.23 : 0.23, y: 0, r: 3, a: 1, vy: 10 + spd * 120 });
  for (const p of puffs) { p.y += p.vy * dt; p.r += dt * 14; p.a -= dt * 1.3; p.x += (p.x > 0 ? 1 : -1) * dt * 0.05; }
  while (puffs.length && puffs[0].a <= 0) puffs.shift();
}
const lines = Array.from({ length: 26 }, () => ({ a: Math.random() * 6.28, r: Math.random(), l: 0.1 + Math.random() * 0.2 }));
function drawSpeedFx() {
  const spd = Math.abs(vel) / VMAX; if (spd < 0.45) return;
  const k = (spd - 0.45) / 0.55, cx = W / 2, cy = horizon, R = Math.hypot(W, H);
  ctx.strokeStyle = `rgba(255,255,255,${0.22 * k})`; ctx.lineWidth = 1.5;
  for (const l of lines) {
    l.r += 0.05 + spd * 0.06; if (l.r > 1) { l.r = 0.25 + Math.random() * 0.2; l.a = Math.random() * 6.28; }
    const r1 = l.r * R * 0.6, r2 = r1 + l.l * R * k;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(l.a) * r1, cy + Math.sin(l.a) * r1 * 0.7); ctx.lineTo(cx + Math.cos(l.a) * r2, cy + Math.sin(l.a) * r2 * 0.7); ctx.stroke();
  }
}

/* ---------------- radar ---------------- */
const rcv = $('#radar-cv'), rctx = rcv.getContext('2d');
const MAPS = 600; const mapC = mk(MAPS, MAPS);
function trackPt(t) { const a = t * Math.PI * 2; return [MAPS / 2 + Math.cos(a) * 200 * (1 + 0.16 * Math.sin(3 * a + 0.5)), MAPS / 2 + Math.sin(a) * 160 * (1 + 0.12 * Math.cos(2 * a + 1))]; }
function buildMap() {
  const g = mapC.getContext('2d');
  g.fillStyle = '#1a1230'; g.fillRect(0, 0, MAPS, MAPS);
  g.fillStyle = '#123a5c'; g.beginPath(); g.moveTo(MAPS, 0); g.lineTo(MAPS * 0.86, 0); g.quadraticCurveTo(MAPS * 0.7, MAPS * 0.5, MAPS * 0.92, MAPS); g.lineTo(MAPS, MAPS); g.fill();
  const r = rng(21); g.fillStyle = '#2a1f45';
  for (let x = 6; x < MAPS; x += 26) for (let y = 6; y < MAPS; y += 26) if (r() < 0.75) g.fillRect(x, y, 18 + r() * 4, 18 + r() * 4);
  g.strokeStyle = '#5b4a85'; g.lineWidth = 14; g.lineJoin = 'round'; g.beginPath();
  for (let i = 0; i <= 200; i++) { const [x, y] = trackPt(i / 200); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  g.strokeStyle = '#8f7cc2'; g.lineWidth = 3; g.stroke();
}
function drawRadar() {
  const S = rcv.width, t = (((pos + camH * CAM_DEPTH) % L) + L) % L / L;
  const [px, py] = trackPt(t), [qx, qy] = trackPt(t + 0.002);
  const ang = Math.atan2(qy - py, qx - px);
  rctx.save(); rctx.fillStyle = '#0b0718'; rctx.fillRect(0, 0, S, S);
  rctx.beginPath(); rctx.arc(S / 2, S / 2, S / 2, 0, 7); rctx.clip();
  rctx.translate(S / 2, S * 0.6); rctx.rotate(-ang - Math.PI / 2); const z = 1.05; rctx.scale(z, z); rctx.translate(-px, -py);
  rctx.drawImage(mapC, 0, 0);
  // GPS route to next stop
  const nx = nextStopIndex(true); const st = STOPS[nx].pos / L;
  rctx.strokeStyle = STOPS[nx].c; rctx.lineWidth = 6; rctx.globalAlpha = 0.85; rctx.beginPath();
  let tt = t, end = st < t ? st + 1 : st; let first = true;
  for (; tt <= end; tt += 0.004) { const [x, y] = trackPt(tt % 1); first ? rctx.moveTo(x, y) : rctx.lineTo(x, y); first = false; }
  rctx.stroke(); rctx.globalAlpha = 1;
  const inv = rctx.getTransform();
  rctx.restore();
  // blips upright
  rctx.save(); rctx.beginPath(); rctx.arc(S / 2, S / 2, S / 2 - 1, 0, 7); rctx.clip();
  STOPS.forEach(s => {
    const [bx, by] = trackPt((s.gate * SEG) / L); const p = inv.transformPoint(new DOMPoint(bx, by));
    let X = p.x, Y = p.y; const dx = X - S / 2, dy = Y - S / 2, d = Math.hypot(dx, dy), maxd = S / 2 - 14;
    if (d > maxd) { X = S / 2 + dx / d * maxd; Y = S / 2 + dy / d * maxd; }
    rctx.fillStyle = s.c; rctx.beginPath(); rctx.arc(X, Y, 12, 0, 7); rctx.fill();
    rctx.fillStyle = '#12091f'; rctx.font = `700 14px ${FONT_H}`; rctx.textAlign = 'center'; rctx.textBaseline = 'middle'; rctx.fillText(s.short, X, Y + 1);
  });
  // player arrow
  rctx.translate(S / 2, S * 0.6); rctx.fillStyle = '#fff'; rctx.shadowColor = '#000'; rctx.shadowBlur = 6;
  rctx.beginPath(); rctx.moveTo(0, -13); rctx.lineTo(9, 10); rctx.lineTo(0, 5); rctx.lineTo(-9, 10); rctx.closePath(); rctx.fill();
  rctx.restore();
  rctx.strokeStyle = 'rgba(255,255,255,.25)'; rctx.lineWidth = 4; rctx.beginPath(); rctx.arc(S / 2, S / 2, S / 2 - 2, 0, 7); rctx.stroke();
}

/* ---------------- logic ---------------- */
function nearestStopAbs(z, i) { const s = STOPS[i]; return z + wrapD(s.pos - z); }
function nextStopIndex(strict) { // next stop ahead of pos
  let best = 0, bd = 1e12; STOPS.forEach((s, i) => { let d = ((s.pos - pos) % L + L) % L; if (strict && d < SEG * 3) d += L; if (d < bd) { bd = d; best = i; } }); return best;
}
function prevStopIndex() { let best = 0, bd = 1e12; STOPS.forEach((s, i) => { let d = ((pos - s.pos) % L + L) % L; if (d < SEG * 3) d += L; if (d < bd) { bd = d; best = i; } }); return best; }
function driveTo(i, dir) {
  const s = STOPS[i]; let d = ((s.pos - pos) % L + L) % L; if (dir < 0) d = d - L; if (Math.abs(d) < 1) d = 0;
  target = pos + d; autoTo = i; lastInput = time - 10; closeCard();
}
function snap() {
  // after input stops, settle on a stop in the direction of travel
  let best = -1, bd = 1e12;
  STOPS.forEach((s, i) => { const d = wrapD(s.pos - target); const score = inputDir > 0 ? (d >= -SEG * 22 ? d + SEG * 22 : 1e12) : (d <= SEG * 22 ? -d + SEG * 22 : 1e12); if (score < bd) { bd = score; best = i; } });
  if (best >= 0) { target = target + wrapD(STOPS[best].pos - target); autoTo = best; }
}
const elCard = $('#card'), elBody = $('#card-body');
function openCard(i) {
  if (cardStop === i) return;
  cardStop = i; const s = STOPS[i];
  document.documentElement.style.setProperty('--acc', s.c);
  $('#card-m').textContent = 'MISSION 0' + (i + 1) + ' / 05';
  $('#card-l').textContent = s.label;
  elBody.innerHTML = ''; elBody.appendChild(document.getElementById(s.t).content.cloneNode(true)); elBody.scrollTop = 0;
  elCard.classList.remove('closed'); document.body.classList.add('cardopen');
  $('#card-next').textContent = i === STOPS.length - 1 ? 'To start \u25B6' : 'Drive on \u25B6';
  seen.add(i); updateDots();
  if (portrait) hfTarget = 0.3;
  if (seen.size === STOPS.length && !doneShown) { doneShown = true; setTimeout(() => mission('CITY TOUR COMPLETE', 'Every district visited'), 900); }
}
let doneShown = false;
function closeCard() { if (cardStop < 0) return; cardStop = -1; elCard.classList.add('closed'); document.body.classList.remove('cardopen'); hfTarget = 0.5; }
let mT = 0;
function mission(big, small, ms = 2400) { const m = $('#mission'); m.querySelector('.m-big').textContent = big; m.querySelector('.m-small').textContent = small || ''; m.classList.add('show'); clearTimeout(mT); mT = setTimeout(() => m.classList.remove('show'), ms); }
let dT = 0;
function district(i) { const d = $('#district'); d.style.setProperty('--acc', STOPS[i].c); d.querySelector('.d-name').textContent = STOPS[i].name; d.querySelector('.d-sub').textContent = STOPS[i].label; d.classList.add('show'); clearTimeout(dT); dT = setTimeout(() => d.classList.remove('show'), 2600); }
function updateDots() { document.querySelectorAll('.sdot').forEach((b, i) => { b.classList.toggle('on', i === activeZone); b.classList.toggle('seen', seen.has(i)); }); }
let activeZone = -1;

function update(dt) {
  time += dt;
  if (keyHold) { target = pos + keyHold * VMAX * 0.5; lastInput = time; inputDir = keyHold; autoTo = null; }
  if (mode === 'attract') { target = pos + 2600; hfTarget = portrait ? 0.34 : 0.42; }
  else if (time - lastInput > 0.32 && autoTo === null) snap();
  const d = target - pos;
  let desired = Math.sign(d) * Math.min(VMAX, Math.sqrt(2 * ACC * 0.85 * Math.abs(d)), Math.abs(d) * 3.2);
  vel += clamp(desired - vel, -ACC * 1.3 * dt, ACC * dt * (Math.abs(desired) > Math.abs(vel) ? 1 : 1.3));
  if (Math.abs(d) < 2 && Math.abs(vel) < 40) { vel = 0; pos = target; }
  pos += vel * dt;
  if (pos > L * 4 || pos < -L * 4) { const k = Math.floor(pos / L) * L; pos -= k; target -= k; }
  const spd = vel / VMAX;
  const seg = segAt(pos + camH * CAM_DEPTH);
  skyOffset += seg.curve * spd * dt * 260;
  skyOffset *= 0.9995;
  steer += (steerT - steer) * Math.min(1, dt * 5); steerT *= Math.pow(0.2, dt);
  for (const c of traffic) { c.z = ((c.z + c.v * dt) % L + L) % L; }
  updatePuffs(dt);
  horizonFrac += (hfTarget - horizonFrac) * Math.min(1, dt * 2.6); computeProj();
  if (mode !== 'play') return;
  // arrival
  if (cardStop < 0) STOPS.forEach((s, i) => { if (Math.abs(wrapD(s.pos - pos)) < SEG * 1.2 && Math.abs(vel) < 900 && (autoTo === i || autoTo === null)) { openCard(i); autoTo = null; } });
  if (cardStop >= 0 && Math.abs(wrapD(STOPS[cardStop].pos - pos)) > SEG * 10) closeCard();
  if (autoTo !== null && Math.abs(target - pos) < 2 && Math.abs(vel) < 1) { if (cardStop !== autoTo) openCard(autoTo); autoTo = null; }
  // zone + objective
  const nz = nextStopIndex(false); const dn = ((STOPS[nz].pos - pos) % L + L) % L;
  const az = dn < SEG * 60 ? nz : (cardStop >= 0 ? cardStop : -1);
  if (az !== activeZone) { activeZone = az; updateDots(); if (az >= 0 && cardStop !== az && dn > SEG * 4) district(az); if (az >= 0) document.documentElement.style.setProperty('--acc', STOPS[az].c); }
  objUpdate();
}
let lastObj = '';
function objUpdate() {
  let t, dtext;
  if (cardStop >= 0) { t = 'Exploring ' + STOPS[cardStop].name; dtext = STOPS[cardStop].label; }
  else { const i = autoTo !== null ? autoTo : nextStopIndex(true); const d = ((STOPS[i].pos - pos) % L + L) % L; t = 'Drive to ' + STOPS[i].name; dtext = Math.round(d / 40) + ' m \u00B7 ' + STOPS[i].label; }
  const k = t + dtext; if (k !== lastObj) { lastObj = k; $('#obj-t').textContent = t; $('#obj-d').textContent = dtext; }
}

/* ---------------- input ---------------- */
function userDrive(delta) {
  if (mode !== 'play') return;
  autoTo = null; target += delta; lastInput = time; inputDir = Math.sign(delta) || inputDir;
  const lim = SEG * 70; target = clamp(target, pos - lim, pos + lim);
  hideHint();
}
window.addEventListener('wheel', e => {
  if (e.target.closest && e.target.closest('#card,#map,#intro')) return;
  e.preventDefault();
  const dy = e.deltaMode === 1 ? e.deltaY * 36 : e.deltaMode === 2 ? e.deltaY * 800 : e.deltaY;
  userDrive(clamp(dy, -240, 240) * 26);
}, { passive: false });
let drag = null;
cv.addEventListener('pointerdown', e => { drag = { y: e.clientY, x: e.clientX, id: e.pointerId }; cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id) return;
  const dy = drag.y - e.clientY, dx = e.clientX - drag.x; drag.y = e.clientY; drag.x = e.clientX;
  userDrive(dy * 150); steerT = clamp(steerT + dx * 0.01, -1, 1);
});
const endDrag = e => { if (drag && e.pointerId === drag.id) drag = null; };
cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
const KEYS = { ArrowUp: 1, KeyW: 1, ArrowDown: -1, KeyS: -1 };
window.addEventListener('keydown', e => {
  if (mode === 'attract' && (e.code === 'Enter' || e.code === 'Space')) { e.preventDefault(); start(); return; }
  if (mode !== 'play') return;
  if (e.code === 'Escape') { $('#map').classList.add('closed'); return; }
  if (e.target.closest && e.target.closest('#card') && (e.code === 'ArrowUp' || e.code === 'ArrowDown')) return;
  if (KEYS[e.code]) { keyHold = KEYS[e.code]; e.preventDefault(); hideHint(); closeCardIfLeaving(); }
  else if (e.code === 'KeyA') steerT = -1; else if (e.code === 'KeyD') steerT = 1;
  else if (e.code === 'ArrowRight' || e.code === 'KeyE') { driveTo(nextStopIndex(true), 1); e.preventDefault(); }
  else if (e.code === 'ArrowLeft' || e.code === 'KeyQ') { driveTo(prevStopIndex(), -1); e.preventDefault(); }
  else if (e.code === 'KeyM') openMap();
});
window.addEventListener('keyup', e => { if (KEYS[e.code] && keyHold === KEYS[e.code]) keyHold = 0; });
function closeCardIfLeaving() { }
let hintGone = false; function hideHint() { if (!hintGone) { hintGone = true; $('#hint').classList.add('gone'); } }

// buttons
$('#next').onclick = () => driveTo(nextStopIndex(true), 1);
$('#prev').onclick = () => driveTo(prevStopIndex(), -1);
$('#card-next').onclick = () => driveTo((cardStop + 1) % STOPS.length, 1);
$('#card-prev').onclick = () => driveTo((cardStop - 1 + STOPS.length) % STOPS.length, -1);
const stopsNav = $('#stops'), mapList = $('#map-list');
STOPS.forEach((s, i) => {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'sdot'; b.style.setProperty('--c', s.c); b.setAttribute('aria-label', s.label + ': ' + s.name);
  b.innerHTML = `<i>${s.short}</i>`; b.onclick = () => goStop(i); stopsNav.appendChild(b);
  const m = document.createElement('button'); m.type = 'button'; m.style.setProperty('--c', s.c);
  m.innerHTML = `<i>${s.short}</i><div><b>${s.name}</b><span>${s.label}</span></div>`; m.onclick = () => { $('#map').classList.add('closed'); goStop(i); }; mapList.appendChild(m);
});
function goStop(i) { if (cardStop === i) return; const d = wrapD(STOPS[i].pos - pos); driveTo(i, d >= 0 ? 1 : -1); }
function openMap() { $('#map').classList.remove('closed'); }
$('#radar').onclick = openMap; $('#map-x').onclick = () => $('#map').classList.add('closed');
$('#map').addEventListener('click', e => { if (e.target.id === 'map') $('#map').classList.add('closed'); });

function start() {
  if (mode === 'play') return;
  mode = 'play'; hfTarget = 0.5;
  $('#intro').classList.add('gone'); $('#hud').classList.remove('hidden');
  mission('TAKING THE WHEEL', 'Mission: explore KAISH City');
  driveTo(nextStopIndex(true), 1);
}
$('#start').onclick = start;

/* ---------------- loop ---------------- */
let last = performance.now(), manual = false, kmhShown = -1;
function frame(dt) {
  update(dt); render(); drawRadar();
  const k = Math.round(Math.abs(vel) / VMAX * 220); if (k !== kmhShown) { kmhShown = k; $('#kmh').textContent = k; }
}
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!manual) frame(dt);
  requestAnimationFrame(loop);
}
window.addEventListener('resize', () => { resize(); });
resize(); buildArt(); place(); buildMap();
pos = 0; target = 0;
requestAnimationFrame(loop);
const fontsReady = (document.fonts && document.fonts.load) ? Promise.all([document.fonts.load(`40px ${FONT_T}`), document.fonts.load(`40px ${FONT_S}`), document.fonts.load(`700 20px ${FONT_H}`)]) : Promise.resolve();
fontsReady.then(() => { buildText(); place(); art.car = mk(520, 240); drawCarBack(art.car, ['#2a2140', '#110c1c', '#050308'], true); }).catch(() => {});
// QA hooks
window.__city = { step(n, dt) { manual = true; for (let i = 0; i < n; i++) frame(dt); }, start, goStop, state: () => ({ pos, vel, target, cardStop, autoTo, mode }), resume() { manual = false; last = performance.now(); } };
})();
