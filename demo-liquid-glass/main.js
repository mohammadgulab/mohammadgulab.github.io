(()=>{
"use strict";
const DPR=Math.min(window.devicePixelRatio||1,1.5);
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const $=(s,r=document)=>r.querySelector(s);
const hasGSAP=!!(window.gsap&&window.ScrollTrigger);
if(hasGSAP){gsap.registerPlugin(ScrollTrigger);ScrollTrigger.config({ignoreMobileResize:true});}
window.__mawj={fps:0,jelly:false,glass:false,lgl:"pending"};

/* ---------- WebGL helpers ---------- */
function glCtx(c,opts){
  try{return c.getContext("webgl",opts)||c.getContext("experimental-webgl",opts);}catch(e){return null;}
}
function prog(gl,vs,fs){
  const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS)){throw new Error(gl.getShaderInfoLog(o)||"shader");}return o;};
  const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,vs));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error("link");
  const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(p,"aP");gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  gl.useProgram(p);
  const U={};const n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);for(let i=0;i<n;i++){const u=gl.getActiveUniform(p,i);U[u.name]=gl.getUniformLocation(p,u.name);}
  return U;
}
function tex(gl,src,unit,mip){
  const t=gl.createTexture();gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  if(mip){gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);}
  else gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  return t;
}
const VS="attribute vec2 aP;varying vec2 vUv;void main(){vUv=aP*.5+.5;gl_Position=vec4(aP,0.,1.);}";
const loadImg=src=>new Promise((res,rej)=>{const i=new Image();i.decoding="async";i.onload=()=>res(i);i.onerror=rej;i.src=src;});
const inView=(el,cb)=>{const io=new IntersectionObserver(es=>es.forEach(e=>cb(e.isIntersecting)),{rootMargin:"120px"});io.observe(el);};

/* ---------- Jellyfish (real photo, living shader) ---------- */
const JFS=`precision mediump float;varying vec2 vUv;uniform sampler2D uJ;uniform float uT;
void main(){
  vec2 uv=vec2(vUv.x,1.-vUv.y);
  float pulse=sin(uT*1.7);
  float bell=1.-smoothstep(.18,.42,uv.y);
  // bell breathes: squeeze in x, stretch in y
  uv.x=.5+(uv.x-.5)*(1.+.045*pulse*bell);
  uv.y=uv.y+.012*pulse*bell*(.4-uv.y);
  // arms and tentacles trail and sway, more toward the tips
  float k=smoothstep(.3,1.,uv.y);
  uv.x+=k*(.022*sin(uv.y*9.-uT*1.9)+.012*sin(uv.y*17.-uT*2.7+1.3));
  uv.y+=k*.008*sin(uT*1.7-1.2);
  vec4 c=texture2D(uJ,uv);
  float edge=step(0.,uv.x)*step(uv.x,1.)*step(0.,uv.y)*step(uv.y,1.);
  c.a*=edge;
  // faint iridescent sheen
  float sh=.5+.5*sin(uv.y*14.+uv.x*6.-uT*1.2);
  c.rgb+=vec3(.06,.02,.10)*sh*c.a;
  gl_FragColor=vec4(c.rgb*c.a,c.a);
}`;
async function initJelly(){
  const c=$(".jelly-canvas"),wrap=$(".jelly-wrap");
  const gl=glCtx(c,{premultipliedAlpha:true,alpha:true,antialias:false});
  if(!gl)throw new Error("no gl");
  const img=await loadImg("img/jelly.webp");
  const U=prog(gl,VS,JFS);tex(gl,img,0,false);gl.uniform1i(U.uJ,0);
  gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  const size=()=>{const r=wrap.getBoundingClientRect();c.width=Math.max(2,Math.round(r.width*DPR));c.height=Math.max(2,Math.round(r.height*DPR));gl.viewport(0,0,c.width,c.height);};
  size();addEventListener("resize",size);
  let on=true;inView(wrap,v=>on=v);
  const t0=performance.now();
  const loop=now=>{requestAnimationFrame(loop);if(!on)return;gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform1f(U.uT,(now-t0)/1000);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);};
  requestAnimationFrame(loop);window.__mawj.jelly=true;
}

