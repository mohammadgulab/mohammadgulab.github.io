// VELOTRON VX-1 concept. Scroll-driven film: mist -> ignite -> helmet reveal -> 3D anatomy.
const Q = new URLSearchParams(location.search);
const QA = Q.has('qa');
const $ = (s) => document.querySelector(s);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const range = (p, a, b) => clamp((p - a) / (b - a));
const ease = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const smooth = (t) => t * t * (3 - 2 * t);

gsap.registerPlugin(ScrollTrigger);

const stage = $('#stage'), bg = $('#bg'), fogC = $('#fog'), riderC = $('#rider'), glC = $('#gl');
const wordmark = $('#wordmark'), wmSpan = wordmark.querySelector('span'), wordmark2 = $('#wordmark2');
const heroCopy = $('#heroCopy'), cols = $('#cols'), ignite = $('#ignite'), finale = $('#finale');
const hud = document.querySelector('.hud'), nav = $('.nav'), barFill = $('#barFill');
const chapNum = $('#chapNum'), chapName = $('#chapName'), hint = $('#hint'), loader = $('#loader'), loadPct = $('#loadPct');
const specs = [...document.querySelectorAll('.spec')].map(el => ({ el, a: +el.dataset.in, b: +el.dataset.out }));

let W = innerWidth, H = stage.clientHeight;
let target = 0, prog = 0, time = 0;

/* ---------- colour script ---------- */
const stops = [
  [0.00, [184, 189, 193]],
  [0.11, [180, 179, 176]],
  [0.20, [236, 128, 74]],
  [0.30, [255, 92, 31]],
  [0.55, [246, 78, 22]],
  [0.80, [232, 64, 24]],
  [1.00, [206, 40, 22]],
];
function colorAt(p) {
  for (let i = 1; i < stops.length; i++) {
    if (p <= stops[i][0]) {
      const [a, ca] = stops[i - 1], [b, cb] = stops[i];
      const t = smooth((p - a) / (b - a));
      return ca.map((c, k) => Math.round(lerp(c, cb[k], t)));
    }
  }
  return stops[stops.length - 1][1];
}
const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

/* ---------- rider frame sequence ---------- */
const FRAMES = 71;
const frames = new Array(FRAMES);
let loadedFrames = 0;
function loadFrame(i) {
  return new Promise((res) => {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => { frames[i] = im; loadedFrames++; res(); };
    im.onerror = () => res();
    im.src = `media/rider/r${String(i).padStart(3, '0')}.webp`;
  });
}
(async () => {
  await loadFrame(0); drawRider(true);
  // coarse pass first so scrubbing never stalls, then fill gaps
  const order = [];
  for (let s of [8, 4, 2, 1]) for (let i = 0; i < FRAMES; i += s) if (!order.includes(i) && i) order.push(i);
  for (let k = 0; k < order.length; k += 6) await Promise.all(order.slice(k, k + 6).map(loadFrame));
})();
function nearestFrame(i) {
  for (let d = 0; d < FRAMES; d++) {
    if (frames[i - d]) return frames[i - d];
    if (frames[i + d]) return frames[i + d];
  }
  return null;
}
const rctx = riderC.getContext('2d');
let lastFrameKey = '';
function drawRider(force) {
  const p = prog;
  const fi = Math.round(ease(range(p, 0.13, 0.44)) * (FRAMES - 1));
  const key = fi + '|' + W + '|' + H;
  if (!force && key === lastFrameKey) return;
  lastFrameKey = key;
  const im = nearestFrame(fi);
  rctx.clearRect(0, 0, riderC.width, riderC.height);
  if (!im) return;
  const dpr = riderC.width / W;
  const size = Math.min(H * 0.86, W * 1.32, 1100);
  const x = W * 0.5 - size * 0.5 + size * 0.07; // rider sits a touch left in the source frame
  const y = H - size + H * 0.02;
  rctx.drawImage(im, x * dpr, y * dpr, size * dpr, size * dpr);
}

