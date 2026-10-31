(() => {
  const $ = s => document.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  // Lenis smooth scroll
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href'); const el = id.length > 1 && document.querySelector(id);
      if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: id === '#story' ? 0 : -60 }); }
    }));
  }

  // Header colour

  // Lettering prep
  const paths = [...document.querySelectorAll('#letterPaths path')];
  const lens = paths.map(p => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; return L; });

  // ---------- Water: WebGL ripple + ink ----------
  const canvas = $('#rippleCanvas'), waterImg = $('#waterImg');
  const W = { ripple: 0, ink: 0, cx: 0.5, cy: 0.6, active: false };
  let gl = null, prog, uni = {}, tex, glReady = false, ctx2d = null;
  const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  function sizeCanvas() {
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.max(2, Math.round(r.width * DPR)); canvas.height = Math.max(2, Math.round(r.height * DPR));
    if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
  }
  const VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;v.y=1.-v.y;gl_Position=vec4(p,0.,1.);}';
  const FS = `precision mediump float;varying vec2 v;uniform sampler2D t;uniform vec2 res;uniform vec2 img;uniform vec2 c;uniform float rp;uniform float ink;uniform float time;
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  float fbm(vec2 p){float s=0.,a=.5;for(int k=0;k<4;k++){s+=a*n(p);p*=2.03;a*=.5;}return s;}
  vec2 cover(vec2 uv){float ra=res.x/res.y,ia=img.x/img.y;vec2 s=ra>ia?vec2(1.,ia/ra):vec2(ra/ia,1.);return (uv-.5)*s+.5;}
  void main(){
    vec2 uv=v; float asp=res.x/res.y;
    vec2 d=uv-c; d.x*=asp; d.y*=2.4; float L=length(d); vec2 dir=L>0.?d/L:vec2(0.);
    float disp=0., light=0.;
    for(int k=0;k<4;k++){
      float r=rp*1.25-float(k)*.11; if(r<=0.)continue;
      float x=L-r; float env=exp(-x*x*700.)*(1.-rp*.75)*(1.-float(k)*.18);
      float w=sin(x*95.)*env; disp+=w; light+=w;
    }
    float amb=(fbm(uv*vec2(3.,9.)+vec2(time*.04,time*.02))-.5);
    vec2 duv=uv+dir*disp*.012/vec2(asp,2.4)+vec2(0.,amb*.004);
    vec3 col=texture2D(t,cover(duv)).rgb;
    col+=light*.10;
    // ink swirl
    if(ink>0.){
      vec2 q=uv-c; q.x*=asp; q.y*=1.7; float R=length(q);
      float a=4.5*ink*exp(-R*2.6)+time*.05; float cs=cos(a),sn=sin(a); q=mat2(cs,-sn,sn,cs)*q;
      float f=fbm(q*4.+vec2(time*.03,0.)+fbm(q*2.5)*1.6);
      float rad=ink*.62; float dens=smoothstep(rad,rad*.15,R+(f-.5)*.32)*smoothstep(.25,.62,f+ink*.25);
      vec3 dye=mix(vec3(.62,.42,.80),vec3(.30,.12,.45),smoothstep(.4,.8,f));
      col=mix(col,col*dye*1.25,clamp(dens*1.15,0.,.92));
    }
    gl_FragColor=vec4(col,1.);
  }`;
  function initGL() {
    try { gl = canvas.getContext('webgl', { premultipliedAlpha: false, antialias: false }); } catch (e) { gl = null; }
    if (!gl) { ctx2d = canvas.getContext('2d'); return; }
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    try {
      prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
    } catch (e) { gl = null; ctx2d = canvas.getContext('2d'); return; }
    gl.useProgram(prog);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    ['t', 'res', 'img', 'c', 'rp', 'ink', 'time'].forEach(k => uni[k] = gl.getUniformLocation(prog, k));
    tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const up = () => { try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, waterImg); glReady = true; draw(performance.now()); } catch (e) { gl = null; ctx2d = canvas.getContext('2d'); } };
    if (waterImg.complete && waterImg.naturalWidth) up(); else waterImg.addEventListener('load', up, { once: true });
  }
  function draw(now) {
    const t = now / 1000;
    if (gl && glReady) {
      gl.uniform1i(uni.t, 0); gl.uniform2f(uni.res, canvas.width, canvas.height);
      gl.uniform2f(uni.img, waterImg.naturalWidth, waterImg.naturalHeight);
      gl.uniform2f(uni.c, W.cx, W.cy); gl.uniform1f(uni.rp, W.ripple); gl.uniform1f(uni.ink, W.ink); gl.uniform1f(uni.time, t);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    } else if (ctx2d) {
      const c = ctx2d, w = canvas.width, h = canvas.height; c.clearRect(0, 0, w, h);
      const x = W.cx * w, y = W.cy * h;
      for (let k = 0; k < 4; k++) {
        const r = (W.ripple * 1.25 - k * 0.11) * w; if (r <= 0) continue;
        c.strokeStyle = `rgba(255,255,255,${0.5 * (1 - W.ripple)})`; c.lineWidth = 2 * DPR;
        c.beginPath(); c.ellipse(x, y, r, r / 2.4, 0, 0, Math.PI * 2); c.stroke();
      }
      if (W.ink > 0) { const g = c.createRadialGradient(x, y, 0, x, y, W.ink * w * 0.6); g.addColorStop(0, 'rgba(90,40,130,.55)'); g.addColorStop(1, 'rgba(90,40,130,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(x, y, W.ink * w * .6, W.ink * w * .35, 0, 0, Math.PI * 2); c.fill(); }
    }
  }
  let raf = 0;
  function loop(now) { draw(now); raf = W.active ? requestAnimationFrame(loop) : 0; }
  function setActive(on) { W.active = on; if (on && !raf) raf = requestAnimationFrame(loop); }
  sizeCanvas(); initGL();
  window.addEventListener('resize', () => { sizeCanvas(); draw(performance.now()); });

  // ---------- Story timeline ----------
  const prod = $('#prod'), dropper = $('#dropper'), drop = $('#drop'), stage = $('#stage');
  const S = { fall: 0 };
  function tipPos() {
    const r = dropper.getBoundingClientRect(), s = stage.getBoundingClientRect();
    return { x: r.left - s.left + r.width * 0.44, y: r.top - s.top + r.height * 0.995 };
  }
  const isWide = () => innerWidth > 820;
  const setCopy = () => gsap.set('.copy', { yPercent: isWide() ? -50 : 0 });
  setCopy(); ScrollTrigger.addEventListener('refreshInit', setCopy);
  const tl = gsap.timeline({ defaults: { ease: 'none' } });

  // 0: hero text leaves
  tl.to('#c1', { autoAlpha: 0, y: -40, duration: 0.8 }, 0.3)
  // 1: push-in
    .to('#field', { scale: 1.32, duration: 2.2, ease: 'power1.inOut' }, 0.4)
    .to('#sunglow', { opacity: 0.55, duration: 2.2 }, 0.4)
    .to(prod, { scale: () => isWide() ? 1.75 : 2.05, y: () => innerHeight * 0.24, duration: 2.2, ease: 'power1.inOut' }, 0.4)
    .fromTo('#c2', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.7 }, 1.5)
    .to('#c2', { autoAlpha: 0, y: -30, duration: 0.6 }, 2.7)
  // 2: dropper lift, camera tilts to the sky
    .to(dropper, { yPercent: () => -118, rotation: -3, duration: 1.8, ease: 'power2.inOut' }, 2.8)
    .to(prod, { scale: () => isWide() ? 1.35 : 1.5, y: () => innerHeight * 0.62, duration: 1.8, ease: 'power2.inOut' }, 2.8)
    .to('#field', { yPercent: 14, scale: 1.45, duration: 1.8, ease: 'power2.inOut' }, 2.8)
    .to(['.prod .ped', '.prod .body', '.cshadow', '.label-print'], { autoAlpha: 0, duration: 0.8 }, 3.9)
    .fromTo('#c3', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 3.4)
    .to('#c3', { autoAlpha: 0, y: -20, duration: 0.5 }, 4.6)
    .to(dropper, { rotation: 2, duration: 0.8, ease: 'sine.inOut' }, 4.6)
  // 3: lavender close-up
    .to(prod, { y: () => innerHeight * (isWide() ? 0.22 : 0.2), duration: 1.0, ease: 'power2.inOut' }, 4.7)
    .fromTo('#lav', { autoAlpha: 0, scale: 1.25 }, { autoAlpha: 1, scale: 1, duration: 1.2, ease: 'power1.out' }, 4.8)
    .fromTo('#c4', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 5.2)
    .to('#c4', { autoAlpha: 0, y: -20, duration: 0.5 }, 6.1)
  // 4: water, drop falls, ripple
    .to('#water', { autoAlpha: 1, duration: 0.8 }, 6.2)
    .to('#lav', { autoAlpha: 0, duration: 0.6 }, 6.6)
    .to(dropper, { rotation: 0, duration: 0.5 }, 6.4)
    .to(S, { fall: 1, duration: 0.7, ease: 'power2.in' }, 7.0)
    .to(W, { ripple: 1, duration: 2.2, ease: 'power1.out' }, 7.7)
    .fromTo('#c5', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 7.9)
    .to('#c5', { autoAlpha: 0, y: -20, duration: 0.5 }, 9.2)
    .to(dropper, { yPercent: -420, duration: 1.1, ease: 'power2.in' }, 8.4)
  // 5: ink swirl + lettering
    .to(W, { ink: 1, duration: 2.6, ease: 'power1.out' }, 8.6);
  const L0 = 9.2, LD = 2.4;
  paths.forEach((p, i) => {
    const at = L0 + (i / paths.length) * LD * 0.7;
    tl.to(p, { strokeDashoffset: 0, duration: LD * 0.42, ease: 'power1.inOut' }, at)
      .to(p, { fillOpacity: 0.9, duration: 0.5 }, at + LD * 0.35);
  });
  tl.to({}, { duration: 0.8 });

  const total = tl.duration();
  function onUpd(self) {
    $('#progBar').style.transform = `scaleY(${self.progress})`;
    const t = tl.time();
    setActive(t > 6.0 && t < total + 1);
    // drop
    if (S.fall > 0 && S.fall < 1) {
      const tp = tipPos(), wy = stage.clientHeight * W.cy;
      const y = tp.y + 6 + (wy - tp.y - 6) * S.fall;
      drop.style.opacity = 1; drop.style.transform = `translate(${tp.x}px,${y}px) scale(${1 - S.fall * 0.25})`;
      W.cx = tp.x / stage.clientWidth;
    } else if (t > 6.6 && t < 7.0) {
      const tp = tipPos(), g = (t - 6.6) / 0.4;
      drop.style.opacity = 1; drop.style.transform = `translate(${tp.x}px,${tp.y + 4 * g}px) scale(${0.4 + 0.6 * g})`;
      W.cx = tp.x / stage.clientWidth;
    } else { drop.style.opacity = 0; }
    if (!W.active) draw(performance.now());
  }
  ScrollTrigger.create({
    trigger: '#story', start: 'top top', end: () => '+=' + Math.round(innerHeight * (isWide() ? 7 : 7.5)),
    pin: '#stage', scrub: reduce ? true : 0.6, animation: tl, invalidateOnRefresh: true, anticipatePin: 1,
    onUpdate: onUpd, onRefresh: onUpd
  });

  const top = $('#top');
  ScrollTrigger.create({ trigger: '.ritual', start: 'top 60px', end: 'max', onToggle: s => top.classList.toggle('solid', s.isActive) });

  // ---------- Bag ----------
  let count = 0; const bagBtn = $('#bagBtn'), bagCount = $('#bagCount'), toast = $('#toast'); let tt;
  document.querySelectorAll('.add').forEach(b => b.addEventListener('click', () => {
    count++; bagCount.textContent = count; bagBtn.setAttribute('aria-label', `Bag, ${count} item${count > 1 ? 's' : ''}`);
    bagBtn.classList.remove('bump'); void bagBtn.offsetWidth; bagBtn.classList.add('bump');
    b.textContent = 'Added'; b.classList.add('done'); setTimeout(() => { b.textContent = 'Add to bag'; b.classList.remove('done'); }, 1600);
    toast.textContent = `${b.dataset.name} added to your bag. Concept demo, nothing is charged.`; toast.classList.add('show');
    clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 2600);
  }));
  bagBtn.addEventListener('click', () => {
    toast.textContent = count ? `${count} item${count > 1 ? 's' : ''} in your bag. Checkout is not part of this demo.` : 'Your bag is empty.';
    toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 2600);
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
  window.__story = { tl, W, S, lenis, st: () => ScrollTrigger.getAll() };
})();