/* ---------- Liquid glass stage (own refraction shader) ---------- */
const GFS=`precision highp float;
uniform vec2 uRes;uniform float uT,uD;uniform sampler2D uBg,uTx;uniform vec2 uBgS;
uniform vec4 uL;uniform float uLR;uniform vec4 uC;uniform float uCR;
float sdRB(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
vec3 bgAt(vec2 p,float bias){
  vec2 uv=p/uRes;
  vec2 c=(uv-.5)*uBgS/1.1+.5+vec2(sin(uT*.11),cos(uT*.08))*.035;
  c+=.008*vec2(sin(c.y*7.+uT*.7),cos(c.x*6.+uT*.6));
  vec3 col=texture2D(uBg,c,bias).rgb;
  vec4 t=texture2D(uTx,clamp(uv,0.,1.),bias);
  return mix(col,t.rgb,t.a);
}
float shadowOf(vec2 p,vec4 S,float r,float soft){float d=sdRB(p-S.xy-vec2(0.,14.*uD),S.zw,r);return exp(-max(d,0.)/(soft*uD))*smoothstep(-20.*uD,0.,d);}
vec3 glassAt(vec2 p,vec4 S,float r,float mag,float refr,float bias,vec3 tint,float tintA,out float m){
  vec2 lp=p-S.xy;float d=sdRB(lp,S.zw,r);
  m=clamp(.5-d/(1.2*uD),0.,1.);
  float e=1.;vec2 n=vec2(0.);
  float ex=sdRB(lp+vec2(1.,0.),S.zw,r)-sdRB(lp-vec2(1.,0.),S.zw,r);
  float ey=sdRB(lp+vec2(0.,1.),S.zw,r)-sdRB(lp-vec2(0.,1.),S.zw,r);
  n=normalize(vec2(ex,ey)+1e-5);
  float bev=min(S.z,S.w)*.62;
  float t=clamp(-d/bev,0.,1.);
  float edge=pow(1.-t,2.2);
  float disp=edge*refr*min(S.z,S.w);
  vec2 base=S.xy+lp/mag;
  vec2 o=n*disp;
  float ca=.18+.5*edge;
  vec3 col;
  col.r=bgAt(base+o*(1.+ca),bias).r;
  col.g=bgAt(base+o,bias).g;
  col.b=bgAt(base+o*(1.-ca),bias).b;
  col=mix(col,tint,tintA);
  col*=1.04;
  vec2 L=normalize(vec2(-.55,-.85));
  float spec=max(dot(n,L),0.);float spec2=max(dot(n,-L),0.);
  float rim=smoothstep(2.6*uD,0.,abs(d+1.3*uD));
  float inner=pow(1.-t,5.);
  col+=vec3(1.)*(rim*(.25+.75*pow(spec,1.5))+inner*.32*pow(spec,2.)+rim*.35*pow(spec2,2.)+inner*.12*spec2);
  // moving caustic glint
  float g=smoothstep(.985,1.,sin((lp.x+lp.y)/(S.z*.9)-uT*1.3));
  col+=g*.1*(1.-t*.6);
  return col;
}
void main(){
  vec2 p=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y);
  vec3 col=bgAt(p,0.);
  col*=1.-.38*shadowOf(p,uC,uCR,26.);
  float mc;vec3 cg=glassAt(p,uC,uCR,1.04,.55,3.2,vec3(.05,.02,.12),.28,mc);
  col=mix(col,cg,mc);
  col*=1.-.32*shadowOf(p,uL,uLR,22.);
  float ml;vec3 lg=glassAt(p,uL,uLR,1.32,.85,0.,vec3(1.),.03,ml);
  col=mix(col,lg,ml);
  gl_FragColor=vec4(col,1.);
}`;
function potCanvas(w,h){const c=document.createElement("canvas");c.width=w;c.height=h;return c;}
async function initGlass(){
  const stage=$("#stage"),c=$("#glass"),hit=$("#lensHit"),player=$("#player");
  const gl=glCtx(c,{alpha:false,antialias:false,preserveDrawingBuffer:false});
  if(!gl)throw new Error("no gl");
  const bgImg=await loadImg("img/bg-neon.webp");
  // background as a power-of-two texture with mipmaps (mip bias = cheap frosted blur)
  const bgc=potCanvas(1024,1024);bgc.getContext("2d").drawImage(bgImg,0,0,1024,1024);
  const U=prog(gl,VS,GFS);
  tex(gl,bgc,0,true);gl.uniform1i(U.uBg,0);
  let txTex=null;
  let W=0,H=0;
  const drawText=()=>{
    const pw=W>H?2048:1024,ph=W>H?1024:2048;
    const tc=potCanvas(pw,ph),x=tc.getContext("2d");
    x.scale(pw/W,ph/H);
    x.textAlign="center";x.textBaseline="middle";
    const fs=Math.min(W*.30,H*.2);
    x.font=`${fs}px Anton, Impact, sans-serif`;
    x.fillStyle="rgba(255,255,255,.95)";
    const big=W>H;
    const lines=big?[["LIQUID",.30],["GLASS",.56],["MAWJ",.82]]:[["LIQUID",.16],["GLASS",.33],["MAWJ",.50]];
    lines.forEach(([s,y],i)=>{
      if(i===1){x.lineWidth=Math.max(2,fs*.025);x.strokeStyle="rgba(255,255,255,.95)";x.strokeText(s,W/2,H*y);}
      else x.fillText(s,W/2,H*y);
    });
    // fine grid of dots so the bending reads everywhere
    x.fillStyle="rgba(255,255,255,.35)";
    const g=Math.max(18,W/18);
    for(let yy=g/2;yy<H;yy+=g)for(let xx=g/2;xx<W;xx+=g){x.beginPath();x.arc(xx,yy,1.3,0,6.283);x.fill();}
    if(txTex)gl.deleteTexture(txTex);
    txTex=tex(gl,tc,1,true);gl.uniform1i(U.uTx,1);
  };
  const size=()=>{
    const r=stage.getBoundingClientRect();W=r.width;H=r.height;
    c.width=Math.round(W*DPR);c.height=Math.round(H*DPR);gl.viewport(0,0,c.width,c.height);
    gl.uniform2f(U.uRes,c.width,c.height);gl.uniform1f(U.uD,DPR);
    const ia=bgImg.width/bgImg.height,sa=W/H;
    gl.uniform2f(U.uBgS,sa>ia?1:sa/ia,sa>ia?ia/sa:1);
    drawText();
  };
  if(document.fonts&&document.fonts.ready){try{await document.fonts.ready;}catch(e){}}
  size();
  let rt;addEventListener("resize",()=>{clearTimeout(rt);rt=setTimeout(size,150);});

  // lens + card geometry (css px)
  const lens={x:0,y:0,w:170,h:118,dragging:false,last:0,ox:0,oy:0};
  const card={x:0,y:0,w:300,h:184};
  const path=t=>{
    const phone=W<700;
    const cx=W/2,cy=phone?H*.30:H*.42;
    const ax=phone?W*.30:W*.32,ay=phone?H*.15:H*.22;
    return[cx+Math.sin(t*.55)*ax,cy+Math.sin(t*.9+.6)*ay];
  };
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  // drag
  let pid=null;
  hit.addEventListener("pointerdown",e=>{pid=e.pointerId;hit.setPointerCapture(pid);lens.dragging=true;lens.ox=e.clientX-lens.x;lens.oy=e.clientY-lens.y;hit.classList.add("used");e.preventDefault();});
  hit.addEventListener("pointermove",e=>{if(!lens.dragging||e.pointerId!==pid)return;lens.x=clamp(e.clientX-lens.ox,lens.w/2,W-lens.w/2);lens.y=clamp(e.clientY-lens.oy,lens.h/2,H-lens.h/2);});
  const up=()=>{lens.dragging=false;lens.last=performance.now();pid=null;};
  hit.addEventListener("pointerup",up);hit.addEventListener("pointercancel",up);
  hit.addEventListener("keydown",e=>{const s=24,k=e.key;if(!/Arrow/.test(k))return;e.preventDefault();lens.last=performance.now()+4000;hit.classList.add("used");
    if(k==="ArrowLeft")lens.x-=s;if(k==="ArrowRight")lens.x+=s;if(k==="ArrowUp")lens.y-=s;if(k==="ArrowDown")lens.y+=s;lens.x=clamp(lens.x,lens.w/2,W-lens.w/2);lens.y=clamp(lens.y,lens.h/2,H-lens.h/2);});
  [lens.x,lens.y]=path(0);
  let on=false;inView(stage,v=>on=v);
  const t0=performance.now();let frames=0,fpsT=t0;
  const loop=now=>{
    requestAnimationFrame(loop);
    if(!on)return;
    const t=(now-t0)/1000;
    const phone=W<700;
    lens.w=phone?Math.min(176,W*.44):220;lens.h=phone?lens.w*.68:150;
    card.w=Math.min(320,W-40);card.h=184;
    // auto float until touched; resume 4 s after release
    if(!lens.dragging&&now-lens.last>4000){const[px,py]=path(t);const k=lens.last?0.04:1;lens.x+=(px-lens.x)*k;lens.y+=(py-lens.y)*k;}
    card.x=W/2+Math.sin(t*.6)*(phone?6:40);
    card.y=(phone?H*.76:H*.74)+Math.sin(t*.8+1)*10;
    hit.style.width=lens.w+"px";hit.style.height=lens.h+"px";hit.style.borderRadius=(lens.h/2)+"px";
    hit.style.transform=`translate3d(${lens.x-lens.w/2}px,${lens.y-lens.h/2}px,0)`;
    player.style.width=card.w+"px";
    player.style.transform=`translate3d(${card.x-card.w/2}px,${card.y-card.h/2}px,0)`;
    gl.uniform1f(U.uT,t);
    gl.uniform4f(U.uL,lens.x*DPR,lens.y*DPR,lens.w/2*DPR,lens.h/2*DPR);gl.uniform1f(U.uLR,lens.h/2*DPR);
    gl.uniform4f(U.uC,card.x*DPR,card.y*DPR,card.w/2*DPR,card.h/2*DPR);gl.uniform1f(U.uCR,30*DPR);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    frames++;if(now-fpsT>1000){window.__mawj.fps=Math.round(frames*1000/(now-fpsT));frames=0;fpsT=now;}
  };
  requestAnimationFrame(loop);window.__mawj.glass=true;window.__mawj.lens=lens;
}
function glassFallback(){
  // CSS backdrop-filter glass: same lens + card, moved by JS
  const stage=$("#stage"),hit=$("#lensHit"),player=$("#player");
  const lens={x:120,y:200,w:170,h:118,dragging:false,last:0};let ox=0,oy=0,pid=null;
  hit.addEventListener("pointerdown",e=>{pid=e.pointerId;hit.setPointerCapture(pid);lens.dragging=true;ox=e.clientX-lens.x;oy=e.clientY-lens.y;hit.classList.add("used");e.preventDefault();});
  hit.addEventListener("pointermove",e=>{if(lens.dragging&&e.pointerId===pid){lens.x=e.clientX-ox;lens.y=e.clientY-oy;}});
  hit.addEventListener("pointerup",()=>{lens.dragging=false;lens.last=performance.now();});
  const t0=performance.now();
  const loop=now=>{requestAnimationFrame(loop);const r=stage.getBoundingClientRect(),W=r.width,H=r.height,t=(now-t0)/1000;
    if(!lens.dragging&&now-lens.last>4000){lens.x+=((W/2+Math.sin(t*.55)*W*.3)-lens.x)*.05;lens.y+=((H*.3+Math.sin(t*.9)*H*.14)-lens.y)*.05;}
    hit.style.transform=`translate3d(${lens.x-lens.w/2}px,${lens.y-lens.h/2}px,0)`;
    const cw=Math.min(320,W-40);player.style.width=cw+"px";player.style.transform=`translate3d(${W/2-cw/2}px,${H*.76-92+Math.sin(t*.8)*10}px,0)`;};
  requestAnimationFrame(loop);
}