/* ---------- fog + particles ---------- */
const fctx = fogC.getContext('2d');
const FS = 0.5; // fog drawn at half res
const sprite = document.createElement('canvas'); sprite.width = sprite.height = 256;
{
  const g = sprite.getContext('2d'), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.45, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
}
let rnd = 7; const R = () => (rnd = (rnd * 16807) % 2147483647) / 2147483647;
const blobs = Array.from({ length: 16 }, () => ({ x: R(), y: .25 + R() * .8, s: .55 + R() * .9, v: (.004 + R() * .01) * (R() > .5 ? 1 : -1), a: .25 + R() * .4, ph: R() * 6 }));
const specks = Array.from({ length: 90 }, () => ({ x: R(), y: R(), r: .6 + R() * 1.8, v: .01 + R() * .04, w: R() * 6, a: .3 + R() * .7 }));
function drawFog(dt) {
  const w = fogC.width, h = fogC.height, p = prog;
  fctx.clearRect(0, 0, w, h);
  const mist = 1 - range(p, 0.10, 0.34) * 0.72;          // dense grey fog, thinning as the colour arrives
  const reveal = range(p, 0.44, 0.56);
  const warm = range(p, 0.14, 0.30);
  const tint = warm > 0 ? [255, lerp(255, 196, warm), lerp(255, 160, warm)] : [255, 255, 255];
  // tinted sprite via composite
  fctx.globalCompositeOperation = 'source-over';
  for (const b of blobs) {
    b.x += b.v * dt; if (b.x > 1.4) b.x -= 1.8; if (b.x < -0.4) b.x += 1.8;
    const s = b.s * Math.max(w, h) * (1 + .08 * Math.sin(time * .4 + b.ph));
    const yy = b.y + Math.sin(time * .2 + b.ph) * .02 - reveal * .08;
    fctx.globalAlpha = b.a * mist * (QA ? 1 : 1) * (0.65 + 0.35 * Math.sin(time * .3 + b.ph));
    fctx.drawImage(sprite, b.x * w - s / 2, yy * h - s / 2, s, s * .55);
  }
  if (warm > 0) { // warm the fog
    fctx.globalCompositeOperation = 'source-atop';
    fctx.globalAlpha = warm * .8; fctx.fillStyle = rgb(tint); fctx.fillRect(0, 0, w, h);
  }
  fctx.globalCompositeOperation = 'lighter';
  const emb = 0.35 + range(p, 0.18, 0.4) * 0.65;
  for (const s of specks) {
    s.y -= s.v * dt * (0.6 + warm); if (s.y < -0.02) { s.y = 1.02; s.x = R(); }
    const xx = (s.x + Math.sin(time * .5 + s.w) * .01) * w, yy = s.y * h;
    fctx.globalAlpha = s.a * emb * (0.5 + 0.5 * Math.sin(time * 2 + s.w));
    fctx.fillStyle = warm > .3 ? 'rgb(255,214,170)' : 'rgb(255,255,255)';
    fctx.beginPath(); fctx.arc(xx, yy, s.r * FS * 2, 0, 6.283); fctx.fill();
  }
  fctx.globalAlpha = 1; fctx.globalCompositeOperation = 'source-over';
}

