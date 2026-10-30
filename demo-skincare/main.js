// Aurelle: real photo jar, scroll choreography with GSAP, gentle float and tilt
const loader=document.getElementById('loader');
const done=()=>loader.classList.add('done');

// bag
let bag=0; const toast=document.getElementById('toast');
document.querySelectorAll('.add').forEach(b=>b.addEventListener('click',()=>{bag++;document.getElementById('bagCount').textContent=bag;
  const n=b.closest('.card').querySelector('h3').textContent; toast.textContent=n+' added to bag'; toast.classList.add('show'); clearTimeout(toast._t); toast._t=setTimeout(()=>toast.classList.remove('show'),1800);}));

gsap.registerPlugin(ScrollTrigger);
function reveals(){
  gsap.utils.toArray('.hero .reveal').forEach((el,i)=>gsap.from(el,{y:50,opacity:0,duration:1.3,delay:.35+i*.12,ease:'power3.out'}));
  gsap.utils.toArray('.reveal').filter(el=>!el.closest('.hero')).forEach(el=>gsap.from(el,{y:46,opacity:0,duration:1.1,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 97%',toggleActions:'play none none reverse'}}));
}

const $=id=>document.getElementById(id);
const stage=$('stage'), rig=$('rig'), tilt=$('tilt'), jarC=$('jarC'), jarO=$('jarO');
const b1=$('b1'), b2=$('b2'), b3=$('b3'), b4=$('b4');

// scroll states: x,y = centre in viewport fractions, w = jar width in px, r = roll (deg)
// c = closed jar opacity, bl = hero blooms (0 hidden), pk = big peony behind the open jar
function states(){
  const vw=innerWidth, vh=innerHeight, mob=vw<760;
  if(mob){
    const w=Math.min(vw*0.6,310);
    return [
      {x:.5, y:.31, w:w,      r:0,  c:1, bl:1, pk:0, pr:0},
      {x:.5, y:.26, w:w*0.92, r:-7, c:1, bl:0, pk:0, pr:0},
      {x:.5, y:.25, w:w*0.82, r:0,  c:0, bl:0, pk:1, pr:-8},
      {x:.5, y:.53, w:Math.min(vw*0.66,330), r:0, c:0, bl:0, pk:1, pr:20}];
  }
  const w=Math.max(260,Math.min(vw*0.29,440,vh*0.5));
  return [
    {x:.70, y:.53, w:w,      r:0,  c:1, bl:1, pk:0, pr:0},
    {x:.70, y:.50, w:w*1.12, r:-7, c:1, bl:0, pk:0, pr:0},
    {x:.69, y:.50, w:w*0.95, r:0,  c:0, bl:0, pk:1, pr:-8},
    {x:.50, y:.50, w:w*0.92, r:0,  c:0, bl:0, pk:1, pr:20}];
}
const st={...states()[0]};
const intro={k:0};
let tl;
function buildTimeline(){
  if(tl){ tl.scrollTrigger.kill(); tl.kill(); }
  const A=states(); Object.assign(st,A[0]);
  tl=gsap.timeline({defaults:{ease:'power1.inOut',duration:1},scrollTrigger:{trigger:'main',start:'top top',endTrigger:'#collection',end:'top 60%',scrub:1.1}});
  for(let i=1;i<A.length;i++) tl.to(st,{...A[i]},i-1);
  tl.to({},{duration:0.6});
}

// pointer on desktop, phone tilt on mobile (no permission prompt; ignored if unavailable)
const pointer={x:0,y:0,tx:0,ty:0};
addEventListener('pointermove',e=>{ if(e.pointerType==='mouse'){ pointer.tx=(e.clientX/innerWidth-.5); pointer.ty=(e.clientY/innerHeight-.5);} });
addEventListener('deviceorientation',e=>{ if(e.gamma==null) return; pointer.tx=Math.max(-.5,Math.min(.5,e.gamma/40)); pointer.ty=Math.max(-.5,Math.min(.5,(e.beta-45)/50)); });
let touchX=null;
addEventListener('touchmove',e=>{ const t=e.touches[0]; if(!t) return; pointer.tx=(t.clientX/innerWidth-.5)*0.6; },{passive:true});

let lastW=innerWidth,lastH=innerHeight;
addEventListener('resize',()=>{ if(innerWidth!==lastW||Math.abs(innerHeight-lastH)>140){ lastW=innerWidth; lastH=innerHeight; buildTimeline(); ScrollTrigger.refresh(); } });

const coll=$('collection');
const t0=performance.now();
function frame(now){
  requestAnimationFrame(frame);
  if(coll.getBoundingClientRect().top<=0){ stage.style.visibility='hidden'; return; }
  stage.style.visibility='visible';
  const t=(now-t0)/1000, k=intro.k;
  pointer.x+=(pointer.tx-pointer.x)*0.06; pointer.y+=(pointer.ty-pointer.y)*0.06;
  const vw=innerWidth, vh=innerHeight;
  const fy=Math.sin(t*1.1)*st.w*0.022;
  rig.style.width=st.w+'px';
  rig.style.transform=`translate3d(${st.x*vw}px,${st.y*vh + fy + (1-k)*40}px,0) translate(-50%,-50%) scale(${0.86+0.14*k})`;
  rig.style.opacity=k;
  const ry=Math.sin(t*0.5)*5 + pointer.x*14, rx=Math.cos(t*0.42)*2 - pointer.y*8;
  tilt.style.transform=`perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) rotate(${st.r}deg)`;
  jarC.style.opacity=st.c; jarO.style.opacity=1-st.c;
  jarC.style.transform=`scale(${0.92+0.08*st.c})`; jarO.style.transform=`scale(${1-0.08*st.c})`;
  // hero blooms: parallax against the jar, slow sway, drop away on scroll
  const px=-pointer.x*18, py=-pointer.y*10, drop=(1-st.bl)*st.w*0.9;
  b1.style.transform=`translate3d(${px*1.4}px,${py+drop*1.2}px,0) rotate(${Math.sin(t*0.35)*1.6}deg)`;
  b2.style.transform=`translate3d(${px*0.7}px,${py*0.6+drop}px,0) rotate(${10+Math.sin(t*0.3+2)*1.5}deg)`;
  b3.style.transform=`translate3d(${px*0.8}px,${py*0.7+drop}px,0) scaleX(-1) rotate(${8+Math.sin(t*0.33+4)*1.5}deg)`;
  b1.style.opacity=b2.style.opacity=b3.style.opacity=st.bl;
  // big peony behind the open jar
  b4.style.opacity=st.pk;
  b4.style.transform=`translate(-50%,-50%) translate3d(${px*0.6}px,${py*0.6}px,0) scale(${0.85+0.15*st.pk}) rotate(${st.pr+Math.sin(t*0.25)*2}deg)`;
}

function start(){
  buildTimeline(); requestAnimationFrame(frame);
  done(); gsap.to(intro,{k:1,duration:1.6,ease:'power3.out'}); reveals(); window.SITE_READY=true;
}
const imgs=[jarC,jarO,b1,b2].map(im=>im.decode?im.decode().catch(()=>{}):Promise.resolve());
Promise.race([Promise.all(imgs),new Promise(r=>setTimeout(r,2500))]).then(start);
