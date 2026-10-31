(() => {
'use strict';
const cv = document.getElementById('crawl');
const ctx = cv.getContext('2d');
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const rnd = (a, b) => a + Math.random() * (b - a);
const wrapA = a => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
const hyp = Math.hypot;

let W = 0, H = 0, DPR = 1, S = 1, SY = 0, now = 0, frame = 0;

/* ---------- words ---------- */
const root = document.querySelector('main.page');
(function wrap() {
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      if (!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      if (n.parentNode.closest('svg,script,style')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const list = [];
  while (tw.nextNode()) list.push(tw.currentNode);
  for (const n of list) {
    const f = document.createDocumentFragment();
    for (const p of n.nodeValue.split(/(\s+)/)) {
      if (!p) continue;
      if (/^\s+$/.test(p)) f.appendChild(document.createTextNode(p));
      else { const s = document.createElement('span'); s.className = 'w'; s.textContent = p; f.appendChild(s); }
    }
    n.parentNode.replaceChild(f, n);
  }
})();
const spans = Array.from(root.querySelectorAll('.w'));
let words = [];
const grid = new Map();
const CELL = 64;
const active = new Set();

function releaseAll() {
  for (const w of active) clearWord(w);
  active.clear();
}
function clearWord(w) {
  const el = w.el;
  el.style.transform = '';
  el.classList.remove('mv', 'hy', 'hg', 'hr', 'hb', 'hv', 'dim');
  w.st = null;
}
function measure() {
  releaseAll();
  words = []; grid.clear();
  const sx = scrollX, sy = scrollY;
  let i = 0;
  for (const el of spans) {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const w = { el, i: i++, x: r.left + sx, y: r.top + sy, w: r.width, h: r.height, st: null, mark: 0 };
    words.push(w);
    const c0 = Math.floor(w.x / CELL), c1 = Math.floor((w.x + w.w) / CELL);
    const r0 = Math.floor(w.y / CELL), r1 = Math.floor((w.y + w.h) / CELL);
    for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) {
      const k = cy * 4096 + cx; let b = grid.get(k); if (!b) grid.set(k, b = []); b.push(w);
    }
  }
}
let qid = 0;
function query(x, y, r, fn) {
  qid++;
  const c0 = Math.floor((x - r) / CELL), c1 = Math.floor((x + r) / CELL);
  const r0 = Math.floor((y - r) / CELL), r1 = Math.floor((y + r) / CELL);
  for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) {
    const b = grid.get(cy * 4096 + cx); if (!b) continue;
    for (const w of b) {
      if (w.mark === qid) continue; w.mark = qid;
      if (x + r > w.x && x - r < w.x + w.w && y + r > w.y && y - r < w.y + w.h) fn(w);
    }
  }
}
// kind: 'c' centipede, 's' spider, 'm' moth
function hit(w, kind, fx, fy, power) {
  let s = w.st;
  if (!s) {
    s = w.st = { ox: 0, oy: 0, vx: 0, vy: 0, a: 0, va: 0, hold: 0, hl: 0, dim: 0, cool: 0, cls: '', max: 10, dimmed: false };
    active.add(w); w.el.classList.add('mv');
  }
  let cls;
  if (kind === 'c') cls = (w.i % 3 === 0) ? 'hg' : 'hy';
  else if (kind === 's') cls = 'hr';
  else cls = (w.i % 2) ? 'hb' : 'hv';
  if (s.cls !== cls) { if (s.cls) w.el.classList.remove(s.cls); w.el.classList.add(cls); s.cls = cls; }
  if (s.dimmed) { w.el.classList.remove('dim'); s.dimmed = false; }
  if (kind === 'c') { s.hl = Math.max(s.hl, 0.9); s.dim = 1.1; s.hold = Math.max(s.hold, 0.35); s.max = 9; }
  else if (kind === 's') { s.hl = Math.max(s.hl, 1.3); s.dim = 0.5; s.hold = Math.max(s.hold, 0.3); s.max = 12; }
  else { s.hl = Math.max(s.hl, 1.5); s.dim = 0.4; s.hold = Math.max(s.hold, 0.6); s.max = 70 * S; }
  if (s.cool > 0) return;
  s.cool = kind === 'm' ? 1.0 : 0.25;
  s.vx += fx * power; s.vy += fy * power;
  s.va += (kind === 'm' ? rnd(-5, 5) : rnd(-1.2, 1.2));
}
function pushFrom(kind, x, y, r, power) {
  query(x, y, r, w => {
    let dx = w.x + w.w / 2 - x, dy = w.y + w.h / 2 - y; const d = hyp(dx, dy) || 1;
    hit(w, kind, dx / d, dy / d, power);
  });
}
function updateWords(dt) {
  const k = 38, c = 9;
  for (const w of active) {
    const s = w.st;
    s.hl -= dt; s.hold -= dt; s.cool -= dt;
    if (s.hold > 0) {
      const f = Math.exp(-3.2 * dt); s.vx *= f; s.vy *= f; s.va *= f;
    } else {
      s.vx += (-k * s.ox - c * s.vx) * dt; s.vy += (-k * s.oy - c * s.vy) * dt;
      s.va += (-k * s.a - c * s.va) * dt;
    }
    s.ox += s.vx * dt; s.oy += s.vy * dt; s.a += s.va * dt;
    const m = hyp(s.ox, s.oy);
    if (m > s.max) { s.ox *= s.max / m; s.oy *= s.max / m; s.vx *= 0.5; s.vy *= 0.5; }
    s.a = clamp(s.a, -0.7, 0.7);
    // keep inside the screen horizontally
    const px = w.x + s.ox;
    if (px < 2) s.ox = 2 - w.x; else if (px + w.w > W - 2) s.ox = W - 2 - w.w - w.x;
    if (s.hl <= 0 && s.cls) {
      w.el.classList.remove(s.cls); s.cls = '';
      if (s.dim > 0) { w.el.classList.add('dim'); s.dimmed = true; }
    }
    if (s.hl <= 0 && s.dimmed) { s.dim -= dt; if (s.dim <= 0) { w.el.classList.remove('dim'); s.dimmed = false; } }
    const still = Math.abs(s.ox) + Math.abs(s.oy) < 0.25 && Math.abs(s.a) < 0.004 && Math.abs(s.vx) + Math.abs(s.vy) < 1;
    if (s.hold <= 0 && s.hl <= 0 && !s.dimmed && still) { clearWord(w); active.delete(w); continue; }
    w.el.style.transform = 'translate(' + s.ox.toFixed(1) + 'px,' + s.oy.toFixed(1) + 'px) rotate(' + s.a.toFixed(3) + 'rad)';
  }
}

/* ---------- input ---------- */
const ptr = { x: 0, y: 0, t: -99, touch: false, down: false };
addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { ptr.x = e.clientX; ptr.y = e.clientY; ptr.t = now; ptr.touch = false; } }, { passive: true });
const onTouch = e => { const t = e.touches[0]; if (!t) return; ptr.x = t.clientX; ptr.y = t.clientY; ptr.t = now; ptr.touch = true; ptr.down = true; };
addEventListener('touchstart', onTouch, { passive: true });
addEventListener('touchmove', onTouch, { passive: true });
addEventListener('touchend', () => { ptr.down = false; ptr.t = now; }, { passive: true });
document.addEventListener('mouseleave', () => { ptr.t = -99; });
const following = () => (now - ptr.t) < (ptr.touch ? 3.5 : 7);
const pPage = () => ({ x: ptr.x, y: ptr.y + SY });