/* ---------- Player UI ---------- */
function initPlayer(){
  const tracks=[["Tide Lines","MAWJ Sound Lab","img/art-orchid.webp","Album art: swirling orchid and violet paint",198],["Corniche at Dusk","MAWJ Sound Lab","img/art-ember.webp","Album art: molten red and amber paint",224],["Reef Glow","MAWJ Sound Lab","img/art-lagoon.webp","Album art: teal and green marbled paint",187]];
  let i=0,pos=42,playing=true,last=performance.now();
  const bar=$("#pbar"),time=$("#ptime"),btn=$("#play"),art=$(".player-art"),title=$(".player-title"),dur=$(".player-time span:last-child");
  const fmt=s=>Math.floor(s/60)+":"+String(Math.floor(s%60)).padStart(2,"0");
  const set=k=>{i=(i+k+tracks.length)%tracks.length;const t=tracks[i];title.textContent=t[0];art.src=t[2];art.alt=t[3];dur.textContent=fmt(t[4]);pos=0;
    if(hasGSAP)gsap.fromTo(art,{rotate:-12,scale:.8},{rotate:0,scale:1,duration:.6,ease:"back.out(2)"});};
  $("#next").addEventListener("click",()=>set(1));$("#prev").addEventListener("click",()=>set(-1));
  btn.addEventListener("click",()=>{playing=!playing;btn.setAttribute("aria-pressed",String(playing));btn.setAttribute("aria-label",playing?"Pause":"Play");});
  const tick=now=>{requestAnimationFrame(tick);const dt=(now-last)/1000;last=now;if(playing){pos+=dt;if(pos>tracks[i][4])set(1);}
    bar.style.width=(pos/tracks[i][4]*100).toFixed(2)+"%";time.textContent=fmt(pos);};
  requestAnimationFrame(tick);
}

