import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CARS, CREDITS } from './cars.js?v=2';

/* ================= basics ================= */
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const PARAMS = new URLSearchParams(location.search);
const QA = PARAMS.has('qa');
const isPhone = () => Math.min(innerWidth, innerHeight) < 600;
const FONT_T = '"Anton", Impact, "Arial Black", sans-serif', FONT_S = '"Yellowtail", "Brush Script MT", cursive', FONT_H = '"Chakra Petch", system-ui, sans-serif';
const loaderTxt = $('#l-txt'), loaderFill = $('#l-fill');
function setLoad(p, t) { loaderFill.style.width = Math.round(p * 100) + '%'; if (t) loaderTxt.textContent = t; }
setLoad(0.1, 'Building the city\u2026');

/* ================= districts ================= */
const STOPS = [
  { id: 'about', label: 'ABOUT', name: 'Origin Avenue', short: 'A', f: 0.13, c: '#ff3fa4', t: 't-about' },
  { id: 'skills', label: 'SKILLS', name: 'Skill Row', short: 'S', f: 0.31, c: '#2ef2ff', t: 't-skills' },
  { id: 'projects', label: 'PROJECTS', name: 'Demo District', short: 'P', f: 0.50, c: '#b46bff', t: 't-projects' },
  { id: 'achievements', label: 'ACHIEVEMENTS', name: 'Trophy Heights', short: '\u2605', f: 0.69, c: '#ffd23f', t: 't-achievements' },
  { id: 'contact', label: 'CONTACT', name: 'Signal Bay', short: 'C', f: 0.87, c: '#4dff9a', t: 't-contact' },
];
const ZONE_TEXT = [
  ['JEDDAH', 'DOC CONTROL', 'OPEN FOR WORK', 'KAISH'],
  ['EXCEL', 'HTML CSS JS', 'PHOTOSHOP', 'ACONEX'],
  ['SUMAC GRILL', 'SOUQLY', 'KEYFORGE K7', 'QAHWA HOUSE'],
  ['B.SC PHYSICS', 'REACT JS', '100% EXAM', 'ROSHN AL AROUS'],
  ['WHATSAPP', 'FIVERR', 'FREELANCER', 'GITHUB'],
];
const BRANDS = ['ZEPHYR COLA', 'PIXEL MART', 'VOLTA MOTORS', 'NEON NOODLE', 'SOUQ 24/7', 'CHAI CORNER', 'NOVA FM', 'ORBIT GYM', 'DUNE AIR', 'MARINA BANK'];

/* ================= renderer ================= */
const canvas = $('#city');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false }); }
catch (e) { setLoad(1, 'This 3D city needs WebGL, which this browser has turned off.'); throw e; }
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.info.autoReset = false;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
let PR = Math.min(devicePixelRatio || 1, isPhone() ? 1.6 : 1.5);
if (QA) PR = Math.min(PR, +(PARAMS.get('pr') || 1));
renderer.setPixelRatio(PR);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, 1, 0.3, 1800);
const FOG_COL = new THREE.Color(0x2a1533);
scene.fog = new THREE.FogExp2(FOG_COL, 0.0036);

/* ================= track (closed loop) ================= */
const ctrl = [];
for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; ctrl.push(new THREE.Vector3(Math.cos(a) * 250 * (1 + 0.14 * Math.sin(3 * a + 0.5)), 0, Math.sin(a) * 190 * (1 + 0.12 * Math.cos(2 * a + 1)))); }
const curve = new THREE.CatmullRomCurve3(ctrl, true, 'centripetal');
const NS = 2400;
const L = curve.getLength();
const TP = [], TT = [];
for (let i = 0; i <= NS; i++) { const u = i / NS; TP.push(curve.getPointAt(u % 1)); TT.push(curve.getTangentAt(u % 1).setY(0).normalize()); }
const wrapS = s => ((s % L) + L) % L;
const wrapD = d => { d = ((d % L) + L) % L; if (d > L / 2) d -= L; return d; };
function trackAt(s, outP, outT) { const f = wrapS(s) / L * NS; const i = Math.min(NS - 1, Math.floor(f)), k = f - i; outP.copy(TP[i]).lerp(TP[i + 1], k); if (outT) outT.copy(TT[i]).lerp(TT[i + 1], k).normalize(); return outP; }
const rightOf = (T, out) => out.set(-T.z, 0, T.x);
STOPS.forEach((s, i) => { s.i = i; s.gate = s.f * L; s.pos = s.gate - 24; });
const ROAD_HW = 8, WALK = 4.5, LAMP_GAP = 28;
const P0 = new THREE.Vector3(), T0 = new THREE.Vector3(), R0 = new THREE.Vector3();

