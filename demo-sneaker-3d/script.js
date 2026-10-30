import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const qs = new URLSearchParams(location.search);
const SNAP = qs.get('snap');
const COLORS = {
  cobalt: { a: '#2f63ff', p: '#1b1d24', name: 'Cobalt', ui: '#2f63ff' },
  onyx:   { a: '#2b2b2e', p: '#0d0d0f', name: 'Onyx',   ui: '#16161a' },
  blush:  { a: '#ff8db1', p: '#f1ece8', name: 'Blush',  ui: '#ff4f8b' },
  volt:   { a: '#c8f53a', p: '#24272c', name: 'Volt',   ui: '#6aa300' }
};
let current = 'cobalt';
const isTouch = matchMedia('(hover: none)').matches;
const small = innerWidth < 820;

/* ---------- renderer ---------- */
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !small || devicePixelRatio < 2, powerPreference: 'high-performance', preserveDrawingBuffer: !!SNAP });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.5 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(3, 5, 6); scene.add(key);
const rim = new THREE.DirectionalLight(0xffe2c4, 1.0); rim.position.set(-5, 2, -4); scene.add(rim);
scene.add(new THREE.HemisphereLight(0xffffff, 0x553322, 0.5));

const FOV = 30, CAMZ = 10;
const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
camera.position.set(0, 0, CAMZ);

/* shoe rig: root (screen placement) > spin (drag + colour spin) > tilt > model */
const root = new THREE.Group(), spin = new THREE.Group(), tilt = new THREE.Group();
root.add(spin); spin.add(tilt); scene.add(root);
root.visible = false;

const uniforms = {
  uMask: { value: null },
  uAccent: { value: new THREE.Color(COLORS.cobalt.a) },
  uPanel: { value: new THREE.Color(COLORS.cobalt.p) }
};