/* ---------- helpers ---------- */
function ik(ax, ay, fx, fy, l1, l2, cx, cy) {
  // two-bone IK; knee picked on the side away from (cx,cy)
  let dx = fx - ax, dy = fy - ay; let d = hyp(dx, dy);
  const dm = Math.min(d, l1 + l2 - 0.01);
  const base = Math.atan2(dy, dx);
  const cosA = clamp((l1 * l1 + dm * dm - l2 * l2) / (2 * l1 * Math.max(dm, 0.01)), -1, 1);
  const A = Math.acos(cosA);
  const k1x = ax + Math.cos(base + A) * l1, k1y = ay + Math.sin(base + A) * l1;
  const k2x = ax + Math.cos(base - A) * l1, k2y = ay + Math.sin(base - A) * l1;
  const fx2 = ax + dx / (d || 1) * dm, fy2 = ay + dy / (d || 1) * dm;
  return hyp(k1x - cx, k1y - cy) > hyp(k2x - cx, k2y - cy) ? [k1x, k1y, fx2, fy2] : [k2x, k2y, fx2, fy2];
}
function wanderPoint() {
  return { x: rnd(W * 0.12, W * 0.88), y: SY + rnd(H * 0.18, H * 0.82) };
}
function steer(c, tx, ty, dt, maxSp, turn, arrive) {
  const dx = tx - c.x, dy = ty - c.y, d = hyp(dx, dy);
  const want = Math.atan2(dy, dx);
  const da = wrapA(want - c.ang);
  c.ang = wrapA(c.ang + clamp(da, -turn * dt, turn * dt));
  let sp = maxSp * Math.min(1, d / arrive) * (0.35 + 0.65 * Math.max(0, Math.cos(da)));
  c.v += (sp - c.v) * Math.min(1, dt * 4);
  c.x += Math.cos(c.ang) * c.v * dt; c.y += Math.sin(c.ang) * c.v * dt;
  return d;
}
function keepNear(c, reset) {
  const cy = SY + H / 2;
  if (Math.abs(c.y - cy) > H * 1.2 || c.x < -W * 0.6 || c.x > W * 1.6) {
    c.y = c.y < cy ? SY - 60 * S : SY + H + 60 * S;
    c.x = clamp(c.x, W * 0.1, W * 0.9);
    c.ang = c.y < cy ? Math.PI / 2 : -Math.PI / 2;
    reset();
  }
}
const prints = [];
function footprint(x, y, a, size, col) {
  prints.push({ x, y, a, size, col, t: 0 });
  if (prints.length > 90) prints.shift();
}