/* ================= sky ================= */
const SUN_DIR = new THREE.Vector3(-0.55, 0.07, -0.83).normalize();
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { uSun: { value: SUN_DIR }, uTime: { value: 0 } },
  vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*p; gl_Position.z = gl_Position.w*0.99999; }`,
  fragmentShader: `varying vec3 vDir; uniform vec3 uSun; uniform float uTime;
  float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
  float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y); }
  float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){ v+=a*n2(p); p*=2.03; a*=0.5; } return v; }
  void main(){
    vec3 d = normalize(vDir); float y = d.y;
    vec3 zen = vec3(0.03,0.025,0.10), mid = vec3(0.2,0.06,0.22), hor = vec3(1.0,0.34,0.16), low = vec3(0.07,0.035,0.08);
    float sd = max(dot(d,uSun),0.0);
    vec3 c = mix(hor, mid, smoothstep(0.0,0.16,y));
    c = mix(c, zen, smoothstep(0.12,0.6,y));
    c = mix(c, low, smoothstep(0.0,-0.08,y));
    c += vec3(1.2,0.45,0.15) * pow(sd,6.0) * 0.55 * smoothstep(-0.05,0.25,y+0.1);
    vec2 cp = d.xz/(y+0.12)*1.6 + vec2(uTime*0.004,0.0);
    float cl = smoothstep(0.48,0.85,fbm(cp)) * smoothstep(0.02,0.12,y) * (1.0-smoothstep(0.35,0.7,y));
    vec3 cc = mix(vec3(0.14,0.05,0.14), vec3(1.25,0.48,0.32), pow(sd,3.0)*0.9 + smoothstep(0.25,0.0,y)*0.35);
    c = mix(c, cc, cl*0.85);
    c += vec3(5.0,2.6,1.2) * smoothstep(0.9993,0.9997,sd);
    c += vec3(1.6,0.6,0.25) * pow(sd,180.0);
    vec2 sp = d.xz/(y+0.02)*90.0; float st = step(0.996, h21(floor(sp))) * smoothstep(0.25,0.7,y);
    c += vec3(0.9,0.9,1.0)*st*(0.5+0.5*sin(uTime*2.0+h21(floor(sp))*40.0));
    gl_FragColor = vec4(c,1.0);
  }`
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(1500, 48, 24), skyMat);
sky.frustumCulled = false; sky.renderOrder = -10;
scene.add(sky);

/* ================= canvas textures ================= */
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
function facadeAtlas() {
  const A = mk(2048, 512), E = mk(2048, 512); const a = A.getContext('2d'), e = E.getContext('2d');
  e.fillStyle = '#000'; e.fillRect(0, 0, 2048, 512);
  const r = rng(7);
  const warm = ['#ffd9a0', '#ffc77a', '#ffe8c4', '#ffb35c'], cool = ['#cfe6ff', '#e8f3ff', '#a9d4ff'], neon = ['#ff5fb4', '#4fe8ff', '#b07bff'];
  for (let s = 0; s < 4; s++) {
    const ox = s * 512;
    a.fillStyle = ['#1d2433', '#4a4440', '#3b302c', '#141821'][s]; a.fillRect(ox, 0, 512, 512);
    for (let fy = 0; fy < 8; fy++) for (let fx = 0; fx < 8; fx++) {
      const x = ox + fx * 64, y = fy * 64;
      if (s === 0) {
        const g = a.createLinearGradient(x, y, x, y + 64); g.addColorStop(0, '#34465f'); g.addColorStop(1, '#141c2a');
        a.fillStyle = g; a.fillRect(x + 2, y + 3, 60, 58); a.fillStyle = '#0c1018'; a.fillRect(x, y + 58, 64, 6);
        if (r() < 0.32) { e.fillStyle = r() < 0.7 ? warm[(r() * 4) | 0] : cool[(r() * 3) | 0]; e.globalAlpha = 0.55 + r() * 0.45; e.fillRect(x + 4, y + 6, 56, 50); }
      } else if (s === 1) {
        for (const px of [x + 8, x + 33]) {
          const g2 = a.createLinearGradient(px, y + 12, px, y + 52); g2.addColorStop(0, '#2a3040'); g2.addColorStop(1, '#14161c');
          a.fillStyle = g2; a.fillRect(px, y + 12, 23, 40);
          if (r() < 0.4) { e.fillStyle = r() < 0.6 ? cool[(r() * 3) | 0] : warm[(r() * 4) | 0]; e.globalAlpha = 0.45 + r() * 0.5; e.fillRect(px, y + 12, 23, 40); }
        }
        a.fillStyle = '#5a534d'; a.fillRect(x, y + 54, 64, 4);
      } else if (s === 2) {
        a.fillStyle = '#16120f'; a.fillRect(x + 16, y + 12, 32, 36); a.fillStyle = '#6a5f55'; a.fillRect(x + 10, y + 48, 44, 5); a.fillStyle = '#2a2420'; a.fillRect(x + 31, y + 12, 2, 36);
        if (r() < 0.38) { e.fillStyle = warm[(r() * 4) | 0]; e.globalAlpha = 0.45 + r() * 0.5; e.fillRect(x + 16, y + 12, 32, 36); e.globalAlpha = 0.25; e.fillStyle = '#000'; e.fillRect(x + 16 + (r() * 16 | 0), y + 12, 10, 36); }
      } else {
        a.fillStyle = '#0d1016'; a.fillRect(x + 4, y + 2, 56, 60);
        if (fx % 4 === 0) { e.globalAlpha = 0.9; e.fillStyle = neon[(fx / 4 + fy) % 3]; e.fillRect(x + 28, y, 8, 64); }
        else if (r() < 0.22) { e.fillStyle = warm[(r() * 4) | 0]; e.globalAlpha = 0.6; e.fillRect(x + 8, y + 8, 48, 46); }
      }
      e.globalAlpha = 1;
    }
  }
  const ta = new THREE.CanvasTexture(A), te = new THREE.CanvasTexture(E);
  ta.colorSpace = te.colorSpace = THREE.SRGBColorSpace; ta.anisotropy = te.anisotropy = 4;
  return [ta, te];
}
function glowTex(inner, outer) {
  const c = mk(128, 128), g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, inner); gr.addColorStop(0.22, outer); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function asphaltTex() {
  const c = mk(256, 256), g = c.getContext('2d'); const r = rng(3);
  g.fillStyle = '#7f7f7f'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9000; i++) { const v = 90 + r() * 80 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(r() * 256, r() * 256, 1 + r() * 2, 1 + r() * 2); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function signTex(lines, color, w = 1024, h = 256, opts = {}) {
  const c = mk(w, h), g = c.getContext('2d');
  g.fillStyle = opts.bg || 'rgba(8,4,18,0.94)'; g.fillRect(0, 0, w, h);
  g.strokeStyle = color; g.lineWidth = 10; g.shadowColor = color; g.shadowBlur = 24; g.strokeRect(14, 14, w - 28, h - 28);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach(([txt, font, size, y, col]) => {
    let s = size; g.font = `${s}px ${font}`;
    while (g.measureText(txt).width > w - 90 && s > 20) { s -= 4; g.font = `${s}px ${font}`; }
    g.shadowColor = col || color; g.shadowBlur = 30; g.fillStyle = col || color; g.fillText(txt, w / 2, y);
    g.shadowBlur = 0; g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillText(txt, w / 2, y);
  });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

/* ================= environment (reflections) ================= */
const pmrem = new THREE.PMREMGenerator(renderer);
{
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), skyMat));
  const lm = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.1, 0.7) });
  const cm = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.6, 0.9, 1.6) });
  const pm = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 0.4, 1.0) });
  const r = rng(5);
  for (let i = 0; i < 30; i++) {
    const a = r() * Math.PI * 2, d = 40 + r() * 30, h = 2 + r() * 14;
    const b = new THREE.Mesh(new THREE.BoxGeometry(3 + r() * 10, h, 1), [lm, cm, pm][(r() * 3) | 0]);
    b.position.set(Math.cos(a) * d, h / 2 - 2, Math.sin(a) * d); b.lookAt(0, b.position.y, 0); env.add(b);
  }
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(50, 5), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.0, 1.8, 1.6) }));
  strip.position.set(0, 40, 0); strip.rotation.x = Math.PI / 2; env.add(strip);
  scene.environment = pmrem.fromScene(env, 0.035).texture;
}

/* ================= lights ================= */
scene.add(new THREE.HemisphereLight(0x7a6ac0, 0x1a0c18, 0.42));
const sun = new THREE.DirectionalLight(0xff9a60, 1.6);
sun.position.copy(SUN_DIR).multiplyScalar(100); scene.add(sun);
const fill = new THREE.DirectionalLight(0x6a7cff, 0.45); fill.position.set(60, 40, 80); scene.add(fill);

/* ================= road (wet, reflective) ================= */
function ribbon(u0, u1, y0, y1, segs) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const s = i / segs * L; trackAt(s, P0, T0); rightOf(T0, R0);
    pos.push(P0.x + R0.x * u0, y0, P0.z + R0.z * u0, P0.x + R0.x * u1, y1, P0.z + R0.z * u1);
    uv.push(u0, s, u1, s);
    if (i < segs) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
}
let reflector;
const roadShader = {
  name: 'WetRoad',
  uniforms: {
    color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null },
    uAsph: { value: null }, uFog: { value: new THREE.Color() }, uDen: { value: 0.004 },
    uCar: { value: new THREE.Vector3() }, uDir: { value: new THREE.Vector3(0, 0, 1) }, uBrake: { value: 0 }
  },
  vertexShader: `uniform mat4 textureMatrix; varying vec4 vR; varying vec2 vUv; varying vec3 vW;
    void main(){ vR = textureMatrix*vec4(position,1.0); vUv = uv; vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform sampler2D uAsph; uniform vec3 uFog; uniform float uDen; uniform vec3 uCar; uniform vec3 uDir; uniform float uBrake; uniform vec3 color;
    varying vec4 vR; varying vec2 vUv; varying vec3 vW;
    float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
    float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y); }
    void main(){
      float u = vUv.x, v = vUv.y;
      float grain = texture2D(uAsph, vec2(u, v)*0.35).r;
      float n = n2(vec2(u*0.35, v*0.12)) * 0.65 + n2(vec2(u*1.3, v*0.5)) * 0.35;
      float wet = smoothstep(0.38, 0.7, n);
      vec3 alb = vec3(0.05,0.05,0.06) * (0.7 + grain*0.6) * (1.0 - wet*0.45);
      float m = 0.0; float au = abs(u);
      m += step(abs(au-0.2),0.07);
      m += step(abs(au-4.0),0.08) * step(fract(v/9.0),0.45);
      m += step(abs(au-7.5),0.1);
      vec3 mcol = au < 0.5 ? vec3(0.8,0.55,0.1) : vec3(0.8);
      m = clamp(m,0.0,1.0);
      alb = mix(alb, mcol*(0.7+grain*0.3), m*(1.0-wet*0.5));
      float G = ${LAMP_GAP.toFixed(1)}, HG = ${(LAMP_GAP / 2).toFixed(1)};
      float la = mod(v, G) - HG; float lb = mod(v + HG, G) - HG;
      float pa = exp(-(la*la)/34.0 - pow(u-6.0,2.0)/16.0), pb = exp(-(lb*lb)/34.0 - pow(u+6.0,2.0)/16.0);
      vec3 light = vec3(0.08,0.06,0.11) + vec3(1.0,0.6,0.28)*(pa+pb)*1.2;
      vec2 rel = vW.xz - uCar.xz; vec2 fw = normalize(uDir.xz); vec2 sd = vec2(-fw.y, fw.x);
      float al = dot(rel, fw), lt = dot(rel, sd);
      float spr = 0.8 + max(al,0.0)*0.17;
      float hd = smoothstep(1.8, 5.0, al) * exp(-max(al,0.0)/20.0) * (exp(-pow(lt-0.7,2.0)/(spr*spr)) + exp(-pow(lt+0.7,2.0)/(spr*spr)));
      light += vec3(0.85,0.9,1.0) * hd * 3.0;
      float tl = exp(-pow(al+3.4,2.0)/2.2) * exp(-lt*lt/1.3);
      light += vec3(1.0,0.04,0.03) * tl * (0.35 + uBrake*1.6);
      vec3 col = alb * light;
      vec2 ruv = vR.xy / vR.w;
      float rough = (1.0 - wet) * 0.012 + 0.0025;
      vec2 dist = (vec2(n2(vec2(u*3.0, v*1.5)), n2(vec2(u*3.0+7.0, v*1.5))) - 0.5) * rough * 0.35;
      vec3 refl = texture2D(tDiffuse, ruv + dist + vec2(0.0, -2.0*rough)).rgb * 0.14
                + texture2D(tDiffuse, ruv + dist + vec2(0.0, -1.0*rough)).rgb * 0.22
                + texture2D(tDiffuse, ruv + dist).rgb * 0.28
                + texture2D(tDiffuse, ruv + dist + vec2(0.0, 1.0*rough)).rgb * 0.22
                + texture2D(tDiffuse, ruv + dist + vec2(0.0, 2.0*rough)).rgb * 0.14;
      vec3 V = normalize(cameraPosition - vW);
      float fr = 0.06 + 0.94 * pow(1.0 - clamp(V.y,0.0,1.0), 5.0);
      float k = mix(0.3, 0.95, wet) * mix(0.5, 1.0, fr) * (1.0 - m*0.6);
      col += refl * k;
      float d = length(vW - cameraPosition);
      float ff = 1.0 - exp(-uDen*uDen*d*d);
      gl_FragColor = vec4(mix(col, uFog, ff), 1.0);
    }`
};
const reflScale = () => (isPhone() ? 0.42 : 0.5);
function buildRoad() {
  const g = ribbon(-ROAD_HW, ROAD_HW, 0, 0, 1200);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setXYZ(i, x, -z, 0); }
  g.computeBoundingSphere();
  reflector = new Reflector(g, { textureWidth: Math.round(innerWidth * PR * reflScale()), textureHeight: Math.round(innerHeight * PR * reflScale()), clipBias: 0.003, shader: roadShader, multisample: 0 });
  reflector.rotation.x = -Math.PI / 2;
  const u = reflector.material.uniforms;
  u.uAsph.value = asphaltTex(); u.uFog.value = FOG_COL; u.uDen.value = scene.fog.density;
  reflector.camera.layers.disable(2);
  reflector.frustumCulled = false;
  scene.add(reflector);
  const swMat = new THREE.MeshStandardMaterial({ color: 0x4d4852, roughness: 0.5, metalness: 0.0 });
  const curbMat = new THREE.MeshStandardMaterial({ color: 0x8a8590, roughness: 0.6 });
  for (const sgn of [1, -1]) {
    const top = ribbon(sgn * ROAD_HW, sgn * (ROAD_HW + WALK), 0.18, 0.18, 600);
    const side = ribbon(sgn * ROAD_HW, sgn * ROAD_HW, 0.0, 0.18, 600);
    for (const gg of [top, side]) { gg.computeVertexNormals(); }
    const m1 = new THREE.Mesh(top, swMat), m2 = new THREE.Mesh(side, curbMat);
    m1.material.side = THREE.DoubleSide; m2.material.side = THREE.DoubleSide;
    m1.frustumCulled = m2.frustumCulled = false; scene.add(m1, m2);
  }
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), new THREE.MeshStandardMaterial({ color: 0x15111a, roughness: 0.9 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.06; scene.add(ground);
}

/* ================= buildings ================= */
const bRand = rng(42);
const bldList = [];
function zoneAt(s) { let best = 0, bd = 1e9; STOPS.forEach((z, i) => { const d = Math.abs(wrapD(z.gate - s)); if (d < bd) { bd = d; best = i; } }); return [best, bd]; }
function planCity() {
  for (const sgn of [1, -1]) for (const row of [0, 1]) {
    let s = bRand() * 10;
    while (s < L - 20) {
      const w = 14 + bRand() * 14; const sc = s + w / 2;
      trackAt(sc, P0, T0); rightOf(T0, R0);
      const [z, zd] = zoneAt(sc);
      const tall = z === 2 ? 1.8 : z === 3 ? 1.35 : 1;
      const d = 14 + bRand() * 14;
      const off = ROAD_HW + WALK + 2.5 + (row ? 34 + bRand() * 10 : 0) + d / 2;
      let h = (row ? 32 + bRand() * 70 : 10 + bRand() * 34) * tall;
      if (zd < 30 && row === 0) h = Math.min(h, 24);
      if (bRand() < 0.08 && row === 1) h *= 1.8;
      const style = h > 55 ? (bRand() < 0.5 ? 0 : 3) : (bRand() < 0.5 ? 1 : 2);
      bldList.push({ x: P0.x + R0.x * sgn * off, z: P0.z + R0.z * sgn * off, w: w - 1.5, d, h, rot: Math.atan2(T0.x, T0.z), style, lit: 0.5 + bRand() * 0.8 });
      s += w;
    }
  }
  const samp = TP.filter((_, i) => i % 6 === 0);
  for (let x = -440; x <= 440; x += 26) for (let z = -340; z <= 340; z += 26) {
    const px = x + (bRand() - 0.5) * 8, pz = z + (bRand() - 0.5) * 8;
    let md = 1e9; for (const p of samp) { const dx = p.x - px, dz = p.z - pz; const q = dx * dx + dz * dz; if (q < md) md = q; }
    if (Math.sqrt(md) < 64) continue;
    const h = 20 + Math.pow(bRand(), 1.6) * 130 * (1 - Math.min(1, Math.hypot(px, pz) / 600) * 0.5);
    bldList.push({ x: px, z: pz, w: 12 + bRand() * 10, d: 12 + bRand() * 10, h, rot: bRand() * 0.3, style: h > 60 ? (bRand() < 0.5 ? 0 : 3) : (bRand() < 0.5 ? 1 : 2), lit: 0.4 + bRand() * 0.9 });
  }
}
let beaconMat;
function buildCity() {
  const [ta, te] = facadeAtlas();
  const geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
  const n = bldList.length, aB = new Float32Array(n * 4);
  const mat = new THREE.MeshStandardMaterial({ map: ta, emissiveMap: te, emissive: 0xffffff, emissiveIntensity: 1.35, roughness: 0.38, metalness: 0.45, envMapIntensity: 0.8 });
  mat.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aB; varying vec4 vB; varying vec2 vF; varying float vRoof;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec3 bsc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
        float fw = abs(normal.x) > 0.5 ? bsc.z : bsc.x;
        vF = vec2(uv.x * fw / 24.0, uv.y * bsc.y / 28.0) + aB.yz; vRoof = step(0.5, normal.y); vB = aB;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec4 vB; varying vec2 vF; varying float vRoof;')
      .replace('#include <map_fragment>', `vec2 fu = vec2((fract(vF.x) + vB.x) * 0.25, fract(vF.y));
        vec2 gx = dFdx(vF) * vec2(0.25, 1.0), gy = dFdy(vF) * vec2(0.25, 1.0);
        vec4 fac = textureGrad(map, fu, gx, gy);
        diffuseColor.rgb *= mix(fac.rgb, vec3(0.06,0.055,0.07), vRoof);`)
      .replace('#include <emissivemap_fragment>', `vec3 emc = textureGrad(emissiveMap, fu, gx, gy).rgb * vB.w * (1.0 - vRoof) * step(0.12, vF.y - vB.z);
        float fy = vF.y - vB.z; float fx2 = fract(vF.x * 2.0);
        float shop = (1.0 - step(0.105, fy)) * step(0.015, fy) * step(0.12, fx2) * step(fx2, 0.88) * (1.0 - vRoof);
        emc += vec3(1.0, 0.72, 0.42) * shop * 0.75 * vB.w;
        totalEmissiveRadiance *= emc;`);
  };
  const im = new THREE.InstancedMesh(geo, mat, n);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const beac = [];
  bldList.forEach((b, i) => {
    q.setFromAxisAngle(up, b.rot); sc.set(b.w, b.h, b.d); ps.set(b.x, 0, b.z); m4.compose(ps, q, sc); im.setMatrixAt(i, m4);
    aB[i * 4] = b.style; aB[i * 4 + 1] = Math.floor(bRand() * 8) * 0.375; aB[i * 4 + 2] = Math.floor(bRand() * 4) * 0.25; aB[i * 4 + 3] = b.lit;
    if (b.h > 70) beac.push(b);
  });
  geo.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 4));
  im.frustumCulled = false; scene.add(im);
  beaconMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 0.2, 0.15) });
  const bm = new THREE.InstancedMesh(new THREE.SphereGeometry(0.7, 8, 6), beaconMat, Math.max(1, beac.length));
  beac.forEach((b, i) => { m4.makeTranslation(b.x, b.h + 0.7, b.z); bm.setMatrixAt(i, m4); });
  bm.layers.set(2); bm.frustumCulled = false; scene.add(bm);
}

/* ================= street furniture ================= */
const glowWarm = glowTex('rgba(255,236,200,1)', 'rgba(255,170,90,0.35)');
function buildLamps() {
  const pole = new THREE.CylinderGeometry(0.1, 0.15, 9, 8); pole.translate(0, 4.5, 0);
  const arm = new THREE.BoxGeometry(0.12, 0.12, 2.6); arm.translate(0, 8.9, 1.25);
  const head = new THREE.BoxGeometry(0.45, 0.16, 0.9); head.translate(0, 8.82, 2.5);
  const poleG = mergeGeometries([pole.toNonIndexed(), arm.toNonIndexed(), head.toNonIndexed()]);
  const lampG = new THREE.BoxGeometry(0.36, 0.05, 0.75); lampG.translate(0, 8.72, 2.5);
  const list = [];
  for (let s = 0; s < L - 5; s += LAMP_GAP) { list.push([s, 1]); list.push([s + LAMP_GAP / 2, -1]); }
  const pm = new THREE.InstancedMesh(poleG, new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.5, metalness: 0.7 }), list.length);
  const lm = new THREE.InstancedMesh(lampG, new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 4.2, 2.4) }), list.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
  const gpos = [];
  list.forEach(([s, sgn], i) => {
    trackAt(s, P0, T0); rightOf(T0, R0);
    p.set(P0.x + R0.x * sgn * (ROAD_HW + 0.7), 0.18, P0.z + R0.z * sgn * (ROAD_HW + 0.7));
    q.setFromAxisAngle(up, Math.atan2(-sgn * R0.x, -sgn * R0.z)); m4.compose(p, q, one); pm.setMatrixAt(i, m4); lm.setMatrixAt(i, m4);
    gpos.push(p.x - sgn * R0.x * 2.5, 8.55, p.z - sgn * R0.z * 2.5);
  });
  pm.frustumCulled = lm.frustumCulled = false;
  scene.add(pm, lm);
  const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(gpos, 3));
  const pts = new THREE.Points(gg, new THREE.PointsMaterial({ map: glowWarm, size: 6, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(1.2, 0.95, 0.75) }));
  pts.layers.set(2); pts.frustumCulled = false; scene.add(pts);
}
function palmGeometry() {
  const parts = [];
  const H = 10;
  const path = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.3, H * 0.35, 0), new THREE.Vector3(0.9, H * 0.7, 0), new THREE.Vector3(1.6, H, 0)]);
  const trunk = new THREE.TubeGeometry(path, 12, 0.22, 7, false);
  const tp = trunk.attributes.position;
  const tc = [];
  for (let i = 0; i < tp.count; i++) { const y = clamp(tp.getY(i) / H, 0, 1); const k = 1.35 - y * 0.55; const c = path.getPointAt(y); tp.setX(i, c.x + (tp.getX(i) - c.x) * k); tp.setZ(i, c.z + (tp.getZ(i) - c.z) * k); const v = 0.2 + (Math.floor(y * 40) % 2) * 0.04; tc.push(v * 1.15, v * 0.88, v * 0.62); }
  trunk.setAttribute('color', new THREE.Float32BufferAttribute(tc, 3));
  trunk.deleteAttribute('uv'); trunk.computeVertexNormals();
  parts.push(trunk.toNonIndexed());
  const top = new THREE.Vector3(1.6, H, 0);
  for (let f = 0; f < 12; f++) {
    const a = f / 12 * Math.PI * 2 + (f % 2) * 0.2; const len = 3.4 + (f % 3) * 0.6; const droop = 0.9 + (f % 2) * 0.6;
    const pos = [], col = [], idx = [];
    const n = 8;
    for (let k = 0; k <= n; k++) {
      const t = k / n; const r = t * len; const y = Math.sin(t * Math.PI * 0.55) * 0.9 - t * t * droop * 2.1;
      const w = Math.sin(t * Math.PI) * 0.6 + 0.04;
      const cx = top.x + Math.cos(a) * r, cz = top.z + Math.sin(a) * r, cy = top.y + y;
      const nx = -Math.sin(a) * w, nz = Math.cos(a) * w;
      pos.push(cx + nx, cy - w * 0.3, cz + nz, cx, cy + 0.06, cz, cx - nx, cy - w * 0.3, cz - nz);
      const g = 0.13 + t * 0.07; for (let j = 0; j < 3; j++) col.push(g * 0.5, g, g * 0.35);
      if (k < n) { const b = k * 3; idx.push(b, b + 3, b + 1, b + 1, b + 3, b + 4, b + 1, b + 4, b + 2, b + 2, b + 4, b + 5); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    parts.push(g.toNonIndexed());
  }
  return mergeGeometries(parts);
}
function buildPalms() {
  const g = palmGeometry();
  const list = []; const r = rng(9);
  for (let s = LAMP_GAP / 4; s < L - 5; s += LAMP_GAP / 2) { const [, zd] = zoneAt(s); if (zd < 26) continue; list.push([s + (r() - 0.5) * 3, (Math.round(s / (LAMP_GAP / 2)) % 2) ? 1 : -1]); }
  const m = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide }), list.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), sc = new THREE.Vector3(), p = new THREE.Vector3();
  list.forEach(([s, sgn], i) => {
    trackAt(s, P0, T0); rightOf(T0, R0);
    p.set(P0.x + R0.x * sgn * (ROAD_HW + 2.9), 0.18, P0.z + R0.z * sgn * (ROAD_HW + 2.9));
    q.setFromAxisAngle(up, r() * Math.PI * 2); const k = 0.85 + r() * 0.45; sc.set(k, k * (0.9 + r() * 0.4), k);
    m4.compose(p, q, sc); m.setMatrixAt(i, m4);
  });
  m.frustumCulled = false; scene.add(m);
}

/* ================= signs ================= */
const signs = [];
function signMesh(tex, w, h, glow) {
  const mat = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(glow, glow, glow), side: THREE.DoubleSide });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
}
function placeAt(obj, s, u, y) {
  trackAt(s, P0, T0); rightOf(T0, R0);
  obj.position.set(P0.x + R0.x * u, y, P0.z + R0.z * u);
  obj.rotation.y = Math.atan2(T0.x, T0.z) + Math.PI; // the plane's front looks back at the oncoming car
  return obj;
}
const metalMat = new THREE.MeshStandardMaterial({ color: 0x1c1c22, metalness: 0.8, roughness: 0.4 });
function gantry(s, tex, w, h, y, color, glow = 1.15) {
  const g = new THREE.Group();
  const span = ROAD_HW * 2 + 2.5;
  for (const x of [-span / 2, span / 2]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.5, y + h / 2 + 0.6, 0.5), metalMat); p.position.set(x, (y + h / 2 + 0.6) / 2, 0); g.add(p); }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(span, 0.5, 0.6), metalMat); beam.position.y = y + h / 2 + 0.4; g.add(beam);
  const sm = signMesh(tex, w, h, glow); sm.position.set(0, y, 0.02); g.add(sm);
  const back = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, h + 0.3, 0.3), metalMat); back.position.set(0, y, -0.17); g.add(back);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.12, 0.12), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2.2) })); strip.position.set(0, y - h / 2 - 0.25, 0.1); g.add(strip);
  placeAt(g, s, 0, 0); scene.add(g); signs.push({ m: sm, base: glow, ph: Math.random() * 10 });
  return g;
}
function billboard(s, u, text, color, sub) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 9, 10), metalMat); pole.position.y = 4.5; g.add(pole);
  const tex = signTex([[text, FONT_T, 150, sub ? 108 : 128], ...(sub ? [[sub, FONT_H, 46, 200, '#ffffff']] : [])], color, 1024, 256);
  const sm = signMesh(tex, 10, 2.5, 1.05); sm.position.set(0, 10.4, 0.02); g.add(sm);
  const back = new THREE.Mesh(new THREE.BoxGeometry(10.3, 2.8, 0.3), metalMat); back.position.set(0, 10.4, -0.17); g.add(back);
  placeAt(g, s, u, 0); g.rotation.y += (u > 0 ? 0.4 : -0.4);
  scene.add(g); signs.push({ m: sm, base: 1.05, ph: Math.random() * 10 });
}
function buildSigns() {
  STOPS.forEach((st, i) => {
    const tex = signTex([[st.name.toUpperCase(), FONT_T, 120, 104], [st.label, FONT_H, 58, 196, '#ffffff']], st.c, 1024, 256);
    gantry(st.gate, tex, 13, 3.25, 7.2, st.c);
    const w = ZONE_TEXT[i];
    billboard(st.gate - 42, ROAD_HW + 5.5, w[0], st.c, st.label);
    billboard(st.gate - 72, -(ROAD_HW + 5.5), w[1], st.c);
    billboard(st.gate + 32, ROAD_HW + 5.5, w[2], st.c);
    billboard(st.gate + 58, -(ROAD_HW + 5.5), w[3], st.c);
  });
  const wt = signTex([['Welcome to', FONT_S, 120, 84, '#ffffff'], ['KAISH CITY', FONT_T, 170, 204, '#ffb347']], '#ff3fa4', 1024, 300);
  gantry(L - 20, wt, 15, 4.4, 7.6, '#ff3fa4', 0.8);
  const r = rng(77); let k = 0;
  const cols = ['#ff3fa4', '#2ef2ff', '#ffd23f', '#b46bff', '#4dff9a'];
  for (let i = 0; i < STOPS.length; i++) {
    const a = STOPS[i].gate + 100, b = STOPS[(i + 1) % STOPS.length].gate + (i === STOPS.length - 1 ? L : 0) - 110;
    for (let s = a; s < b; s += 75) { if (Math.abs(wrapD(s - (L - 20))) < 40) continue; billboard(s, (k % 2 ? 1 : -1) * (ROAD_HW + 5.5), BRANDS[k % BRANDS.length], cols[(r() * 5) | 0]); k++; }
  }
}

/* ================= car loading ================= */
const draco = new DRACOLoader(); draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
const gltfLoader = new GLTFLoader(); gltfLoader.setDRACOLoader(draco);
function loadGLB(url, onProg) { return new Promise((res, rej) => gltfLoader.load(url, res, x => { if (x.total && onProg) onProg(x.loaded / x.total); }, rej)); }
const carRoot = new THREE.Group(); scene.add(carRoot);
const carBody = new THREE.Group(); carRoot.add(carBody);
let carModel = null, wheels = [], carLen = 4.6, carW = 2.0, curCar = -1;
const cache = {};
const glowWhite = glowTex('rgba(255,255,255,1)', 'rgba(170,200,255,0.4)');
const glowRed = glowTex('rgba(255,90,80,1)', 'rgba(255,0,0,0.45)');
const headSprites = [], tailSprites = [];
function makeSprite(tex, color, size) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.set(size, size, 1); return s; }
function visBox(root) { root.updateMatrixWorld(true); const b = new THREE.Box3(); root.traverse(o => { if (o.isMesh && o.visible) b.expandByObject(o); }); return b; }
function prepModel(gltf, cfg) {
  const src = gltf.scene;
  const wrap = new THREE.Group(); const inner = new THREE.Group(); inner.add(src); wrap.add(inner);
  inner.rotation.y = cfg.rotY || 0;
  src.traverse(o => {
    if (!o.isMesh) return;
    if (cfg.hideName && cfg.hideName.test(o.name)) { o.visible = false; return; }
    const arr = Array.isArray(o.material);
    const ms = arr ? o.material : [o.material];
    const out = ms.map(m => {
      if (cfg.hideMat && cfg.hideMat.test(m.name || '')) o.visible = false;
      if (m.envMapIntensity !== undefined) m.envMapIntensity = cfg.env || 1.25;
      if (cfg.paint && cfg.paint.test(m.name || '')) {
        const p = new THREE.MeshPhysicalMaterial({ color: cfg.paintColor ? new THREE.Color(cfg.paintColor) : m.color.clone(), map: cfg.paintColor ? null : m.map, metalness: cfg.metal ?? 0.6, roughness: cfg.rough ?? 0.28, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.5, normalMap: m.normalMap || null });
        return p;
      }
      if (cfg.glass && cfg.glass.test(m.name || '')) { m.transparent = true; m.opacity = Math.min(m.opacity, 0.55); m.roughness = 0.05; m.color && m.color.multiplyScalar(0.4); }
      if (cfg.lightsF && cfg.lightsF.test(m.name || '')) { m.emissive = new THREE.Color(1, 1, 1); m.emissiveIntensity = 2.5; }
      if (cfg.lightsR && cfg.lightsR.test(m.name || '')) { m.emissive = new THREE.Color(1, 0.05, 0.03); m.emissiveIntensity = 2.5; }
      return m;
    });
    o.material = arr ? out : out[0];
  });
  let bb = visBox(wrap); let size = bb.getSize(new THREE.Vector3());
  if (cfg.rotY === undefined && size.x > size.z * 1.2) { inner.rotation.y = Math.PI / 2; bb = visBox(wrap); size = bb.getSize(new THREE.Vector3()); }
  inner.scale.setScalar(cfg.len / size.z); bb = visBox(wrap);
  const c = bb.getCenter(new THREE.Vector3());
  inner.position.set(-c.x, -bb.min.y + (cfg.lift || 0), -c.z);
  bb = visBox(wrap); size = bb.getSize(new THREE.Vector3());
  // wheels: meshes whose path names look like wheels, grouped into 4 corner pivots
  const WRE = cfg.wheel || /wheel|tire|tyre|rim\b|rims|whl|felge|reifen/i;
  const pathName = o => { const a = []; while (o && o !== wrap) { a.push((o.name || '') + ':' + ((o.material && o.material.name) || '')); o = o.parent; } return a.join('/'); };
  const corners = {};
  const meshes = []; wrap.traverse(o => { if (o.isMesh && o.visible) meshes.push(o); });
  // a mesh that holds all four wheels gets split into four by quadrant so each can spin
  const v3 = new THREE.Vector3();
  for (const o of meshes.slice()) {
    const pn = pathName(o); if (!WRE.test(pn) || (cfg.noSpin && cfg.noSpin.test(pn))) continue;
    const b = new THREE.Box3().setFromObject(o); const sz = b.getSize(new THREE.Vector3());
    if (sz.z <= size.z * 0.4 && sz.x <= size.x * 0.6) continue;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry;
    const pa = g.attributes.position, buckets = { fl: [], fr: [], rl: [], rr: [] };
    o.updateMatrixWorld(true);
    for (let t = 0; t < pa.count; t += 3) {
      let cx = 0, cz = 0; for (let k = 0; k < 3; k++) { v3.fromBufferAttribute(pa, t + k).applyMatrix4(o.matrixWorld); cx += v3.x; cz += v3.z; }
      buckets[(cz > 0 ? 'f' : 'r') + (cx > 0 ? 'l' : 'r')].push(t);
    }
    for (const key in buckets) {
      const list = buckets[key]; if (!list.length) continue;
      const ng = new THREE.BufferGeometry();
      for (const name in g.attributes) {
        const src = g.attributes[name], isz = src.itemSize, arr = new src.array.constructor(list.length * 3 * isz);
        list.forEach((t, j) => { for (let k = 0; k < 3 * isz; k++) arr[j * 3 * isz + k] = src.array[t * isz + k]; });
        ng.setAttribute(name, new THREE.BufferAttribute(arr, isz, src.normalized));
      }
      const nm = new THREE.Mesh(ng, o.material); nm.name = o.name + '_' + key; nm.frustumCulled = false;
      nm.position.copy(o.position); nm.quaternion.copy(o.quaternion); nm.scale.copy(o.scale); o.parent.add(nm); nm.updateMatrixWorld(true);
      meshes.push(nm);
    }
    o.parent.remove(o); meshes.splice(meshes.indexOf(o), 1);
  }
  for (const o of meshes) {
    const pn = pathName(o);
    if (!WRE.test(pn) || (cfg.noSpin && cfg.noSpin.test(pn))) continue;
    const b = new THREE.Box3().setFromObject(o); const cc = b.getCenter(new THREE.Vector3()); const sz = b.getSize(new THREE.Vector3());
    if (sz.z > size.z * 0.4 || sz.x > size.x * 0.6) continue; // spans more than one wheel
    const key = (cc.z > 0 ? 'f' : 'r') + (cc.x > 0 ? 'l' : 'r');
    (corners[key] = corners[key] || []).push(o);
  }
  const wl = [];
  for (const key in corners) {
    const b = new THREE.Box3(); corners[key].forEach(o => b.expandByObject(o));
    const piv = new THREE.Group(); piv.position.copy(b.getCenter(new THREE.Vector3())); wrap.add(piv); piv.updateMatrixWorld(true);
    corners[key].forEach(o => piv.attach(o));
    wl.push({ piv, r: Math.max(0.28, b.getSize(new THREE.Vector3()).y / 2) });
  }
  return { obj: wrap, wheels: wl, size, cfg };
}
async function loadCar(i, prog) {
  const cfg = CARS[i];
  if (!cache[i]) { const g = await loadGLB(cfg.url, prog); cache[i] = prepModel(g, cfg); }
  return cache[i];
}
function mountCar(i) {
  const m = cache[i]; if (!m) return;
  if (carModel) carBody.remove(carModel);
  carModel = m.obj; wheels = m.wheels; carBody.add(carModel); curCar = i;
  carLen = m.size.z; carW = m.size.x;
  headSprites.forEach(s => carBody.remove(s)); tailSprites.forEach(s => carBody.remove(s)); headSprites.length = tailSprites.length = 0;
  const cfg = m.cfg;
  const hy = cfg.headY ?? 0.62, ty = cfg.tailY ?? 0.85, hx = cfg.headX ?? (carW / 2 - 0.34), tx = cfg.tailX ?? (carW / 2 - 0.3);
  const hz = cfg.headZ ?? (carLen / 2 - 0.2), tz = cfg.tailZ ?? (carLen / 2 - 0.1);
  for (const sx of [-1, 1]) {
    const h = makeSprite(glowWhite, new THREE.Color(1.6, 1.7, 2.0), 0.9); h.position.set(sx * hx, hy, hz); carBody.add(h); headSprites.push(h);
    const t = makeSprite(glowRed, new THREE.Color(2.2, 0.25, 0.2), 0.5); t.position.set(sx * tx, ty, -tz); t.userData.k = cfg.lightsR ? 0.32 : 0.5; carBody.add(t); tailSprites.push(t);
  }
  document.documentElement.style.setProperty('--acc', CARS[i].acc);
  $('#g-name').textContent = CARS[i].name;
  document.querySelectorAll('.gcar').forEach((b, k) => b.setAttribute('aria-checked', k === i ? 'true' : 'false'));
}
{
  const c = mk(128, 256), g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 256); g.filter = 'blur(12px)'; g.fillStyle = 'rgba(0,0,0,0.88)';
  g.beginPath(); if (g.roundRect) g.roundRect(22, 24, 84, 208, 30); else g.rect(22, 24, 84, 208); g.fill();
  const t = new THREE.CanvasTexture(c);
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 5.6), new THREE.MeshBasicMaterial({ map: t, blending: THREE.MultiplyBlending, transparent: true, premultipliedAlpha: true, depthWrite: false, toneMapped: false }));
  sh.rotation.x = -Math.PI / 2; sh.position.y = 0.02; sh.renderOrder = 2; carRoot.add(sh);
}

/* ================= traffic ================= */
const traffic = [];
async function buildTraffic() {
  let g; try { g = await loadGLB('models/traffic.glb?v=2'); } catch (e) { return; }
  const src = g.scene; src.rotation.y = Math.PI;
  const cols = [0x0d0d10, 0xe8e8ec, 0x1a3b8f, 0x7a0d12, 0x3a3a40, 0xc9a227, 0x0f4d3a, 0x9aa0a8];
  const glass = new THREE.MeshStandardMaterial({ color: 0x050608, roughness: 0.05, metalness: 0.6 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.6, metalness: 0.3 });
  const red = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 0.15, 0.1) });
  const white = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 4, 3.6) });
  src.traverse(o => { if (o.isMesh) o.geometry.computeVertexNormals(); });
  const r = rng(21);
  const lanes = [[-2.4, -1], [-5.6, -1], [-2.4, -1], [5.6, 1], [-5.6, -1], [5.6, 1], [-2.4, -1], [-5.6, -1]];
  lanes.forEach(([u, dir], i) => {
    const car = src.clone(true);
    const paint = new THREE.MeshPhysicalMaterial({ color: cols[i % cols.length], metalness: 0.6, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05 });
    car.traverse(o => {
      if (!o.isMesh) return; const n = (o.name || '') + '/' + (o.material.name || '');
      if (/lights_red|tail/i.test(n)) o.material = red;
      else if (/light|lamp/i.test(n)) o.material = white;
      else if (/glass|window/i.test(n)) o.material = glass;
      else if (/body|paint|color/i.test(n)) o.material = paint;
      else o.material = dark;
    });
    const grp = new THREE.Group(); grp.add(car);
    const hs = makeSprite(glowWhite, new THREE.Color(1.6, 1.6, 1.8), 1); hs.position.set(0, 0.6, 2.3); hs.scale.set(2.2, 0.8, 1); grp.add(hs);
    const ts = makeSprite(glowRed, new THREE.Color(1.8, 0.2, 0.2), 0.8); ts.position.set(0, 0.8, -2.3); ts.scale.set(1.9, 0.55, 1); grp.add(ts);
    scene.add(grp);
    traffic.push({ g: grp, u, dir, s: r() * L, v: dir < 0 ? 15 + r() * 8 : 10 + r() * 4 });
  });
}

/* ================= state + driving ================= */
const VMAX = 52, ACC = 17;
const parkS = L - 48;
let pos = parkS, vel = 0, target = parkS, mode = 'garage', lastInput = -1e9, inputDir = 1, keyHold = 0;
let time = 0, cardStop = -1, seen = new Set(), autoTo = null, activeZone = -1, steer = 0, steerT = 0;
const laneX = 2.6;
function nextStopIndex(strict) { let best = 0, bd = 1e12; STOPS.forEach((s, i) => { let d = wrapS(s.pos - pos); if (strict && d < 12) d += L; if (d < bd) { bd = d; best = i; } }); return best; }
function prevStopIndex() { let best = 0, bd = 1e12; STOPS.forEach((s, i) => { let d = wrapS(pos - s.pos); if (d < 12) d += L; if (d < bd) { bd = d; best = i; } }); return best; }
function driveTo(i, dir) { let d = wrapS(STOPS[i].pos - pos); if (dir < 0) d = d - L; if (Math.abs(d) < 0.5) d = 0; target = pos + d; autoTo = i; lastInput = time - 10; closeCard(); }
function snap() {
  let best = -1, bd = 1e12;
  STOPS.forEach((s, i) => { const d = wrapD(s.pos - target); const score = inputDir > 0 ? (d >= -60 ? d + 60 : 1e12) : (d <= 60 ? -d + 60 : 1e12); if (score < bd) { bd = score; best = i; } });
  if (best >= 0) { target = target + wrapD(STOPS[best].pos - target); autoTo = best; }
}
const elCard = $('#card'), elBody = $('#card-body');
let doneShown = false;
function openCard(i) {
  if (cardStop === i) return; cardStop = i; const s = STOPS[i];
  document.documentElement.style.setProperty('--acc', s.c);
  $('#card-m').textContent = 'MISSION 0' + (i + 1) + ' / 05'; $('#card-l').textContent = s.label;
  elBody.innerHTML = ''; elBody.appendChild(document.getElementById(s.t).content.cloneNode(true)); elBody.scrollTop = 0;
  elCard.classList.remove('closed'); document.body.classList.add('cardopen');
  $('#card-next').textContent = i === STOPS.length - 1 ? 'To start \u25B6' : 'Drive on \u25B6';
  seen.add(i); updateDots();
  if (seen.size === STOPS.length && !doneShown) { doneShown = true; setTimeout(() => mission('CITY TOUR COMPLETE', 'Every district visited'), 900); }
}
function closeCard() { if (cardStop < 0) return; cardStop = -1; elCard.classList.add('closed'); document.body.classList.remove('cardopen'); }
let mT = 0; function mission(big, small, ms = 2400) { const m = $('#mission'); m.querySelector('.m-big').textContent = big; m.querySelector('.m-small').textContent = small || ''; m.classList.add('show'); clearTimeout(mT); mT = setTimeout(() => m.classList.remove('show'), ms); }
let dT = 0; function district(i) { const d = $('#district'); d.style.setProperty('--acc', STOPS[i].c); d.querySelector('.d-name').textContent = STOPS[i].name; d.querySelector('.d-sub').textContent = STOPS[i].label; d.classList.add('show'); clearTimeout(dT); dT = setTimeout(() => d.classList.remove('show'), 2600); }
function updateDots() { document.querySelectorAll('.sdot').forEach((b, i) => { b.classList.toggle('on', i === activeZone); b.classList.toggle('seen', seen.has(i)); }); }
let brake = 0;
function update(dt) {
  time += dt;
  if (mode === 'play') {
    if (keyHold) { target = pos + keyHold * VMAX * 0.6; lastInput = time; inputDir = keyHold; autoTo = null; }
    else if (time - lastInput > 0.35 && autoTo === null) snap();
  } else target = pos;
  const d = target - pos;
  const desired = Math.sign(d) * Math.min(VMAX, Math.sqrt(2 * ACC * 0.85 * Math.abs(d)), Math.abs(d) * 2.6);
  brake = lerp(brake, (Math.abs(desired) < Math.abs(vel) - 0.5) ? 1 : 0, Math.min(1, dt * 8));
  vel += clamp(desired - vel, -ACC * 1.4 * dt, ACC * dt);
  if (Math.abs(d) < 0.2 && Math.abs(vel) < 0.4) { vel = 0; pos = target; }
  pos += vel * dt;
  if (Math.abs(pos) > L * 3) { const k = Math.floor(pos / L) * L; pos -= k; target -= k; }
  steer += (steerT - steer) * Math.min(1, dt * 4); steerT *= Math.pow(0.15, dt);
  for (const c of traffic) c.s = wrapS(c.s + c.v * c.dir * dt);
  if (mode !== 'play') return;
  if (cardStop < 0) STOPS.forEach((s, i) => { if (Math.abs(wrapD(s.pos - pos)) < 4 && Math.abs(vel) < 4 && (autoTo === i || autoTo === null)) { openCard(i); autoTo = null; } });
  if (cardStop >= 0 && Math.abs(wrapD(STOPS[cardStop].pos - pos)) > 30) closeCard();
  if (autoTo !== null && Math.abs(target - pos) < 0.3 && Math.abs(vel) < 0.3) { if (cardStop !== autoTo) openCard(autoTo); autoTo = null; }
  const nz = nextStopIndex(false); const dn = wrapS(STOPS[nz].pos - pos);
  const az = dn < 220 ? nz : (cardStop >= 0 ? cardStop : -1);
  if (az !== activeZone) { activeZone = az; updateDots(); if (az >= 0 && cardStop !== az && dn > 30) district(az); if (az >= 0) document.documentElement.style.setProperty('--acc', STOPS[az].c); }
  objUpdate();
}
let lastObj = '';
function objUpdate() {
  let t, dtext;
  if (cardStop >= 0) { t = 'Exploring ' + STOPS[cardStop].name; dtext = STOPS[cardStop].label; }
  else { const i = autoTo !== null ? autoTo : nextStopIndex(true); const d = wrapS(STOPS[i].pos - pos); t = 'Drive to ' + STOPS[i].name; dtext = Math.round(d) + ' m \u00B7 ' + STOPS[i].label; }
  const k = t + dtext; if (k !== lastObj) { lastObj = k; $('#obj-t').textContent = t; $('#obj-d').textContent = dtext; }
}

/* ================= placement + camera ================= */
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), tmpV = new THREE.Vector3(), tmpV2 = new THREE.Vector3(), lookV = new THREE.Vector3();
const T1 = new THREE.Vector3(), P1 = new THREE.Vector3();
let viewOff = 0, camYaw = 0, camBack = 7, camUp = 2.5, garageBlend = 0, camInit = false, heading = 0, roll = 0, pitch = 0, prevVel = 0, wheelRot = 0, orbit = 2.3;
function place(dt) {
  trackAt(pos, P0, T0); rightOf(T0, R0);
  trackAt(pos + 6, P1, T1); const curv = (T0.x * T1.z - T0.z * T1.x) / 6;
  const x = laneX + steer * 1.3;
  carRoot.position.set(P0.x + R0.x * x, 0, P0.z + R0.z * x);
  heading = Math.atan2(T0.x, T0.z) + steer * 0.05 * (vel >= 0 ? 1 : -1);
  carRoot.rotation.y = heading;
  const acc = (vel - prevVel) / Math.max(dt, 1e-3); prevVel = vel;
  roll = lerp(roll, clamp(curv * vel * vel * 0.01 + steer * 0.015, -0.05, 0.05), Math.min(1, dt * 4));
  pitch = lerp(pitch, clamp(-acc * 0.0022, -0.03, 0.03), Math.min(1, dt * 4));
  carBody.rotation.set(pitch, 0, roll);
  carBody.position.y = Math.sin(time * 13) * 0.004 * Math.min(1, Math.abs(vel) / 10);
  wheelRot += vel * dt / 0.36;
  for (const w of wheels) w.piv.rotation.x = wheelRot;
  for (const s of tailSprites) { const k = s.userData.k * (1 + brake * 0.6); s.scale.set(k, k, 1); s.material.color.setRGB(1.8 + brake * 1.6, 0.2, 0.16); }
  const u = reflector.material.uniforms; u.uCar.value.copy(carRoot.position); u.uDir.value.set(Math.sin(heading), 0, Math.cos(heading)); u.uBrake.value = brake;
  for (const c of traffic) {
    const dd = wrapD(c.s - pos);
    if (c.dir > 0 && Math.abs(dd) < 12) c.s = wrapS(pos + (dd > 0 ? 12 : -12));
    trackAt(c.s, P1, T1);
    c.g.position.set(P1.x - T1.z * c.u, 0, P1.z + T1.x * c.u); c.g.rotation.y = Math.atan2(T1.x, T1.z) + (c.dir < 0 ? Math.PI : 0);
  }
}
function updateCamera(dt) {
  const portrait = innerHeight > innerWidth * 1.05;
  const fwd = tmpV.set(Math.sin(heading), 0, Math.cos(heading));
  const c = carRoot.position;
  let want;
  if (mode === 'garage') {
    orbit += dt * 0.22;
    const r = portrait ? 8.4 : 7.0;
    want = tmpV2.set(c.x + Math.sin(heading + orbit) * r, portrait ? 2.2 : 1.7, c.z + Math.cos(heading + orbit) * r);
    lookV.set(c.x, portrait ? -0.35 : 0.5, c.z);
    camera.fov = portrait ? 50 : 38;
  } else {
    const sp = Math.abs(vel) / VMAX, card = cardStop >= 0;
    const back = (portrait ? 7.0 : 6.6) + sp * 1.6 + (card ? (portrait ? 0.4 : 2.0) : 0), up = (portrait ? 2.5 : 2.15) + (card ? (portrait ? 1.0 : 0.4) : 0);
    let dy = heading - camYaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); camYaw += dy * (1 - Math.exp(-dt * 5));
    camBack = lerp(camBack, back, 1 - Math.exp(-dt * 3)); camUp = lerp(camUp, up, 1 - Math.exp(-dt * 3));
    const cf = tmpV.set(Math.sin(camYaw), 0, Math.cos(camYaw));
    want = tmpV2.copy(c).addScaledVector(cf, -camBack); want.y = camUp;
    lookV.copy(c).addScaledVector(fwd, card ? (portrait ? 1.5 : 14) : 7); lookV.y = card ? (portrait ? 0.7 : 3.0) : 1.3;
    camera.fov = (portrait ? 60 : 48) + sp * 8;
  }
  if (!camInit) { camPos.copy(want); camLook.copy(lookV); camInit = true; camYaw = heading; }
  if (mode === 'garage' || garageBlend < 1) { camPos.lerp(want, 1 - Math.exp(-dt * (mode === 'garage' ? 2.2 : 3.0))); garageBlend = mode === 'garage' ? 0 : Math.min(1, garageBlend + dt * 0.8); if (garageBlend >= 1) camPos.copy(want); }
  else camPos.copy(want);
  camLook.lerp(lookV, 1 - Math.exp(-dt * 8));
  camera.position.copy(camPos); camera.lookAt(camLook);
  const wantOff = (mode === 'play' && cardStop >= 0 && innerWidth < 900) ? 0.3 : 0;
  viewOff = lerp(viewOff, wantOff, 1 - Math.exp(-dt * 4));
  if (viewOff > 0.002) camera.setViewOffset(innerWidth, innerHeight, 0, innerHeight * viewOff, innerWidth, innerHeight); else camera.clearViewOffset();
  camera.updateProjectionMatrix();
}

/* ================= minimap ================= */
const rcv = $('#radar-cv'), rctx = rcv.getContext('2d');
function drawRadar() {
  const W = rcv.width, H = rcv.height; rctx.save();
  rctx.fillStyle = '#0d0a1c'; rctx.fillRect(0, 0, W, H);
  rctx.translate(W / 2, H / 2 + 18); rctx.rotate(heading - Math.PI); rctx.scale(-0.32, 0.32);
  const c = carRoot.position; rctx.translate(-c.x, -c.z);
  rctx.fillStyle = '#251d3c';
  for (const b of bldList) { if (Math.abs(b.x - c.x) > 400 || Math.abs(b.z - c.z) > 400) continue; rctx.save(); rctx.translate(b.x, b.z); rctx.rotate(-b.rot); rctx.fillRect(-b.w / 2, -b.d / 2, b.w, b.d); rctx.restore(); }
  rctx.strokeStyle = '#6c6488'; rctx.lineWidth = 18; rctx.beginPath(); for (let i = 0; i <= NS; i += 8) { const p = TP[i]; i ? rctx.lineTo(p.x, p.z) : rctx.moveTo(p.x, p.z); } rctx.closePath(); rctx.stroke();
  const tgt = autoTo !== null ? autoTo : nextStopIndex(true);
  rctx.strokeStyle = STOPS[tgt].c; rctx.lineWidth = 10; rctx.beginPath();
  const d = Math.min(400, wrapS(STOPS[tgt].gate - pos)); for (let k = 0; k <= d; k += 6) { trackAt(pos + k, P1); k ? rctx.lineTo(P1.x, P1.z) : rctx.moveTo(P1.x, P1.z); } rctx.stroke();
  STOPS.forEach(s => { trackAt(s.gate, P1); rctx.fillStyle = s.c; rctx.beginPath(); rctx.arc(P1.x, P1.z, 16, 0, 7); rctx.fill(); });
  rctx.restore();
  rctx.fillStyle = '#fff'; rctx.beginPath(); rctx.moveTo(W / 2, H / 2 + 6); rctx.lineTo(W / 2 - 9, H / 2 + 28); rctx.lineTo(W / 2, H / 2 + 22); rctx.lineTo(W / 2 + 9, H / 2 + 28); rctx.closePath(); rctx.fill();
}

/* ================= post ================= */
let composer, bloom, grainPass;
function setupPost() {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.62, 0.45, 1.0);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  grainPass = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uT: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uT; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
      void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 q = vUv-0.5; float v = smoothstep(0.9, 0.3, length(q*vec2(1.0,1.1)));
      c.rgb *= mix(0.6, 1.0, v); c.rgb += (h(vUv*vec2(913.0,617.0)+uT)-0.5)*0.02; gl_FragColor = c; }`
  });
  composer.addPass(grainPass);
}
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setPixelRatio(PR); renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  if (composer) { composer.setPixelRatio(PR); composer.setSize(w, h); }
  if (reflector) reflector.getRenderTarget().setSize(Math.round(w * PR * reflScale()), Math.round(h * PR * reflScale()));
}