/* ---------- three.js helmet (lazy) ---------- */
let three = null, loadStarted = false;
function startGL() {
  if (loadStarted) return; loadStarted = true;
  initGL().catch((e) => { console.error(e); loader.textContent = 'Helmet could not load'; });
}
async function initGL() {
  const THREE = await import('three');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const { DRACOLoader } = await import('three/addons/loaders/DRACOLoader.js');
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');

  const renderer = new THREE.WebGLRenderer({ canvas: glC, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, QA ? 1.5 : 1.75));
  renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.03).texture;
  scene.environmentIntensity = 0.9;

  const camera = new THREE.PerspectiveCamera(28, W / H, 0.1, 50);
  scene.add(new THREE.HemisphereLight(0xfff1e6, 0x3a0d00, 0.6));
  const key = new THREE.DirectionalLight(0xffe2cc, 2.6); key.position.set(-3, 3, 4); scene.add(key);
  const rimL = new THREE.DirectionalLight(0xff6a2a, 5.5); rimL.position.set(-4, 1.5, -3); scene.add(rimL);
  const rimR = new THREE.DirectionalLight(0xffa060, 4.0); rimR.position.set(4, 2, -3); scene.add(rimR);
  const top = new THREE.SpotLight(0xffffff, 40, 0, Math.PI / 6, .6); top.position.set(0, 6, 1.5); scene.add(top);

  const draco = new DRACOLoader();
  draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
  const gltfLoader = new GLTFLoader(); gltfLoader.setDRACOLoader(draco);
  loader.classList.add('on');
  const gltf = await new Promise((res, rej) => gltfLoader.load('media/model/helmet.glb', res,
    (e) => { if (e.total) loadPct.textContent = Math.round(e.loaded / e.total * 100); }, rej));
  loader.classList.remove('on');

  const model = gltf.scene;
  model.traverse((o) => {
    if (!o.isMesh) return;
    const m = o.material;
    if (/Glass/i.test(o.name)) {
      o.material = new THREE.MeshPhysicalMaterial({ color: 0x0c0c10, metalness: 0.6, roughness: 0.03, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.4, reflectivity: 1, ior: 1.6 });
    } else {
      const pm = new THREE.MeshPhysicalMaterial({
        map: m.map, metalnessMap: m.metalnessMap, roughnessMap: m.roughnessMap, emissiveMap: m.emissiveMap,
        emissive: m.emissive, metalness: m.metalness, roughness: Math.min(1, m.roughness * .8),
        clearcoat: 1, clearcoatRoughness: 0.07, envMapIntensity: 1.3, side: THREE.FrontSide,
      });
      o.material = pm;
    }
  });
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
  const s = 2 / Math.max(size.x, size.y, size.z);
  model.position.sub(center).multiplyScalar(s); model.scale.setScalar(s);
  const tilt = new THREE.Group(); tilt.add(model); tilt.rotation.x = Number(Q.get('tilt') || 0.38);
  const pivot = new THREE.Group(); pivot.add(tilt);
  const holder = new THREE.Group(); holder.add(pivot); scene.add(holder);

  // soft contact shadow
  const sc = document.createElement('canvas'); sc.width = sc.height = 128;
  { const g = sc.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(60,10,0,.55)'); gr.addColorStop(1, 'rgba(60,10,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.25; scene.add(shadow);

  function fit() {
    camera.aspect = W / H;
    const vfov = camera.fov * Math.PI / 180;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    const r = 1.18; // helmet radius after normalising, with breathing room
    const portrait = W / H < 0.95;
    const d = Math.max(r / Math.tan(vfov / 2) / (portrait ? 0.72 : 0.62), r / Math.tan(hfov / 2) / (portrait ? 0.9 : 0.6));
    camera.position.set(0, 0.15, d); camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    renderer.setSize(W, H, false);
  }
  fit();
  const YAW0 = Number(Q.get('yaw0') || Math.PI); // orientation offset so 0 = front
  three = { THREE, renderer, scene, camera, holder, pivot, shadow, fit, YAW0 };
  window.__three = three;
}
function renderGL() {
  if (!three) return;
  const p = prog;
  const inT = ease(range(p, 0.45, 0.57));
  glC.style.opacity = inT.toFixed(3);
  if (inT <= 0.001) return;
  const { holder, pivot, renderer, scene, camera, shadow, YAW0 } = three;
  // side -> front -> other side, scrubbed by scroll
  const rotT = ease(range(p, 0.56, 0.92));
  const yaw = lerp(-Math.PI / 2, Math.PI / 2, rotT);
  const fin = ease(range(p, 0.92, 1));
  pivot.rotation.y = YAW0 + yaw + fin * -0.55 + (1 - inT) * -0.6 + Math.sin(time * .6) * 0.03;
  pivot.rotation.x = Math.sin(time * .8) * 0.035 - fin * 0.05;
  pivot.rotation.z = Math.sin(time * .5) * 0.02;
  holder.position.y = Math.sin(time * 1.3) * 0.04 + (1 - inT) * -0.5 + fin * 0.22;
  holder.scale.setScalar(lerp(0.72, 1, inT) * lerp(1, 0.86, fin));
  shadow.material.opacity = 0.8 - (holder.position.y + 0.1) * 0.6;
  renderer.render(scene, camera);
}

/* ---------- layout ---------- */
function resize() {
  W = innerWidth; H = stage.clientHeight;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  riderC.width = Math.round(W * dpr); riderC.height = Math.round(H * dpr);
  fogC.width = Math.round(W * FS); fogC.height = Math.round(H * FS);
  lastFrameKey = '';
  if (three) three.fit();
  drawRider(true);
}
let lastW = 0;
addEventListener('resize', () => { if (Math.abs(innerWidth - lastW) > 2 || !QA) { lastW = innerWidth; resize(); } });
resize(); lastW = innerWidth;

/* ---------- scroll ---------- */
const st = ScrollTrigger.create({ trigger: '#film', start: 'top top', end: 'bottom bottom', onUpdate: (self) => { target = self.progress; } });

const chapters = [[0, '01', 'Mist'], [0.15, '02', 'Ignite'], [0.45, '03', 'Reveal'], [0.56, '04', 'Anatomy'], [0.92, '05', 'Apex']];
function applyScene() {
  const p = prog;
  const c = colorAt(p);
  const hi = c.map(v => Math.min(255, v + 34));
  bg.style.background = `radial-gradient(120% 80% at 50% 38%, ${rgb(hi)} 0%, ${rgb(c)} 55%, ${rgb(c.map(v => v * .78))} 100%)`;
  document.querySelector('meta[name=theme-color]').content = rgb(c);
  const warm = range(p, 0.14, 0.30);
  const light = warm > 0.5;
  nav.classList.toggle('light', light && p < 0.999);
  hud.classList.toggle('light', light);

  // wordmark: slow parallax drift, darkens to a deep red as the colour arrives
  const wmw = wmSpan.offsetWidth || W * 2;
  const drift = -(wmw - W * 0.9) * ease(range(p, 0, 0.5)) - Math.sin(time * .25) * 6;
  const wmScale = 1 + range(p, 0.0, 0.45) * 0.08;
  wordmark.style.transform = `translate3d(${drift}px, ${range(p, 0, .5) * -H * .04}px, 0) scale(${wmScale})`;
  const wmCol = [lerp(255, 150, warm), lerp(255, 26, warm), lerp(255, 10, warm)];
  wordmark.style.color = rgb(wmCol, lerp(0.82, 0.5, warm) * (1 - range(p, 0.46, 0.56)));
  wordmark2.style.opacity = (range(p, 0.5, 0.6) * (1 - range(p, 0.9, 0.97)) * 0.9).toFixed(3);
  wordmark2.style.transform = `translate(-50%,-50%) translateX(${(0.5 - range(p, 0.5, 1)) * W * 0.18}px)`;

  // rider: scrubbed frames, then zoom + blur away as the helmet takes over
  const out = range(p, 0.44, 0.54);
  riderC.style.opacity = (1 - out).toFixed(3);
  riderC.style.transform = `scale(${(1 + range(p, 0, .44) * 0.06 + out * 0.35).toFixed(4)}) translateY(${out * 4}%)`;
  riderC.style.filter = out > 0.01 ? `blur(${(out * 16).toFixed(1)}px)` : (p < 0.12 ? `blur(${((0.12 - p) * 10).toFixed(2)}px)` : 'none');

  // copy
  const h1 = 1 - range(p, 0.05, 0.12);
  heroCopy.style.opacity = h1; heroCopy.style.transform = `translateY(${(1 - h1) * -30}px)`;
  const c1 = 1 - range(p, 0.07, 0.13);
  cols.style.opacity = c1; cols.style.transform = `translateY(${(1 - c1) * 20}px)`;
  const ig = range(p, 0.2, 0.26) * (1 - range(p, 0.38, 0.44));
  ignite.style.opacity = ig; ignite.style.transform = `translateY(${(1 - ig) * 24}px)`;
  for (const s of specs) {
    const v = range(p, s.a, s.a + 0.03) * (1 - range(p, s.b - 0.02, s.b));
    s.el.style.opacity = v.toFixed(3); s.el.style.transform = `translateY(${((1 - v) * 16).toFixed(1)}px)`;
  }
  const f = range(p, 0.94, 0.985);
  finale.style.opacity = f; finale.style.transform = `translateY(${(1 - f) * 24}px)`;
  finale.classList.toggle('on', f > 0.5);

  hint.style.opacity = p > 0.03 ? 0 : '';
  barFill.style.transform = `scaleX(${p.toFixed(4)})`;
  let ch = chapters[0]; for (const k of chapters) if (p >= k[0]) ch = k;
  if (chapNum.textContent !== ch[1]) { chapNum.textContent = ch[1]; chapName.textContent = ch[2]; }
  if (p > 0.1) startGL();
  loader.style.visibility = p > 0.3 ? 'visible' : 'hidden';
}

/* ---------- loop ---------- */
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!QA || !window.__frozen) time += dt;
  if (!QA || !window.__frozen) prog += (target - prog) * (1 - Math.pow(0.0009, dt));
  if (Math.abs(target - prog) < 0.00005) prog = target;
  const filmVisible = st.progress < 1 || scrollY < st.end + 10;
  if (filmVisible) {
    applyScene(); drawRider(); drawFog(dt * 1); renderGL();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// warm up the model after first paint, even if the visitor has not scrolled yet
addEventListener('load', () => setTimeout(startGL, QA ? 0 : 2500));

/* ---------- section reveals + nav tone ---------- */
gsap.utils.toArray('.reveal').forEach((el) => {
  gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
});
[['#after', true], ['#reserve', false], ['#atelier', false], ['.foot', true]].forEach(([sel, isLight]) => {
  ScrollTrigger.create({ trigger: sel, start: 'top 40px', end: 'bottom 40px', onToggle: (s) => { if (s.isActive) nav.classList.toggle('light', isLight); } });
});

/* ---------- QA hooks ---------- */
if (QA) {
  window.__qa = {
    set(p, t) { window.__frozen = true; prog = target = p; if (t != null) time = t; applyScene(); drawRider(true); drawFog(0.016); renderGL(); },
    ready: () => !!three && loadedFrames >= FRAMES - 1,
    state: () => ({ prog, loadedFrames, three: !!three, yaw: three && three.pivot.rotation.y }),
  };
}