/* ---------- centipede ---------- */
const cent = {
  on: true, x: 0, y: 0, ang: 0, v: 0, segs: [], legs: [], target: null, tt: 0, orbit: 0, n: 22,
  init() {
    this.x = -40 * S; this.y = SY + H * 0.42; this.ang = 0.15; this.v = 0;
    this.target = { x: W * 0.55, y: SY + H * 0.5 }; this.tt = 3;
    this.reset();
  },
  sp() { return 13 * S; },
  wid(i) { return (i === 0 ? 8 : 6 + 2.6 * Math.sin(Math.PI * Math.min(1, (i + 3) / (this.n + 2)))) * S; },
  reset() {
    this.segs = [];
    for (let i = 0; i < this.n; i++) this.segs.push({ x: this.x - Math.cos(this.ang) * i * this.sp(), y: this.y - Math.sin(this.ang) * i * this.sp(), a: this.ang });
    this.legs = [];
    for (let i = 1; i < this.n - 1; i++) for (const side of [-1, 1]) {
      const r = this.rest(i, side);
      this.legs.push({ i, side, fx: r.x, fy: r.y, sx: 0, sy: 0, tx: 0, ty: 0, t: -1 });
    }
  },
  rest(i, side) {
    const s = this.segs[i], a = s.a, w = this.wid(i);
    const px = -Math.sin(a) * side, py = Math.cos(a) * side;
    const reach = w + 17 * S, fwd = 4 * S;
    return { x: s.x + px * reach + Math.cos(a) * fwd, y: s.y + py * reach + Math.sin(a) * fwd, hx: s.x + px * w * 0.8, hy: s.y + py * w * 0.8 };
  },
  update(dt) {
    keepNear(this, () => this.reset());
    let tx, ty;
    if (following()) {
      const p = pPage();
      const d = hyp(p.x - this.x, p.y - this.y);
      if (d < 70 * S) { this.orbit += dt * 1.6; tx = p.x + Math.cos(this.orbit) * 80 * S; ty = p.y + Math.sin(this.orbit) * 80 * S; }
      else { tx = p.x; ty = p.y; this.orbit = Math.atan2(this.y - p.y, this.x - p.x); }
    } else {
      this.tt -= dt;
      if (!this.target || this.tt <= 0 || hyp(this.target.x - this.x, this.target.y - this.y) < 40 * S || Math.abs(this.target.y - (SY + H / 2)) > H * 0.6) {
        this.target = wanderPoint(); this.tt = rnd(3, 6);
      }
      tx = this.target.x + Math.sin(now * 1.3) * 30 * S; ty = this.target.y + Math.cos(now * 1.1) * 30 * S;
    }
    steer(this, tx, ty, dt, (following() ? 230 : 150) * S, 3.6, 90 * S);
    const sg = this.segs, sp = this.sp();
    sg[0].x = this.x; sg[0].y = this.y; sg[0].a = this.ang;
    for (let i = 1; i < sg.length; i++) {
      const p = sg[i - 1], s = sg[i];
      let dx = s.x - p.x, dy = s.y - p.y; const d = hyp(dx, dy) || 1;
      s.x = p.x + dx / d * sp; s.y = p.y + dy / d * sp;
      s.a = Math.atan2(p.y - s.y, p.x - s.x);
    }
    // legs: metachronal wave
    const stepD = 11 * S, dur = clamp(0.16 - this.v / (S * 2600), 0.06, 0.16);
    const L = this.legs;
    for (let j = 0; j < L.length; j++) {
      const g = L[j];
      if (g.t >= 0) {
        g.t += dt / dur;
        if (g.t >= 1) {
          g.t = -1; g.fx = g.tx; g.fy = g.ty;
          if ((g.i & 1) === 0) pushFrom('c', g.fx, g.fy, 4 * S, 40);
        } else {
          const e = g.t * g.t * (3 - 2 * g.t);
          g.fx = g.sx + (g.tx - g.sx) * e; g.fy = g.sy + (g.ty - g.sy) * e;
        }
        continue;
      }
      const r = this.rest(g.i, g.side);
      const far = hyp(r.x - g.fx, r.y - g.fy);
      if (far > stepD) {
        const prev = j >= 2 ? L[j - 2] : null, opp = L[j ^ 1];
        if (far < stepD * 2.4 && ((prev && prev.t >= 0 && prev.t < 0.5) || opp.t >= 0)) continue;
        const a = this.segs[g.i].a;
        g.sx = g.fx; g.sy = g.fy; g.t = 0;
        g.tx = r.x + Math.cos(a) * stepD * 0.6; g.ty = r.y + Math.sin(a) * stepD * 0.6;
      }
    }
    pushFrom('c', this.x + Math.cos(this.ang) * 6 * S, this.y + Math.sin(this.ang) * 6 * S, 10 * S, 70);
    for (let i = 3; i < sg.length; i += 3) pushFrom('c', sg[i].x, sg[i].y, this.wid(i) * 0.9, 30);
    if (frame % 9 === 0) { const s = sg[(frame / 9 | 0) % sg.length]; footprint(s.x, s.y, s.a, this.wid(0) * 3.2, '200,200,190'); }
  },
  draw() {
    const sg = this.segs;
    // spine
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(216,232,90,.45)';
    ctx.beginPath(); ctx.moveTo(sg[0].x, sg[0].y); for (let i = 1; i < sg.length; i++) ctx.lineTo(sg[i].x, sg[i].y); ctx.stroke();
    // legs
    ctx.lineWidth = 1.25 * Math.max(S, .8); ctx.strokeStyle = 'rgba(222,236,120,.95)'; ctx.fillStyle = '#eef6a0';
    const l1 = 12 * S, l2 = 15 * S;
    ctx.beginPath();
    const dots = [];
    for (const g of this.legs) {
      const r = this.rest(g.i, g.side), s = sg[g.i];
      let fx = g.fx, fy = g.fy;
      const [kx, ky, ex, ey] = ik(r.hx, r.hy, fx, fy, l1, l2, s.x - Math.cos(s.a) * 30, s.y - Math.sin(s.a) * 30);
      fx = ex; fy = ey;
      ctx.moveTo(r.hx, r.hy); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy);
      dots.push(kx, ky, fx, fy);
    }
    ctx.stroke();
    for (let i = 0; i < dots.length; i += 2) ctx.fillRect(dots[i] - 1.3, dots[i + 1] - 1.3, 2.6, 2.6);
    // segments
    for (let i = sg.length - 1; i >= 0; i--) {
      const s = sg[i], w = this.wid(i), len = this.sp() * (i === 0 ? 1.25 : 0.82);
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.a);
      if (i === 0) {
        ctx.fillStyle = '#d8e85a'; ctx.fillRect(-len / 2, -w, len, w * 2);
        ctx.strokeStyle = '#d8e85a'; ctx.lineWidth = 1.2;
        ctx.beginPath();
        const wig = Math.sin(now * 9) * 0.15;
        for (const sd of [-1, 1]) {
          ctx.moveTo(len / 2, sd * w * 0.6);
          ctx.quadraticCurveTo(len / 2 + 16 * S, sd * (w + 8 * S + wig * 20 * S), len / 2 + 30 * S, sd * (w + 16 * S - wig * 30 * S));
          ctx.moveTo(len / 2 - 2 * S, sd * w); ctx.lineTo(len / 2 + 6 * S, sd * (w + 3 * S)); ctx.lineTo(len / 2 + 9 * S, sd * w * 0.3);
        }
        ctx.stroke();
      } else {
        const green = i % 3 === 0;
        ctx.fillStyle = green ? 'rgba(143,211,90,.85)' : 'rgba(216,232,90,.22)';
        ctx.fillRect(-len / 2, -w, len, w * 2);
        ctx.strokeStyle = green ? '#8fd35a' : '#d8e85a'; ctx.lineWidth = 1;
        ctx.strokeRect(-len / 2, -w, len, w * 2);
      }
      ctx.restore();
    }
    // tail cerci
    const t = sg[sg.length - 1], a = t.a + Math.PI;
    ctx.strokeStyle = '#d8e85a'; ctx.beginPath();
    for (const sd of [-0.35, 0.35]) { ctx.moveTo(t.x, t.y); ctx.lineTo(t.x + Math.cos(a + sd) * 24 * S, t.y + Math.sin(a + sd) * 24 * S); }
    ctx.stroke();
  }
};