/* ================= input ================= */
function userDrive(delta) {
  if (mode !== 'play') return;
  autoTo = null; target += delta; lastInput = time; inputDir = Math.sign(delta) || inputDir;
  target = clamp(target, pos - 300, pos + 300); hideHint();
}
addEventListener('wheel', e => {
  if (e.target.closest && e.target.closest('#card,#map,#intro,#credits')) return;
  e.preventDefault();
  const dy = e.deltaMode === 1 ? e.deltaY * 36 : e.deltaMode === 2 ? e.deltaY * 800 : e.deltaY;
  userDrive(clamp(dy, -240, 240) * 0.2);
}, { passive: false });
let drag = null;
canvas.addEventListener('pointerdown', e => { drag = { y: e.clientY, x: e.clientX, id: e.pointerId }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id) return;
  const dy = drag.y - e.clientY, dx = e.clientX - drag.x; drag.y = e.clientY; drag.x = e.clientX;
  if (mode === 'garage') { orbit -= dx * 0.01; return; }
  userDrive(dy * 0.55); steerT = clamp(steerT + dx * 0.01, -1, 1);
});
const endDrag = e => { if (drag && e.pointerId === drag.id) drag = null; };
canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
const KEYS = { ArrowUp: 1, KeyW: 1, ArrowDown: -1, KeyS: -1 };
addEventListener('keydown', e => {
  if (mode === 'garage' && e.code === 'Enter' && !(e.target.closest && e.target.closest('button'))) { e.preventDefault(); start(); return; }
  if (mode !== 'play') return;
  if (e.code === 'Escape') { $('#map').classList.add('closed'); $('#credits').classList.add('closed'); return; }
  if (e.target.closest && e.target.closest('#card') && (e.code === 'ArrowUp' || e.code === 'ArrowDown')) return;
  if (KEYS[e.code]) { keyHold = KEYS[e.code]; e.preventDefault(); hideHint(); }
  else if (e.code === 'KeyA') steerT = -1; else if (e.code === 'KeyD') steerT = 1;
  else if (e.code === 'ArrowRight' || e.code === 'KeyE') { driveTo(nextStopIndex(true), 1); e.preventDefault(); }
  else if (e.code === 'ArrowLeft' || e.code === 'KeyQ') { driveTo(prevStopIndex(), -1); e.preventDefault(); }
  else if (e.code === 'KeyM') openMap();
  else if (e.code === 'KeyG') openGarage();
});
addEventListener('keyup', e => { if (KEYS[e.code] && keyHold === KEYS[e.code]) keyHold = 0; });
let hintGone = false; function hideHint() { if (!hintGone) { hintGone = true; $('#hint').classList.add('gone'); } }
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
$('#cred-btn').onclick = () => $('#credits').classList.remove('closed');
$('#cred-x').onclick = () => $('#credits').classList.add('closed');
$('#credits').addEventListener('click', e => { if (e.target.id === 'credits') $('#credits').classList.add('closed'); });
$('#cred-list').innerHTML = CREDITS.map(c => `<div><b>${c.what}</b>${c.html}</div>`).join('');