/* ---------- 3D text ring ---------- */
function initRing(){
  const ring=$("#ring");const txt="MAWJ STUDIO • JEDDAH • DESIGN • MOTION • ";
  const chars=[...txt];const n=chars.length;
  const build=()=>{
    const vw=Math.min(innerWidth,1200);const r=Math.min(vw*.40,260);
    const fs=Math.min(58,(2*Math.PI*r/n)/0.56);
    ring.innerHTML="";ring.style.setProperty("--rs",fs+"px");
    chars.forEach((ch,k)=>{const s=document.createElement("span");s.textContent=ch;s.style.transform=`rotateY(${k*360/n}deg) translateZ(${r}px)`;ring.appendChild(s);});
  };
  build();let t;addEventListener("resize",()=>{clearTimeout(t);t=setTimeout(build,200);});
  if(!hasGSAP){ring.animate([{transform:"rotateY(0deg)"},{transform:"rotateY(-360deg)"}],{duration:16000,iterations:Infinity});return;}
  const spin=gsap.to(ring,{rotationY:-360,duration:16,ease:"none",repeat:-1});
  ScrollTrigger.create({trigger:".ring-sec",start:"top bottom",end:"bottom top",onUpdate:s=>{const v=Math.min(Math.abs(s.getVelocity())/400,6);gsap.to(spin,{timeScale:1+v,duration:.2,overwrite:true,onComplete:()=>gsap.to(spin,{timeScale:1,duration:1.2})});}});
}