/* ---------- spider ---------- */
const spider = {
  on: true, x: 0, y: 0, ang: 0, v: 0, legs: [], target: null, tt: 0, move: true, mt: 0,
  cfg: [[38, 58, 78], [78, 98, 70], [104, 128, 66], [140, 160, 74]],
  init() { this.x = W * 0.78; this.y = SY + H * 0.28; this.ang = Math.PI * 0.8; this.v = 0; this.target = null; this.reset(); },
  reset() {
    this.legs = [];
    let k = 0;
    for (let i = 0; i < 4; i++) for (const side of [-1, 1]) {
      const r = this.rest(i, side);
      // gait groups: alternating tetrapod
      const grp = ((i + (side > 0 ? 1 : 0)) & 1);
      this.legs.push({ i, side, grp, fx: r.x, fy: r.y, sx: 0, sy: 0, tx: 0, ty: 0, t: -1 });
      k++;
    }
  },
  rest(i, side) {
    const c = this.cfg[i], a = this.ang;
    const ha = a + side * c[0] * Math.PI / 180, fa = a + side * c[1] * Math.PI / 180;
    const R = c[2] * S, hr = 7 * S;
    return { x: this.x + Math.cos(fa) * R, y: this.y + Math.sin(fa) * R, hx: this.x + Math.cos(ha) * hr, hy: this.y + Math.sin(ha) * hr };
  },
  update(dt) {
    keepNear(this, () => this.reset());
    this.mt -= dt;
    let tx, ty, max = 260 * S, arrive = 60 * S;
    if (following()) {
      const p = pPage();
      const off = 130 * S;
      const a = Math.atan2(this.y - p.y, this.x - p.x);
      tx = p.x + Math.cos(a) * off; ty = p.y + Math.sin(a) * off;
      if (this.mt <= 0) { this.move = !this.move || hyp(p.x - this.x, p.y - this.y) > 200 * S; this.mt = this.move ? rnd(0.5, 1.2) : rnd(0.15, 0.4); }
    } else {
      if (!this.target || hyp(this.target.x - this.x, this.target.y - this.y) < 30 * S || Math.abs(this.target.y - (SY + H / 2)) > H * 0.6) this.target = wanderPoint();
      tx = this.target.x; ty = this.target.y; max = 190 * S;
      if (this.mt <= 0) { this.move = !this.move; this.mt = this.move ? rnd(0.6, 1.6) : rnd(0.25, 0.8); }
    }
    if (this.move) steer(this, tx, ty, dt, max, 5, arrive);
    else { this.v *= Math.exp(-10 * dt); this.x += Math.cos(this.ang) * this.v * dt; this.y += Math.sin(this.ang) * this.v * dt; }
    const stepD = 24 * S, dur = 0.11;
    let busy = [false, false];
    for (const g of this.legs) if (g.t >= 0) busy[g.grp] = true;
    for (const g of this.legs) {
      if (g.t >= 0) {
        g.t += dt / dur;
        if (g.t >= 1) { g.t = -1; g.fx = g.tx; g.fy = g.ty; pushFrom('s', g.fx, g.fy, 6 * S, 60); footprint(g.fx, g.fy, this.ang, 9 * S, '255,106,85'); }
        else { const e = g.t * g.t * (3 - 2 * g.t); g.fx = g.sx + (g.tx - g.sx) * e; g.fy = g.sy + (g.ty - g.sy) * e; }
        continue;
      }
      const r = this.rest(g.i, g.side);
      const far = hyp(r.x - g.fx, r.y - g.fy);
      if ((far > stepD && !busy[1 - g.grp]) || far > stepD * 2.4) {
        busy[g.grp] = true;
        g.sx = g.fx; g.sy = g.fy; g.t = 0;
        const lead = Math.min(1, this.v / (120 * S)) * stepD * 0.7;
        g.tx = r.x + Math.cos(this.ang) * lead; g.ty = r.y + Math.sin(this.ang) * lead;
      }
    }
    pushFrom('s', this.x, this.y, 16 * S, 90);
  },
  draw() {
    const l1 = 44 * S, l2 = 46 * S;
    ctx.lineWidth = 1.3 * Math.max(S, .8); ctx.strokeStyle = 'rgba(255,106,85,.95)';
    ctx.beginPath();
    const knees = [];
    for (const g of this.legs) {
      const r = this.rest(g.i, g.side);
      const [kx, ky, ex, ey] = ik(r.hx, r.hy, g.fx, g.fy, l1, l2, this.x, this.y);
      ctx.moveTo(r.hx, r.hy); ctx.lineTo(kx, ky); ctx.lineTo(ex, ey);
      knees.push(kx, ky, ex, ey);
    }
    ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
    for (let i = 0; i < knees.length; i += 4) {
      ctx.strokeRect(knees[i] - 3, knees[i + 1] - 3, 6, 6);
      ctx.fillRect(knees[i + 2] - 1.5, knees[i + 3] - 1.5, 3, 3);
    }
    // threads to disturbed words
    ctx.strokeStyle = 'rgba(255,106,85,.35)'; ctx.setLineDash([3, 4]); ctx.beginPath();
    let n = 0;
    for (const w of active) {
      if (n > 5) break;
      if (w.st && w.st.cls === 'hr') {
        const cx = w.x + w.w / 2 + w.st.ox, cy = w.y + w.h / 2 + w.st.oy;
        if (hyp(cx - this.x, cy - this.y) < 150 * S) { ctx.moveTo(this.x, this.y); ctx.lineTo(cx, cy); n++; }
      }
    }
    ctx.stroke(); ctx.setLineDash([]);
    // body
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.ang);
    ctx.fillStyle = '#1a0b09'; ctx.strokeStyle = '#ff6a55'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(-17 * S, 0, 17 * S, 12 * S, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,106,85,.85)';
    ctx.beginPath(); ctx.ellipse(-19 * S, 0, 6 * S, 4 * S, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff6a55';
    ctx.beginPath(); ctx.ellipse(4 * S, 0, 9 * S, 7.5 * S, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff';
    for (const [ex, ey] of [[10, -3], [10, 3], [8, -6], [8, 6]]) ctx.fillRect(ex * S - 1.2, ey * S - 1.2, 2.4, 2.4);
    ctx.strokeStyle = '#ff6a55'; ctx.lineWidth = 1.2; ctx.beginPath();
    for (const sd of [-1, 1]) { ctx.moveTo(12 * S, sd * 3 * S); ctx.lineTo(19 * S, sd * 6 * S); ctx.lineTo(22 * S, sd * 2 * S); }
    ctx.stroke();
    ctx.restore();
  }
};

/* ---------- moth ---------- */
const moth = {
  on: true, x: 0, y: 0, vx: 0, vy: 0, ang: 0, orbit: 0, target: null, tt: 0, trails: [],
  init() {
    this.x = W * 0.3; this.y = SY + H * 0.68; this.vx = 40; this.vy = -20;
    this.trails = [];
    for (let k = 0; k < 7; k++) { const pts = []; for (let i = 0; i < 16; i++) pts.push({ x: this.x, y: this.y }); this.trails.push(pts); }
  },
  update(dt) {
    keepNear(this, () => this.init());
    let tx, ty;
    if (following()) {
      const p = pPage();
      this.orbit += dt * 1.8;
      const r = 110 * S + Math.sin(now * 2.3) * 25 * S;
      tx = p.x + Math.cos(this.orbit) * r; ty = p.y + Math.sin(this.orbit) * r * 0.8;
    } else {
      this.tt -= dt;
      if (!this.target || this.tt <= 0 || Math.abs(this.target.y - (SY + H / 2)) > H * 0.6) { this.target = wanderPoint(); this.tt = rnd(1.6, 3.2); }
      tx = this.target.x; ty = this.target.y;
    }
    // fluttery spring flight
    const k = following() ? 9 : 4, c = following() ? 4.2 : 2.6;
    this.vx += ((tx - this.x) * k - this.vx * c + Math.sin(now * 13.1) * 260 * S) * dt;
    this.vy += ((ty - this.y) * k - this.vy * c + Math.cos(now * 11.7) * 260 * S) * dt;
    const sp = hyp(this.vx, this.vy), mx = 520 * S;
    if (sp > mx) { this.vx *= mx / sp; this.vy *= mx / sp; }
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.x = clamp(this.x, 10, W - 10);
    if (sp > 20) this.ang += wrapA(Math.atan2(this.vy, this.vx) - this.ang) * Math.min(1, dt * 6);
    // trails
    const back = this.ang + Math.PI;
    for (let t = 0; t < this.trails.length; t++) {
      const pts = this.trails[t];
      const spread = (t - 3) * 0.32;
      pts[0].x = this.x + Math.cos(back + spread) * 8 * S; pts[0].y = this.y + Math.sin(back + spread) * 8 * S;
      const seg = (5.5 + (t % 3)) * S;
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i - 1], q = pts[i];
        const wob = Math.sin(now * 5 + i * 0.6 + t * 1.7) * 2.2 * S;
        q.x += (Math.cos(back + spread) * 0.6 * S) + (-Math.sin(back) * wob) * 0.3;
        q.y += (Math.sin(back + spread) * 0.6 * S) + (Math.cos(back) * wob) * 0.3;
        let dx = q.x - p.x, dy = q.y - p.y; const d = hyp(dx, dy) || 1;
        q.x = p.x + dx / d * seg; q.y = p.y + dy / d * seg;
      }
    }
    let flung = 0; for (const w of active) if (w.st && (w.st.cls === 'hb' || w.st.cls === 'hv')) flung++;
    if (flung < 22) pushFrom('m', this.x, this.y, 20 * S, 300 * S + sp * 0.3);
  },
  draw() {
    const fl = Math.abs(Math.sin(now * 22));
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    // glow
    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 70 * S);
    g.addColorStop(0, 'rgba(120,150,255,.45)'); g.addColorStop(0.4, 'rgba(120,90,255,.14)'); g.addColorStop(1, 'rgba(80,60,255,0)');
    ctx.fillStyle = g; ctx.fillRect(this.x - 70 * S, this.y - 70 * S, 140 * S, 140 * S);
    // dotted trails
    for (let t = 0; t < this.trails.length; t++) {
      const pts = this.trails[t];
      ctx.fillStyle = t % 2 ? 'rgba(180,140,255,1)' : 'rgba(122,170,255,1)';
      for (let i = 1; i < pts.length; i++) {
        const r = (2.2 - i * 0.11) * Math.max(S, .75);
        ctx.globalAlpha = 1 - i / pts.length;
        ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y, Math.max(r, 0.6), 0, TAU); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.ang);
    // wings
    ctx.strokeStyle = 'rgba(170,190,255,.9)'; ctx.fillStyle = 'rgba(110,130,255,.18)'; ctx.lineWidth = 1;
    for (const sd of [-1, 1]) {
      ctx.save(); ctx.scale(1, sd * (0.25 + 0.75 * fl));
      ctx.beginPath(); ctx.moveTo(4 * S, 0); ctx.quadraticCurveTo(10 * S, 26 * S, -6 * S, 30 * S); ctx.quadraticCurveTo(-14 * S, 14 * S, -2 * S, 0); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-2 * S, 0); ctx.quadraticCurveTo(-8 * S, 20 * S, -20 * S, 18 * S); ctx.quadraticCurveTo(-20 * S, 6 * S, -8 * S, 0); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    // body: schematic box
    ctx.fillStyle = '#dfe8ff'; ctx.fillRect(-11 * S, -3 * S, 18 * S, 6 * S);
    ctx.strokeStyle = '#8fb0ff'; ctx.strokeRect(-14 * S, -6 * S, 24 * S, 12 * S);
    ctx.beginPath();
    for (const sd of [-1, 1]) { ctx.moveTo(7 * S, sd * 2 * S); ctx.quadraticCurveTo(16 * S, sd * 4 * S, 20 * S, sd * 12 * S); }
    ctx.stroke();
    ctx.restore();
  }
};