const garageEl = $('#garage');
let loadingCar = false;
CARS.forEach((c, i) => {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'gcar'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', i === 0 ? 'true' : 'false');
  b.setAttribute('aria-label', c.name); b.style.setProperty('--acc', c.acc); b.innerHTML = `<b>${c.brand}</b><span>${c.model}</span>`;
  b.onclick = () => pickCar(i); garageEl.appendChild(b);
});
async function pickCar(i) {
  if (loadingCar || i === curCar) return; loadingCar = true;
  const btn = garageEl.children[i]; btn.classList.add('loading'); $('#start').disabled = true;
  $('#g-name').textContent = 'Loading ' + CARS[i].name;
  try { await loadCar(i, p => { $('#g-name').textContent = 'Loading ' + CARS[i].brand + ' ' + Math.round(p * 100) + '%'; }); mountCar(i); }
  catch (e) { $('#g-name').textContent = 'Could not load, tap again'; console.warn(e); }
  btn.classList.remove('loading'); $('#start').disabled = false; loadingCar = false;
}
function openGarage() { if (mode !== 'play') return; mode = 'garage'; keyHold = 0; closeCard(); document.body.classList.add('garage'); $('#intro').classList.remove('gone'); $('#hud').classList.add('hidden'); $('#start').innerHTML = '&#128273; Back on the road'; orbit = 2.3; }
$('#garage-btn').onclick = openGarage;
let started = false;
function start() {
  if (mode === 'play' || loadingCar) return;
  mode = 'play'; $('#intro').classList.add('gone'); $('#hud').classList.remove('hidden');
  if (!started) { started = true; mission('TAKING THE WHEEL', 'Mission: explore KAISH City'); driveTo(nextStopIndex(true), 1); }
  else mission(CARS[curCar].brand.toUpperCase(), 'Back on the road', 1800);
}
$('#start').onclick = start;