/* ---------- Hero kinetic type ---------- */
function initHero(){
  document.querySelectorAll(".word").forEach(w=>{const s=document.createElement("span");s.className="in";s.style.display="inline-block";s.textContent=w.textContent;w.textContent="";w.appendChild(s);});
  if(!hasGSAP)return;
  const vw=()=>innerWidth;
  const w1=$(".w1"),w2=$(".w2"),w3=$(".w3"),jw=$(".jelly-wrap");
  // idle drift so the type is alive before any scroll
  gsap.to(".w1 .in",{x:()=>-vw()*.06,duration:5,ease:"sine.inOut",yoyo:true,repeat:-1});
  gsap.to(".w2 .in",{x:()=>vw()*.06,duration:6,ease:"sine.inOut",yoyo:true,repeat:-1});
  gsap.to(".w3 .in",{x:()=>-vw()*.05,duration:5.5,ease:"sine.inOut",yoyo:true,repeat:-1});
  // jellyfish floats on its own
    gsap.to(jw,{y:-18,rotation:3,duration:3.4,ease:"sine.inOut",yoyo:true,repeat:-1});
  const tl=gsap.timeline({scrollTrigger:{trigger:".hero",start:"top top",end:"+=150%",pin:true,scrub:.6,invalidateOnRefresh:true}});
  tl.fromTo(w1,{x:()=>vw()*.08},{x:()=>-(w1.scrollWidth-vw()*.55),ease:"none"},0)
    .fromTo(w2,{x:()=>-(w2.scrollWidth-vw()*.9)},{x:()=>vw()*.05,ease:"none"},0)
    .fromTo(w3,{x:()=>vw()*.2},{x:()=>-(w3.scrollWidth-vw()*.4),ease:"none"},0)
    .to(".jelly-canvas,.jelly-img",{scale:1.18,rotation:-6,y:()=>-innerHeight*.06,ease:"none"},0)
    .to(".hero-copy",{opacity:0,y:-30,ease:"none",duration:.3},0)
    .to(".scroll-cue",{opacity:0,ease:"none",duration:.2},0);
}