function size() {
  const w = SNAP ? 800 : innerWidth, h = SNAP ? 560 : innerHeight;
  renderer.setSize(w, h, false);
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
size();
addEventListener('resize', () => { size(); ScrollTrigger && ScrollTrigger.refresh(); });

/* ---------- load ---------- */
const texLoader = new THREE.TextureLoader();
const maskTex = texLoader.load('assets/shoe-mask.webp');
maskTex.flipY = false; maskTex.colorSpace = THREE.NoColorSpace;
uniforms.uMask.value = maskTex;

let ready = false;
new GLTFLoader().load('assets/shoe.glb', (gltf) => {
  const model = gltf.scene;
  const box = new THREE.Box3().setFromObject(model);
  const sz = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const s = 1 / Math.max(sz.x, sz.y, sz.z);
  model.position.sub(c).multiplyScalar(s);
  model.scale.setScalar(s);
  const holder = new THREE.Group(); holder.add(model);
  // face the toe to the right, sole down
  holder.rotation.set(BASE.x, BASE.y, BASE.z);
  tilt.add(holder);
  model.traverse((o) => {
    if (o.isMesh) {
      const m = o.material;
      m.envMapIntensity = 1.0;
      m.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, uniforms);
        sh.fragmentShader = 'uniform sampler2D uMask;\nuniform vec3 uAccent;\nuniform vec3 uPanel;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
          vec3 mk = texture2D(uMask, vMapUv).rgb;
          float dt = mk.b * 2.0;
          diffuseColor.rgb = mix(diffuseColor.rgb, uAccent * dt, mk.r);
          diffuseColor.rgb = mix(diffuseColor.rgb, uPanel * dt, mk.g);`);
      };
      m.needsUpdate = true;
    }
  });
  root.visible = true; ready = true;
  document.body.classList.add('loaded');
  if (SNAP) setColour(SNAP, true);
}, undefined, (e) => { console.warn('model failed', e); document.getElementById('loader').textContent = '3D preview unavailable'; });

const BASE = { x: 0, y: 0, z: 0 };

/* ---------- colour ---------- */
const tmpA = new THREE.Color(), tmpP = new THREE.Color();
const spinState = { extra: 0, pop: 1 };
function setColour(name, instant) {
  const col = COLORS[name]; if (!col) return;
  current = name;
  tmpA.set(col.a); tmpP.set(col.p);
  if (instant || !window.gsap) {
    uniforms.uAccent.value.copy(tmpA); uniforms.uPanel.value.copy(tmpP);
  } else {
    const a0 = uniforms.uAccent.value.clone(), p0 = uniforms.uPanel.value.clone();
    const o = { t: 0 };
    gsap.to(spinState, { extra: spinState.extra + Math.PI * 2, duration: 1.0, ease: 'power3.inOut' });
    gsap.fromTo(spinState, { pop: 1 }, { pop: 0.86, duration: 0.5, yoyo: true, repeat: 1, ease: 'power2.inOut' });
    gsap.to(o, { t: 1, duration: 0.35, delay: 0.3, ease: 'none', onUpdate: () => {
      uniforms.uAccent.value.copy(a0).lerp(tmpA, o.t); uniforms.uPanel.value.copy(p0).lerp(tmpP, o.t);
    } });
  }
  if (SNAP) return;
  document.documentElement.style.setProperty('--acc', col.ui);
  document.getElementById('colourName').textContent = col.name;
  document.getElementById('box1Colour').textContent = col.name;
  document.getElementById('peek1').src = 'assets/shoe-' + name + '.webp';
  document.querySelectorAll('.sw').forEach((b) => {
    const on = b.dataset.c === name;
    b.classList.toggle('active', on); b.setAttribute('aria-checked', on);
    if (on) { b.classList.remove('spin'); void b.offsetWidth; b.classList.add('spin'); }
  });
}
document.querySelectorAll('.sw').forEach((b) => b.addEventListener('click', () => setColour(b.dataset.c)));

/* ---------- drag to rotate ---------- */
const drag = { on: false, x: 0, y: 0, vy: 0, rotY: -0.5, rotX: 0.12, idle: 0 };
const anchor = document.getElementById('shoeAnchor');
anchor.addEventListener('pointerdown', (e) => { drag.on = true; drag.x = e.clientX; drag.y = e.clientY; drag.vy = 0; anchor.setPointerCapture(e.pointerId); });
anchor.addEventListener('pointermove', (e) => {
  if (!drag.on) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
  drag.vy = dx * 0.012; drag.rotY += drag.vy;
  if (e.pointerType === 'mouse') drag.rotX = Math.max(-0.35, Math.min(0.55, drag.rotX + dy * 0.006));
  drag.idle = 0;
});
const end = () => { drag.on = false; };
anchor.addEventListener('pointerup', end); anchor.addEventListener('pointercancel', end); anchor.addEventListener('lostpointercapture', end);

/* ---------- screen placement ---------- */
function visSize() { const h = 2 * CAMZ * Math.tan(THREE.MathUtils.degToRad(FOV / 2)); return { h, w: h * camera.aspect }; }
function rectWorld(r, k) {
  const W = innerWidth, H = innerHeight, v = visSize();
  return { x: ((r.left + r.width / 2) / W - 0.5) * v.w, y: -((r.top + r.height / 2) / H - 0.5) * v.h, s: Math.min(r.width, r.height * 2.1) * (v.h / H) * k };
}
const box1 = document.getElementById('box1');
const front1 = box1.querySelector('.box-front');
let progress = 0, landed = false;
const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const lerp = (a, b, t) => a + (b - a) * t;

function place(t) {
  if (SNAP) { root.position.set(0, 0, 0); root.scale.setScalar(visSize().w * 0.8); return; }
  const a = rectWorld(anchor.getBoundingClientRect(), 0.98);
  const fr = front1.getBoundingClientRect();
  const v = visSize(), H = innerHeight;
  // land target: centre of the box opening, sinking below the front edge at the end
  const sink = t > 0.8 ? (t - 0.8) / 0.2 : 0;
  const ty = fr.top + fr.height * (-0.12 + 0.75 * ease(sink));
  const b = { x: ((fr.left + fr.width / 2) / innerWidth - 0.5) * v.w, y: -(ty / H - 0.5) * v.h, s: fr.width * 0.95 * (v.h / H) };
  const e = ease(Math.min(1, t / 0.75));
  root.position.x = lerp(a.x, b.x, e);
  root.position.y = lerp(a.y, b.y, e) + Math.sin(Math.PI * e) * 0.6 * (v.h / 5.36);
  root.position.z = Math.sin(Math.PI * e) * 0.8;
  root.scale.setScalar(lerp(a.s, b.s, e) * spinState.pop);
  // clip everything below the box opening so the shoe reads as dropping inside
  if (t > 0.5) { const cut = Math.max(0, H - fr.top - 2); canvas.style.clipPath = `inset(0 0 ${cut}px 0)`; }
  else canvas.style.clipPath = 'none';
}

/* ---------- scroll ---------- */
gsap.registerPlugin(ScrollTrigger);
let st = null;
if (!SNAP) {
  st = ScrollTrigger.create({
    trigger: '#boxes', start: 'top bottom', end: () => (innerWidth < 820 ? 'top 40%' : 'top 30%'),
    scrub: true,
    onUpdate: (self) => { progress = self.progress; }
  });
  gsap.from('.headline span, .headline em', { yPercent: 60, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.12 });
  gsap.from('.stage', { y: 40, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.15 });
  ['.cats-head', '.rev-head'].forEach((s) => gsap.from(s, { y: 40, opacity: 0, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: s, start: 'top 88%' } }));
  gsap.from('.cat', { y: 50, opacity: 0, duration: .8, stagger: .08, ease: 'power3.out', scrollTrigger: { trigger: '.cat-row', start: 'top 88%' } });
  gsap.from('.rev-row figure', { y: 40, opacity: 0, duration: .8, stagger: .08, ease: 'power3.out', scrollTrigger: { trigger: '.rev-row', start: 'top 90%' } });
}

/* ---------- loop ---------- */
const clock = new THREE.Clock();
let smoothP = 0;
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  if (!ready) return;
  smoothP += (progress - smoothP) * Math.min(1, dt * 10);
  if (Math.abs(progress - smoothP) < 0.0008) smoothP = progress;
  const p = SNAP ? 0 : smoothP;
  const isLanded = p >= 0.995;
  if (!SNAP && isLanded !== landed) {
    landed = isLanded;
    canvas.classList.toggle('off', landed);
    box1.classList.toggle('awaiting', !landed);
    box1.classList.toggle('landed', landed);
  }
  document.body.classList.toggle('flying', p > 0.02);
  if (landed) return;
  if (!SNAP) {
    // offscreen guard: hero scrolled away and flight not started
    const r = anchor.getBoundingClientRect();
    if (p === 0 && r.bottom < -50) { canvas.classList.add('off'); return; }
    canvas.classList.remove('off');
  }
  if (!drag.on) {
    drag.idle += dt;
    drag.rotY += drag.vy; drag.vy *= 0.94;
    if (drag.idle > 2.5 && p < 0.02 && !SNAP) drag.rotY += dt * 0.35;
  }
  const flyT = ease(Math.min(1, p / 0.75));
  const targetY = -Math.PI * 0.08; // near side profile while flying
  let ry = drag.rotY + spinState.extra;
  if (flyT > 0) { const base = Math.round((ry - targetY) / (Math.PI * 2)) * Math.PI * 2 + targetY; ry = lerp(ry, base, flyT); }
  spin.rotation.y = SNAP ? SNAP_ROT.y : ry;
  tilt.rotation.x = SNAP ? SNAP_ROT.x : lerp(drag.rotX, 0.35, flyT);
  tilt.rotation.z = SNAP ? 0 : lerp(0, -0.22, Math.sin(Math.PI * flyT));
  tilt.position.y = SNAP ? 0 : Math.sin(t * 1.6) * 0.035 * (1 - flyT);
  place(p);
  renderer.render(scene, camera);
  if (SNAP) window.__snapReady = (window.__snapReady || 0) + 1;
}
const SNAP_ROT = { y: -0.55, x: 0.18 };
if (SNAP) document.body.classList.add('snap');
frame();
document.addEventListener('visibilitychange', () => clock.getDelta());

/* ---------- boxes: hover on desktop, tap on phone ---------- */
document.querySelectorAll('.box').forEach((b) => b.addEventListener('click', () => {
  if (b.classList.contains('awaiting')) return;
  const was = b.classList.contains('open');
  document.querySelectorAll('.box.open').forEach((x) => x.classList.remove('open'));
  if (!was) b.classList.add('open');
}));

/* ---------- countdown to next Friday 8 PM ---------- */
function nextDrop() { const d = new Date(); const t = new Date(d); t.setHours(20, 0, 0, 0); let add = (5 - d.getDay() + 7) % 7; if (add === 0 && d > t) add = 7; t.setDate(t.getDate() + add); return t; }
let target = nextDrop();
const pad = (n) => String(n).padStart(2, '0');
function tick() {
  let s = Math.max(0, Math.floor((target - new Date()) / 1000)); if (s === 0) target = nextDrop();
  document.getElementById('tD').textContent = pad(Math.floor(s / 86400)); s %= 86400;
  document.getElementById('tH').textContent = pad(Math.floor(s / 3600)); s %= 3600;
  document.getElementById('tM').textContent = pad(Math.floor(s / 60));
  document.getElementById('tS').textContent = pad(s % 60);
}
if (!SNAP) { tick(); setInterval(tick, 1000); }

/* ---------- misc ---------- */
const nav = document.querySelector('.nav'), burger = document.querySelector('.burger');
burger.addEventListener('click', () => { const o = nav.classList.toggle('menu-open'); burger.setAttribute('aria-expanded', o); });
document.querySelectorAll('.nav-links a').forEach((a) => a.addEventListener('click', () => nav.classList.remove('menu-open')));
let bag = 0;
document.querySelectorAll('.drop .btn').forEach((a) => a.addEventListener('click', () => { bag++; document.getElementById('bagCount').textContent = bag; }));
document.getElementById('clubForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const v = document.getElementById('email').value.trim();
  document.getElementById('clubNote').textContent = /.+@.+\..+/.test(v) ? "Thanks, you're on the list. (Demo: nothing was sent.)" : 'Please type a valid email.';
});
window.__st = st;
window.__stride = { setColour, get progress() { return smoothP; } };