/* ================= loop ================= */
let last = performance.now(), kmhShown = -1, fpsAcc = 0, fpsN = 0, fpsT = 0, frameNo = 0;
function frame(dt) {
  renderer.info.reset();
  update(dt); place(dt); updateCamera(dt);
  skyMat.uniforms.uTime.value = time;
  if (beaconMat) beaconMat.color.setRGB(Math.sin(time * 3) > 0.3 ? 5 : 0.3, 0.15, 0.1);
  for (const s of signs) { const f = Math.sin(time * 1.3 + s.ph) > 0.985 ? 0.35 : 1; const v = s.base * f; s.m.material.color.setRGB(v, v, v); }
  grainPass.uniforms.uT.value = time % 10;
  composer.render();
  if (!QA && fpsT < 8 && mode === 'play') { fpsT += dt; fpsAcc += dt; fpsN++; if (fpsAcc > 2) { const fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; if (fps < 28 && PR > 0.8) { PR = Math.max(0.75, PR - 0.35); resize(); } } }
  const k = Math.round(Math.abs(vel) * 3.6); if (k !== kmhShown) { kmhShown = k; $('#kmh').textContent = k; }
  if ((frameNo++ & 1) === 0) drawRadar();
}
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!QA) frame(dt);
  requestAnimationFrame(loop);
}