const creatures = { centipede: cent, spider, moth };

/* ---------- loop ---------- */
function resize() {
  W = document.documentElement.clientWidth; H = innerHeight;
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  cv.style.width = W + 'px'; cv.style.height = H + 'px';
  S = W < 600 ? 0.64 : clamp(W / 1150, 0.78, 1);
}
let mT = 0;
function measureSoon() { clearTimeout(mT); mT = setTimeout(measure, 180); }
let lastW = 0;
addEventListener('resize', () => { resize(); if (W !== lastW) { lastW = W; measureSoon(); } });
resize(); lastW = W; SY = scrollY;
measure();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureSoon);
addEventListener('load', measureSoon);
cent.init(); spider.init(); moth.init();

document.querySelectorAll('.chip[data-c]').forEach(b => b.addEventListener('click', () => {
  const c = creatures[b.dataset.c]; c.on = !c.on;
  b.classList.toggle('on', c.on); b.setAttribute('aria-pressed', c.on);
  if (c.on) { c.init ? c.init() : 0; }
}));
document.getElementById('tidy').addEventListener('click', () => {
  for (const w of active) { const s = w.st; s.hold = 0; s.hl = 0; s.dim = 0; s.cool = 2; }
});

let last = performance.now();
function tick(t) {
  const dt = Math.min(0.05, (t - last) / 1000); last = t; now += dt; frame++;
  SY = scrollY;
  if (cent.on) cent.update(dt);
  if (spider.on) spider.update(dt);
  if (moth.on) moth.update(dt);
  updateWords(dt);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.translate(0, -SY);
  // footprints
  ctx.lineWidth = 1;
  for (let i = prints.length - 1; i >= 0; i--) {
    const p = prints[i]; p.t += dt;
    if (p.t > 0.9) { prints.splice(i, 1); continue; }
    ctx.strokeStyle = 'rgba(' + p.col + ',' + (0.28 * (1 - p.t / 0.9)).toFixed(3) + ')';
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a + Math.PI / 4);
    const z = p.size * (1 + p.t * 0.6); ctx.strokeRect(-z / 2, -z / 2, z, z); ctx.restore();
  }
  if (cent.on) cent.draw();
  if (spider.on) spider.draw();
  if (moth.on) moth.draw();
  // pointer ring
  const age = now - ptr.t;
  if (age < (ptr.touch ? (ptr.down ? 99 : 0.6) : 7)) {
    const p = pPage(), a = ptr.touch && !ptr.down ? 1 - age / 0.6 : 1;
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.55 * a).toFixed(2) + ')'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(p.x, p.y, 20, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,' + (0.8 * a).toFixed(2) + ')';
    ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, TAU); ctx.fill();
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
window.__crawl = { active, get words() { return words; }, cent, spider, moth };
})();