/* ---------- Cards ---------- */
function initCards(){
  if(!hasGSAP)return;
  document.querySelectorAll(".card").forEach((c,k)=>{
    gsap.fromTo(c.querySelector(".card-img img"),{yPercent:-6},{yPercent:6,ease:"none",scrollTrigger:{trigger:c,start:"top bottom",end:"bottom top",scrub:true}});
    gsap.from(c,{y:60,opacity:0,duration:.9,ease:"power3.out",delay:(k%2)*.08,scrollTrigger:{trigger:c,start:"top 92%",once:true}});
  });
  gsap.from(".contact-glass",{y:50,opacity:0,duration:.9,ease:"power3.out",scrollTrigger:{trigger:".contact",start:"top 85%",once:true}});
}

/* ---------- liquidGL nav ---------- */
function initNavGlass(){
  const nav=$(".nav-glass");
  if(typeof window.liquidGL!=="function"){window.__mawj.lgl="missing";return;}
  try{
    window.liquidGL({engine:"webgl2",target:".nav-glass",snapshot:"body",resolution:1.25,refraction:.018,bevelDepth:.09,bevelWidth:.22,frost:1.5,aberration:.35,specular:true,shadow:true,reveal:"none",
      on:{init(){nav.classList.add("lgl-on");window.__mawj.lgl="on";}}});
  }catch(e){window.__mawj.lgl="failed";}
}

/* ---------- Form ---------- */
function initForm(){
  const f=$("#form"),note=$("#formNote");
  f.addEventListener("submit",e=>{e.preventDefault();const n=(f.name.value||"").trim();note.textContent=(n?`Thanks ${n}. `:"Thanks. ")+"This is a concept demo, so nothing was sent.";});
}

initHero();initPlayer();initRing();initCards();initForm();
Promise.all([initJelly().catch(e=>{throw e;}),initGlass()]).catch(()=>{document.documentElement.classList.add("no-gl");if(!window.__mawj.glass)glassFallback();});
const lgl=()=>setTimeout(initNavGlass,300);
if(document.readyState==="complete")lgl();else addEventListener("load",lgl);
addEventListener("load",()=>{if(hasGSAP)ScrollTrigger.refresh();});
})();
