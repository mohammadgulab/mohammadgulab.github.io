import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.getElementById('gl');
const stage = canvas.parentElement;
const CH = window.QCH;

function fail(e){ console.warn('glass fallback', e && e.message); document.documentElement.classList.add('no-gl'); }

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) { fail(e); }

if (renderer) start().catch(fail);

function loadImg(src){ return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }

async function start(){
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x3a0409);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // ---------- backdrop: real rose photo, graded crimson, with vertical light streaks ----------
  const img = await loadImg('img/roses.webp');
  const bc = document.createElement('canvas'); bc.width = 1600; bc.height = 1600;
  const b = bc.getContext('2d');
  b.filter = 'blur(3px) saturate(1.25)';
  b.drawImage(img, 0, 0, 1600, 1600);
  b.filter = 'none';
  b.globalCompositeOperation = 'multiply';
  b.fillStyle = '#b3121f'; b.fillRect(0, 0, 1600, 1600);
  b.globalCompositeOperation = 'source-over';
  const vg = b.createRadialGradient(800, 760, 200, 800, 800, 1100);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(25,0,4,.75)');
  b.fillStyle = vg; b.fillRect(0, 0, 1600, 1600);
  b.globalCompositeOperation = 'screen';
  const streaks = [[180,70,.22],[420,40,.16],[640,110,.28],[930,55,.2],[1120,90,.25],[1390,60,.18]];
  for (const [x, w, a] of streaks){
    const g = b.createLinearGradient(x - w, 0, x + w, 0);
    g.addColorStop(0, 'rgba(255,60,60,0)'); g.addColorStop(.5, `rgba(255,90,80,${a})`); g.addColorStop(1, 'rgba(255,60,60,0)');
    b.fillStyle = g; b.fillRect(x - w, 0, w * 2, 1600);
  }
  b.globalCompositeOperation = 'source-over';
  const bgTex = new THREE.CanvasTexture(bc); bgTex.colorSpace = THREE.SRGBColorSpace;
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: bgTex, toneMapped: false }));
  bg.position.z = -6;
  scene.add(bg);

  // ---------- the glass shard ----------
  const pts = [[-1.38,1.92],[1.12,2.08],[1.58,-0.35],[0.78,-2.02],[-1.52,-1.6]];
  const shape = new THREE.Shape(); shape.moveTo(...pts[0]); for (let i = 1; i < pts.length; i++) shape.lineTo(...pts[i]); shape.closePath();
  const DEPTH = 0.22, BEV = 0.1;
  const geo = new THREE.ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: true, bevelThickness: BEV, bevelSize: BEV, bevelSegments: 4, curveSegments: 1 });
  geo.translate(0, 0, -DEPTH / 2);
  geo.computeVertexNormals();
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.16, transmission: 1, thickness: 1.4, ior: 1.52,
    clearcoat: 1, clearcoatRoughness: 0.04, attenuationColor: new THREE.Color(0xffe4de), attenuationDistance: 4,
    specularIntensity: 1, envMapIntensity: 2.2, iridescence: 0.22, iridescenceIOR: 1.3
  });
  const glass = new THREE.Mesh(geo, glassMat);
  const shard = new THREE.Group(); shard.add(glass); scene.add(shard);

  // etched words on both faces, drawn to canvas once fonts are ready
  try { await Promise.all([document.fonts.load('italic 200px "Instrument Serif"'), document.fonts.load('500 40px Inter')]); } catch (e) {}
  const W = 1024, H = 1344, PW = 2.62, PH = PW * H / W;
  function faceTex(i){
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    // soft reflection band, like light caught across the face
    const sh = x.createLinearGradient(0, 0, W, H);
    sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(.30, 'rgba(255,255,255,0)');
    sh.addColorStop(.40, 'rgba(255,240,236,.13)'); sh.addColorStop(.47, 'rgba(255,240,236,.03)');
    sh.addColorStop(.56, 'rgba(255,240,236,.08)'); sh.addColorStop(.62, 'rgba(255,255,255,0)');
    x.fillStyle = sh; x.fillRect(0, 0, W, H);
    x.fillStyle = '#fff8f4';
    x.shadowColor = 'rgba(60,0,8,.35)'; x.shadowBlur = 18;
    x.font = '500 40px Inter, sans-serif';
    x.globalAlpha = .82;
    x.fillText('0' + (i + 1) + '   ' + CH[i].n.toUpperCase(), 120, 300);
    x.globalAlpha = 1;
    let size = 220; x.font = `italic ${size}px "Instrument Serif", Georgia, serif`;
    while (x.measureText(CH[i].t).width > 820 && size > 120){ size -= 6; x.font = `italic ${size}px "Instrument Serif", Georgia, serif`; }
    x.fillText(CH[i].t, 112, 300 + size * 1.02);
    x.font = '400 50px Inter, sans-serif'; x.globalAlpha = .92;
    const words = CH[i].l.split(' '); let line = '', y = 300 + size * 1.02 + 86;
    for (const w of words){ const t = line ? line + ' ' + w : w; if (x.measureText(t).width > 700){ x.fillText(line, 120, y); line = w; y += 64; } else line = t; }
    x.fillText(line, 120, y);
    x.globalAlpha = .5; x.fillRect(120, y + 50, 90, 3);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }
  const texs = CH.map((_, i) => faceTex(i));
  const faceGeo = new THREE.PlaneGeometry(PW, PH);
  const mk = (tex) => new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false });
  const front = new THREE.Mesh(faceGeo, mk(texs[0])); front.position.set(-0.02, 0.02, DEPTH / 2 + BEV + 0.004);
  const back = new THREE.Mesh(faceGeo, mk(texs[1])); back.position.set(0.02, 0.02, -(DEPTH / 2 + BEV + 0.004)); back.rotation.y = Math.PI;
  front.renderOrder = back.renderOrder = 2;
  shard.add(front, back);

  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 5, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff6a5a, 1.4); rim.position.set(-5, -3, 2); scene.add(rim);

  // ---------- sizing ----------
  let baseScale = 1, baseY = 0, visH = 1, visW = 1;
  function resize(){
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    visH = 2 * 10 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)); visW = visH * camera.aspect;
    const sByW = (visW * (camera.aspect < 0.8 ? 0.86 : 0.42)) / 3.2;
    const sByH = (visH * (camera.aspect < 0.8 ? 0.52 : 0.66)) / 4.1;
    baseScale = Math.min(sByW, sByH);
    baseY = camera.aspect < 0.8 ? -visH * 0.03 : -visH * 0.02;
    // backdrop covers the view at its depth, with room to drift
    const d = 16, bh = 2 * d * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), bw = bh * camera.aspect;
    const sz = Math.max(bh, bw) * 1.25; bg.scale.set(sz, sz, 1);
  }
  resize(); addEventListener('resize', resize);

  // pointer tilt (desktop) 
  let px = 0, py = 0, tx = 0, ty = 0;
  addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; tx = (e.clientX / innerWidth - .5); ty = (e.clientY / innerHeight - .5); }, { passive: true });

  const ease = u => { const v = Math.min(1, Math.max(0, (u - 0.16) / 0.68)); return v < .5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; };
  let lastHud = -1, sp = 0, curF = 0, curB = 1, visible = true, intro = 0;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(stage);

  const clock = new THREE.Clock();
  function frame(){
    requestAnimationFrame(frame);
    if (!visible) return;
    const time = clock.getElapsedTime();
    intro = Math.min(1, intro + 0.018);
    const ie = 1 - Math.pow(1 - intro, 3);
    sp += (window.storyP - sp) * 0.1;
    const t = sp * 3, k = Math.min(2, Math.floor(t)), u = t - k;
    const n = k + ease(Math.min(1, u)) ;
    const angle = n * Math.PI;
    // which chapter sits on which face
    const c = Math.max(0, Math.min(3, Math.round(n)));
    const nb = Math.max(0, Math.min(3, n - c >= 0 ? c + 1 : c - 1));
    const f = c % 2 === 0 ? c : nb, bb = c % 2 === 1 ? c : nb;
    if (c !== lastHud){ lastHud = c; window.setChapter && window.setChapter(c); }
    if (f !== curF){ front.material.map = texs[f]; curF = f; }
    if (bb !== curB){ back.material.map = texs[bb]; curB = bb; }
    px += (tx - px) * 0.05; py += (ty - py) * 0.05;
    const spin = Math.sin(angle);
    shard.rotation.y = angle + Math.sin(time * 0.7) * 0.14 + px * 0.5 + (1 - ie) * -1.2;
    shard.rotation.x = -0.06 + spin * 0.22 + Math.sin(time * 0.9) * 0.05 + py * 0.3;
    shard.rotation.z = -0.07 + Math.sin(angle * 0.5) * 0.1 + Math.sin(time * 0.55) * 0.035;
    const s = baseScale * (0.86 + 0.14 * ie) * (1 - Math.abs(spin) * 0.06);
    shard.scale.setScalar(s);
    shard.position.set(spin * visW * 0.04, baseY + Math.sin(time * 1.15) * 0.09 + (1 - ie) * -0.6, 0);
    bg.position.set(-px * 0.6, sp * 1.8 - 0.9 - py * 0.4, -6);
    bg.rotation.z = sp * 0.06;
    rim.position.x = -5 + Math.sin(time * 0.4) * 2;
    renderer.render(scene, camera);
  }
  frame();
  window.__glOK = true;
}