/* ================= boot ================= */
async function boot() {
  const fonts = (document.fonts && document.fonts.load) ? Promise.all([document.fonts.load(`40px ${FONT_T}`), document.fonts.load(`40px ${FONT_S}`), document.fonts.load(`700 20px ${FONT_H}`)]).catch(() => {}) : Promise.resolve();
  await Promise.race([fonts, new Promise(r => setTimeout(r, 2500))]);
  setLoad(0.18, 'Building the city\u2026');
  await new Promise(r => setTimeout(r, 20));
  planCity(); buildRoad(); buildCity(); buildLamps(); buildPalms(); buildSigns(); setupPost(); resize();
  setLoad(0.3, 'Bringing your ' + CARS[0].name + '\u2026');
  const tr = buildTraffic();
  try { await loadCar(0, p => setLoad(0.3 + p * 0.65, 'Bringing your ' + CARS[0].name + ' ' + Math.round(p * 100) + '%')); mountCar(0); }
  catch (e) { setLoad(1, 'The car did not load. Check the connection and reload.'); console.warn(e); }
  await tr;
  setLoad(1, 'Ready');
  frame(0.016);
  setTimeout(() => $('#loader').classList.add('done'), 250);
  requestAnimationFrame(loop);
  window.__city = {
    state: () => ({ pos: Math.round(pos), vel: Math.round(vel), mode, cardStop, car: curCar, PR, L: Math.round(L), wheels: wheels.length, calls: renderer.info.render.calls, tris: renderer.info.render.triangles }),
    step: (n = 1, dt = 1 / 30) => { for (let i = 0; i < n; i++) frame(dt); return true; },
    start, goStop, pickCar: async i => { await pickCar(i); return curCar; }, openGarage,
    teleport: (i, off = 0) => { pos = target = STOPS[i].pos + off; vel = 0; autoTo = null; camInit = false; garageBlend = 1; return true; },
    orbit: v => { orbit = v; camInit = false; return true; },
    setPos: s => { pos = target = s; vel = 0; camInit = false; },
    drive: v => { vel = v; target = pos + 2000; autoTo = null; lastInput = 1e9; }
  };
}
addEventListener('resize', resize);
boot();
